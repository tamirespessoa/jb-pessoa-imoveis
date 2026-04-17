const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

const {
  createProperty,
  listProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  listPublicProperties,
  getPublicPropertyById
} = require("../controllers/property.controller");

// ROTAS PÚBLICAS
router.get("/public", listPublicProperties);
router.get("/public/:id", getPublicPropertyById);

// ROTAS PRIVADAS
router.post("/", authMiddleware, upload.array("images", 20), createProperty);
router.get("/", authMiddleware, listProperties);
router.get("/:id", authMiddleware, getPropertyById);
router.put("/:id", authMiddleware, upload.array("images", 20), updateProperty);
router.delete("/:id", authMiddleware, deleteProperty);

module.exports = router;