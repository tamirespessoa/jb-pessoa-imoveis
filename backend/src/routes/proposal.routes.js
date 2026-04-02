const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const {
  createProposal,
  listProposals,
  getProposalById,
  updateProposal,
  deleteProposal
} = require("../controllers/proposal.controller");

router.post("/", authMiddleware, createProposal);
router.get("/", authMiddleware, listProposals);
router.get("/:id", authMiddleware, getProposalById);
router.put("/:id", authMiddleware, updateProposal);
router.delete("/:id", authMiddleware, deleteProposal);

module.exports = router;