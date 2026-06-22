const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  recordSiteVisit,
  getSiteVisitDashboard
} = require("../controllers/siteVisit.controller");

// Público: usado pelo site para registrar acessos.
router.post("/", recordSiteVisit);

// Privado: usado pelo painel interno.
router.get("/dashboard", authMiddleware, getSiteVisitDashboard);

module.exports = router;
