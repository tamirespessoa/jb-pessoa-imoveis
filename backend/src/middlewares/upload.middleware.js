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
    return cb(
      new Error("Envie apenas imagens JPG, PNG ou WEBP.")
    );
  }

  cb(null, true);
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

  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(Math.max(value, min), max);
}

function getWatermarkPosition() {
  const position =
    process.env.WATERMARK_POSITION || "southeast";

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

  return allowed.includes(position)
    ? position
    : "southeast";
}

async function createWatermarkBuffer(imageWidth) {
  if (!fs.existsSync(watermarkPath)) {
    console.warn(
      "Marca d'água não encontrada:",
      watermarkPath
    );

    return null;
  }

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

  const originalLogo = await sharp(watermarkPath)
    .resize({
      width: watermarkWidth,
      withoutEnlargement: true,
      fit: "inside"
    })
    .ensureAlpha()
    .png()
    .toBuffer();

  const metadata = await sharp(originalLogo).metadata();

  const alpha = await sharp({
    create: {
      width: metadata.width,
      height: metadata.height,
      channels: 1,
      background: {
        r: Math.round(255 * opacity)
      }
    }
  })
    .png()
    .toBuffer();

  return sharp(originalLogo)
    .removeAlpha()
    .joinChannel(alpha)
    .png()
    .toBuffer();
}

async function processPropertyImage(file) {
  const temporaryPath = file.path;

  const finalFilename = `${Date.now()}-${crypto
    .randomBytes(5)
    .toString("hex")}.webp`;

  const outputPath = path.join(
    uploadPath,
    finalFilename
  );

  try {
    const metadata = await sharp(temporaryPath)
      .rotate()
      .metadata();

    const width = metadata.width || 1200;

    const maxWidth = getNumberEnv(
      "PROPERTY_IMAGE_MAX_WIDTH",
      1920,
      800,
      5000
    );

    const targetWidth = Math.min(
      width,
      maxWidth
    );

    const watermarkBuffer =
      await createWatermarkBuffer(targetWidth);

    let processor = sharp(temporaryPath)
      .rotate()
      .resize({
        width: maxWidth,
        withoutEnlargement: true
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
        quality: 88
      })
      .toFile(outputPath);

    if (fs.existsSync(temporaryPath)) {
      await fs.promises.unlink(temporaryPath);
    }

    file.filename = finalFilename;
    file.path = outputPath;
    file.destination = uploadPath;
    file.mimetype = "image/webp";

    const stats =
      await fs.promises.stat(outputPath);

    file.size = stats.size;

    console.log(
      "Imagem processada:",
      finalFilename
    );

    return file;
  } catch (error) {
    console.error(
      "Erro ao processar imagem:",
      error
    );

    throw error;
  }
}

function uploadArrayWithWatermark(
  fieldName,
  maxCount = 20
) {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(
      req,
      res,
      async (uploadError) => {
        if (uploadError) {
          console.error(
            "Erro Multer:",
            uploadError
          );

          return res.status(400).json({
            error: "Erro ao enviar imagens.",
            details: uploadError.message
          });
        }

        try {
          if (!req.files?.length) {
            return next();
          }

          console.log(
            `${req.files.length} imagem(ns) recebida(s).`
          );

          console.log(
            "Watermark:",
            watermarkPath
          );

          console.log(
            "Watermark existe:",
            fs.existsSync(watermarkPath)
          );

          for (const file of req.files) {
            await processPropertyImage(file);
          }

          next();
        } catch (error) {
          console.error(
            "ERRO MARCA D'ÁGUA:",
            error
          );

          return res.status(500).json({
            error:
              "Erro ao processar imagem do imóvel.",
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