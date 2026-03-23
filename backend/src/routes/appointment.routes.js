const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

// exemplo de rota teste
router.get("/", authMiddleware, (req, res) => {
  res.json({ message: "Rotas de agendamento funcionando." });
});

module.exports = router;