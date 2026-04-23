const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const {
  createLeadWithRotation,
  listLeads,
  updateLeadStatus,
  assignLeadBroker
} = require("../controllers/lead.controller");

router.post("/", createLeadWithRotation);
router.get("/", authMiddleware, listLeads);
router.patch("/:id/status", authMiddleware, updateLeadStatus);
router.patch("/:id/assign", authMiddleware, assignLeadBroker);

module.exports = router;