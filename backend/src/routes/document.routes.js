const express = require("express");
const router = express.Router();

const {
  createDocument,
  listDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument
} = require("../controllers/document.controller");

router.post("/", createDocument);
router.get("/", listDocuments);
router.get("/:id", getDocumentById);
router.put("/:id", updateDocument);
router.delete("/:id", deleteDocument);

module.exports = router;