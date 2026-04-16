const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  createConversation,
  getMyConversations,
  sendMessage
} = require("../controllers/chat.controller");

router.post("/", createConversation);
router.get("/", authMiddleware, getMyConversations);
router.post("/:id/message", authMiddleware, sendMessage);

module.exports = router;