const express = require("express");
const router = express.Router();

const {
  createProposal,
  listProposals,
  getProposalById,
  updateProposal,
  deleteProposal
} = require("../controllers/proposal.controller");

router.post("/", createProposal);
router.get("/", listProposals);
router.get("/:id", getProposalById);
router.put("/:id", updateProposal);
router.delete("/:id", deleteProposal);

module.exports = router;