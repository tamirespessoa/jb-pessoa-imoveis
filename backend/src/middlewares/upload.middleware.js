const multer = require("multer");
const path = require("path");
const sharp = require("sharp");
const fs = require("fs");

const uploadPath = path.join(__dirname, "../../uploads");
const watermarkPath = path.join(uploadPath, "watermark.png");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadPath);
  },

  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path
      .basename(file.originalname, ext)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase();

    const filename = `${Date.now()}-${cleanName}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Envie apenas imagens JPG, PNG ou WEBP."));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

async function applyPremiumWatermark(filePath) {
  if (!fs.existsSync(watermarkPath)) {
    console.log("Marca d'água não encontrada em:", watermarkPath);
    return;
  }

  const metadata = await sharp(filePath).metadata();

  const imageWidth = metadata.width || 1200;
  const watermarkWidth = Math.floor(imageWidth * 0.38);

  const watermarkBuffer = await sharp(watermarkPath)
    .resize({
      width: watermarkWidth,
      withoutEnlargement: true
    })
    .ensureAlpha()
    .modulate({
      brightness: 1
    })
    .composite([
      {
        input: Buffer.from([255, 255, 255, 115]),
        raw: {
          width: 1,
          height: 1,
          channels: 4
        },
        tile: true,
        blend: "dest-in"
      }
    ])
    .png()
    .toBuffer();

  const tempPath = `${filePath}.watermark-temp.jpg`;

  await sharp(filePath)
    .rotate()
    .jpeg({
      quality: 88,
      mozjpeg: true
    })
    .composite([
      {
        input: watermarkBuffer,
        gravity: "center"
      }
    ])
    .toFile(tempPath);

  fs.renameSync(tempPath, filePath);
}

function uploadArrayWithWatermark(fieldName, maxCount) {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          error: "Erro ao enviar imagens.",
          details: err.message
        });
      }

      try {
        if (req.files && req.files.length > 0) {
          for (const file of req.files) {
            await applyPremiumWatermark(file.path);
          }
        }

        return next();
      } catch (error) {
        console.error("Erro ao aplicar marca d'água:", error);

        return res.status(500).json({
          error: "Erro ao aplicar marca d'água nas imagens.",
          details: error.message
        });
      }
    });
  };
}

module.exports = {
  array: uploadArrayWithWatermark
};