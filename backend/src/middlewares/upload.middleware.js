const multer = require("multer");
const path = require("path");
const sharp = require("sharp");
const fs = require("fs");
const crypto = require("crypto");

const uploadPath =
  process.env.NODE_ENV === "production"
    ? "/opt/render/project/src/uploads"
    : path.join(__dirname, "../../uploads");

const watermarkPath =
  process.env.WATERMARK_PATH ||
  path.join(__dirname, "../assets/watermark.png");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

function sanitizeFilename(filename) {
  return (
    String(filename || "imagem")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-+/g, "-")
      .toLowerCase() || "imagem"
  );
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadPath);
  },
  filename(req, file, cb) {
    const safeName = sanitizeFilename(file.originalname);
    const uniqueId = crypto.randomBytes(6).toString("hex");
    cb(null, `${Date.now()}-${uniqueId}-${safeName}.upload`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp"
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Envie apenas imagens JPG, PNG ou WEBP."));
  }

  return cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 20
  }
});

function getNumberEnv(name, fallback, min, max) {
  const value = Number(process.env[name]);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

function getWatermarkPosition() {
  const position = String(
    process.env.WATERMARK_POSITION || "southeast"
  ).toLowerCase();

  const allowed = [
    "northwest",
    "north",
    "northeast",
    "west",
    "center",
    "east",
    "southwest",
    "south",
    "southeast"
  ];

  return allowed.includes(position) ? position : "southeast";
}

async function createWatermarkBuffer(imageWidth) {
  if (!fs.existsSync(watermarkPath)) {
    console.warn("Marca d'água não encontrada:", watermarkPath);
    return null;
  }

  try {
    const widthPercent = getNumberEnv(
      "WATERMARK_WIDTH_PERCENT",
      24,
      5,
      70
    );

    const opacity = getNumberEnv(
      "WATERMARK_OPACITY",
      0.32,
      0.05,
      1
    );

    const watermarkWidth = Math.max(
      100,
      Math.floor(imageWidth * (widthPercent / 100))
    );

    const logoBuffer = await sharp(watermarkPath)
      .resize({
        width: watermarkWidth,
        withoutEnlargement: true,
        fit: "inside"
      })
      .ensureAlpha()
      .png()
      .toBuffer();

    const metadata = await sharp(logoBuffer).metadata();

    if (!metadata.width || !metadata.height) {
      console.warn("Não foi possível ler o tamanho do watermark.");
      return null;
    }

    const alphaBuffer = await sharp({
      create: {
        width: metadata.width,
        height: metadata.height,
        channels: 1,
        background: {
          r: Math.round(255 * opacity)
        }
      }
    })
      .raw()
      .toBuffer();

    return sharp(logoBuffer)
      .removeAlpha()
      .joinChannel(alphaBuffer, {
        raw: {
          width: metadata.width,
          height: metadata.height,
          channels: 1
        }
      })
      .png()
      .toBuffer();
  } catch (error) {
    console.error("Falha ao preparar marca d'água:", error.message);
    return null;
  }
}

async function processPropertyImage(file) {
  const temporaryPath = file.path;
  const finalFilename = `${Date.now()}-${crypto
    .randomBytes(5)
    .toString("hex")}.webp`;
  const outputPath = path.join(uploadPath, finalFilename);

  try {
    const metadata = await sharp(temporaryPath, {
      failOn: "none"
    })
      .rotate()
      .metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error(
        `Não foi possível identificar a imagem ${file.originalname}.`
      );
    }

    const maxWidth = getNumberEnv(
      "PROPERTY_IMAGE_MAX_WIDTH",
      1920,
      800,
      5000
    );

    const targetWidth = Math.min(metadata.width, maxWidth);
    const watermarkBuffer = await createWatermarkBuffer(targetWidth);

    let processor = sharp(temporaryPath, {
      failOn: "none"
    })
      .rotate()
      .resize({
        width: maxWidth,
        withoutEnlargement: true,
        fit: "inside"
      });

    if (watermarkBuffer) {
      processor = processor.composite([
        {
          input: watermarkBuffer,
          gravity: getWatermarkPosition()
        }
      ]);
    }

    await processor
      .webp({
        quality: 88,
        effort: 4
      })
      .toFile(outputPath);

    if (fs.existsSync(temporaryPath)) {
      await fs.promises.unlink(temporaryPath);
    }

    file.filename = finalFilename;
    file.path = outputPath;
    file.destination = uploadPath;
    file.mimetype = "image/webp";
    file.size = (await fs.promises.stat(outputPath)).size;

    console.log("Imagem processada:", finalFilename);
    console.log("Marca d'água aplicada:", Boolean(watermarkBuffer));

    return file;
  } catch (error) {
    console.error("Erro ao processar imagem:", error);

    if (fs.existsSync(temporaryPath)) {
      await fs.promises.unlink(temporaryPath).catch(() => {});
    }

    if (fs.existsSync(outputPath)) {
      await fs.promises.unlink(outputPath).catch(() => {});
    }

    throw error;
  }
}

async function cleanupFiles(files) {
  if (!Array.isArray(files)) return;

  await Promise.all(
    files.map(async (file) => {
      if (!file?.path) return;
      if (fs.existsSync(file.path)) {
        await fs.promises.unlink(file.path).catch(() => {});
      }
    })
  );
}

function uploadArrayWithWatermark(fieldName, maxCount = 20) {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(
      req,
      res,
      async (uploadError) => {
        if (uploadError) {
          console.error("Erro Multer:", uploadError);

          return res.status(400).json({
            error: "Erro ao enviar imagens.",
            details: uploadError.message
          });
        }

        try {
          if (!req.files?.length) return next();

          console.log(`${req.files.length} imagem(ns) recebida(s).`);
          console.log("Watermark esperado em:", watermarkPath);
          console.log("Watermark existe:", fs.existsSync(watermarkPath));

          for (const file of req.files) {
            await processPropertyImage(file);
          }

          return next();
        } catch (error) {
          console.error("ERRO AO PROCESSAR IMAGENS:", error);

          await cleanupFiles(req.files);

          return res.status(500).json({
            error: "Erro ao processar imagem do imóvel.",
            details: error.message
          });
        }
      }
    );
  };
}

module.exports = {
  array: uploadArrayWithWatermark
};
