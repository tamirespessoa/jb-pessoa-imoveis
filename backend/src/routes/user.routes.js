const express = require("express");
const router = express.Router();
const { listUsers } = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/", authMiddleware, listUsers);

module.exports = router;