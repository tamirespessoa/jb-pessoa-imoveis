const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");
const {
  uploadDocument,
  listDocuments
} = require("../controllers/document.controller");

router.post("/", authMiddleware, upload.single("file"), uploadDocument);
router.get("/", authMiddleware, listDocuments);

module.exports = router;