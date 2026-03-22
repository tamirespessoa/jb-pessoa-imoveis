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

router.post("/", authMiddleware, createPerson);
router.get("/", authMiddleware, listPersons);
router.get("/:id", authMiddleware, getPersonById);
router.put("/:id", authMiddleware, updatePerson);
router.delete("/:id", authMiddleware, deletePerson);

module.exports = router;