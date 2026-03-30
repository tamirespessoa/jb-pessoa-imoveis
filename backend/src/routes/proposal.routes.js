const express = require("express");
const router = express.Router();
const proposalController = require("../controllers/proposal.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/", authMiddleware, proposalController.createProposal);
router.get("/", authMiddleware, proposalController.listProposals);
router.get("/:id", authMiddleware, proposalController.getProposalById);
router.put("/:id", authMiddleware, proposalController.updateProposal);
router.delete("/:id", authMiddleware, proposalController.deleteProposal);

module.exports = router;