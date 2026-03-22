const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const {
  createProperty,
  listProperties,
  getPropertyById,
  updateProperty,
  deleteProperty
} = require("../controllers/property.controller");

router.post("/", authMiddleware, createProperty);
router.get("/", authMiddleware, listProperties);
router.get("/:id", authMiddleware, getPropertyById);
router.put("/:id", authMiddleware, updateProperty);
router.delete("/:id", authMiddleware, deleteProperty);

module.exports = router;