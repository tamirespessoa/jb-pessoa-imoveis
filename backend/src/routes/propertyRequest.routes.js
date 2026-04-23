const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const {
  listPropertyRequests,
  createPropertyRequest,
  updatePropertyRequest,
  deletePropertyRequest
} = require("../controllers/propertyRequest.controller");

// ROTA PÚBLICA DO SITE
router.post("/", createPropertyRequest);

// ROTAS PRIVADAS DO SISTEMA
router.get("/", authMiddleware, listPropertyRequests);
router.put("/:id", authMiddleware, updatePropertyRequest);
router.delete("/:id", authMiddleware, deletePropertyRequest);

module.exports = router;