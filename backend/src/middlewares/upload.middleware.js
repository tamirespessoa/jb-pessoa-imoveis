const multer = require("multer");
const path = require("path");
const sharp = require("sharp");
const fs = require("fs");
const crypto = require("crypto");

/*
  PASTAS
  - uploads: fotos processadas dos imóveis
  - assets/watermark.png: logo padrão da imobiliária

  IMPORTANTE:
  Coloque o logo transparente em:
  backend/src/assets/watermark.png
*/

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
  return String(filename || "imagem")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .toLowerCase() || "imagem";
}

/*
  O Multer salva primeiro um arquivo temporário.
  Depois o Sharp:
  1. gira conforme os metadados EXIF;
  2. redimensiona, se necessário;
  3. aplica o logo;
  4. converte para WebP;
  5. apaga o temporário.
*/
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
  const allowedMimeTypes = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp"
  ]);

  if (!allowedMimeTypes.has(file.mimetype)) {
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

function getWatermarkPosition() {
  const position = String(
    process.env.WATERMARK_POSITION || "southeast"
  ).toLowerCase();

  const allowed = new Set([
    "northwest",
    "north",
    "northeast",
    "west",
    "center",
    "east",
    "southwest",
    "south",
    "southeast"
  ]);

  return allowed.has(position) ? position : "southeast";
}

function getNumberEnv(name, fallback, min, max) {
  const parsed = Number(process.env[name]);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
}

async function createWatermarkBuffer(imageWidth) {
  if (!fs.existsSync(watermarkPath)) {
    throw new Error(
      `Logo da marca d'água não encontrado em: ${watermarkPath}`
    );
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
    Math.round(imageWidth * (widthPercent / 100))
  );

  /*
    Modula apenas o canal alfa do PNG.
    Por isso o logo deve ser PNG com fundo transparente.
  */
  return sharp(watermarkPath)
    .resize({
      width: watermarkWidth,
      withoutEnlargement: true,
      fit: "inside"
    })
    .ensureAlpha()
    .linear([1, 1, 1, opacity], [0, 0, 0, 0])
    .png()
    .toBuffer();
}

async function processPropertyImage(file) {
  const temporaryPath = file.path;
  const outputFilename = temporaryPath.replace(/\.upload$/i, ".webp");
  const outputPath = path.join(uploadPath, path.basename(outputFilename));

  try {
    const image = sharp(temporaryPath, {
      failOn: "none"
    }).rotate();

    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error(`Não foi possível identificar a imagem ${file.originalname}.`);
    }

    const maxWidth = getNumberEnv(
      "PROPERTY_IMAGE_MAX_WIDTH",
      1920,
      800,
      5000
    );

    const resizedWidth = Math.min(metadata.width, maxWidth);
    const watermarkBuffer = await createWatermarkBuffer(resizedWidth);
    const margin = getNumberEnv(
      "WATERMARK_MARGIN",
      28,
      0,
      300
    );

    /*
      A margem é criada dentro de uma camada transparente.
      Isso permite usar qualquer gravity do Sharp.
    */
    const paddedWatermark = await sharp(watermarkBuffer)
      .extend({
        top: margin,
        bottom: margin,
        left: margin,
        right: margin,
        background: {
          r: 0,
          g: 0,
          b: 0,
          alpha: 0
        }
      })
      .png()
      .toBuffer();

    await image
      .resize({
        width: maxWidth,
        withoutEnlargement: true,
        fit: "inside"
      })
      .composite([
        {
          input: paddedWatermark,
          gravity: getWatermarkPosition()
        }
      ])
      .webp({
        quality: 88,
        effort: 4
      })
      .toFile(outputPath);

    await fs.promises.unlink(temporaryPath);

    file.filename = path.basename(outputPath);
    file.path = outputPath;
    file.destination = uploadPath;
    file.mimetype = "image/webp";
    file.size = (await fs.promises.stat(outputPath)).size;

    return file;
  } catch (error) {
    if (fs.existsSync(temporaryPath)) {
      await fs.promises.unlink(temporaryPath).catch(() => {});
    }

    if (fs.existsSync(outputPath)) {
      await fs.promises.unlink(outputPath).catch(() => {});
    }

    throw error;
  }
}

async function removeProcessedFiles(files) {
  if (!Array.isArray(files)) return;

  await Promise.all(
    files.map((file) =>
      fs.promises.unlink(file.path).catch(() => {})
    )
  );
}

function uploadArrayWithWatermark(fieldName, maxCount = 20) {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, async (uploadError) => {
      if (uploadError) {
        return res.status(400).json({
          error: "Erro ao enviar as imagens.",
          details: uploadError.message
        });
      }

      try {
        if (!req.files?.length) {
          return next();
        }

        for (const file of req.files) {
          await processPropertyImage(file);
        }

        return next();
      } catch (error) {
        console.error("Erro ao processar marca d'água:", error);

        await removeProcessedFiles(req.files);

        return res.status(500).json({
          error: "Erro ao processar as imagens do imóvel.",
          details: error.message
        });
      }
    });
  };
}

module.exports = {
  array: uploadArrayWithWatermark
};
