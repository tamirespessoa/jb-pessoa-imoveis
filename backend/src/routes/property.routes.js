const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.Middleware");
const {
  createProperty,
  listProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  listPublicProperties,
  getPublicPropertyById
} = require("../controllers/property.controller");

// ROTAS PÚBLICAS DO SITE
router.get("/public", listPublicProperties);
router.get("/public/:id", getPublicPropertyById);

// ROTAS PRIVADAS DO SISTEMA
router.post("/", authMiddleware, createProperty);
router.get("/", authMiddleware, listProperties);
router.get("/:id", authMiddleware, getPropertyById);
router.put("/:id", authMiddleware, updateProperty);
router.delete("/:id", authMiddleware, deleteProperty);

module.exports = router;