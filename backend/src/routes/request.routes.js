const express = require("express");
const router = express.Router();

const {
  listRequests,
  createRequest,
  updateRequest,
  deleteRequest
} = require("../controllers/request.controller");

const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, listRequests);
router.post("/", authMiddleware, createRequest);
router.put("/:id", authMiddleware, updateRequest);
router.delete("/:id", authMiddleware, deleteRequest);

module.exports = router;