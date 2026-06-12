const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  createPerson,
  listPersons,
  getPersonById,
  updatePerson,
  deletePerson
} = require("../controllers/person.controller");

// ===============================
// ROTAS
// ===============================

// CRIAR
router.post("/", authMiddleware, createPerson);

// LISTAR
router.get("/", authMiddleware, listPersons);

// BUSCAR POR ID
router.get("/:id", authMiddleware, getPersonById);

// ATUALIZAR
router.put("/:id", authMiddleware, updatePerson);

// DELETAR
router.delete("/:id", authMiddleware, deletePerson);

module.exports = router;