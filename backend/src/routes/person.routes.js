const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  createPerson,
  listPersons,
  getPersonById,
  updatePerson,
  deletePerson,
  updateClientPropertyNegotiation,
  listLinkedProperties,
  linkPropertyToClient,
  unlinkPropertyFromClient
} = require("../controllers/person.controller");

// ===============================
// ROTAS
// ===============================

// CRIAR
router.post("/", authMiddleware, createPerson);

// LISTAR
router.get("/", authMiddleware, listPersons);

// VINCULOS DE IMOVEIS DO CLIENTE
router.get("/:id/properties", authMiddleware, listLinkedProperties);
router.post("/:id/properties", authMiddleware, linkPropertyToClient);
router.delete("/:id/properties/:propertyId", authMiddleware, unlinkPropertyFromClient);
router.patch("/:id/properties/:propertyId/negotiation", authMiddleware, updateClientPropertyNegotiation);

// BUSCAR POR ID
router.get("/:id", authMiddleware, getPersonById);

// ATUALIZAR
router.put("/:id", authMiddleware, updatePerson);

// DELETAR
router.delete("/:id", authMiddleware, deletePerson);

module.exports = router;