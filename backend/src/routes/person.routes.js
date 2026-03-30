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

console.log("authMiddleware:", typeof authMiddleware);
console.log("createPerson:", typeof createPerson);
console.log("listPersons:", typeof listPersons);
console.log("getPersonById:", typeof getPersonById);
console.log("updatePerson:", typeof updatePerson);
console.log("deletePerson:", typeof deletePerson);

router.post("/", authMiddleware, createPerson);
router.get("/", authMiddleware, listPersons);
router.get("/:id", authMiddleware, getPersonById);
router.put("/:id", authMiddleware, updatePerson);
router.delete("/:id", authMiddleware, deletePerson);

module.exports = router;