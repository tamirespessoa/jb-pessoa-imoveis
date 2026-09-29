const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  listCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getTrafficDashboard
} = require("../controllers/traffic.controller");

router.get("/dashboard", authMiddleware, getTrafficDashboard);
router.get("/campaigns", authMiddleware, listCampaigns);
router.post("/campaigns", authMiddleware, createCampaign);
router.patch("/campaigns/:id", authMiddleware, updateCampaign);
router.delete("/campaigns/:id", authMiddleware, deleteCampaign);

module.exports = router;
