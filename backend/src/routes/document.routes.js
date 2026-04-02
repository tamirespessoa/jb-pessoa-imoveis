const express = require("express");
const multer = require("multer");
const authMiddleware = require("../middlewares/auth.middleware");
const documentController = require("../controllers/document.controller");

const router = express.Router();

const upload = multer({
  dest: "uploads/"
});

router.get("/", authMiddleware, documentController.getDocuments);
router.post("/", authMiddleware, upload.single("file"), documentController.createDocument);
router.delete("/:id", authMiddleware, documentController.deleteDocument);

module.exports = router;