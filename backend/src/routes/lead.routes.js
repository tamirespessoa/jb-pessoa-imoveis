const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const {
  createLeadWithRotation,
  listLeads,
  updateLeadStatus
} = require("../controllers/lead.controller");

router.post("/", createLeadWithRotation);
router.get("/", authMiddleware, listLeads);
router.patch("/:id/status", authMiddleware, updateLeadStatus);

module.exports = router;