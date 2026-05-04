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
// DEBUG (PODE REMOVER DEPOIS)
// ===============================
console.log("authMiddleware:", typeof authMiddleware);
console.log("createPerson:", typeof createPerson);
console.log("listPersons:", typeof listPersons);
console.log("getPersonById:", typeof getPersonById);
console.log("updatePerson:", typeof updatePerson);
console.log("deletePerson:", typeof deletePerson);

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