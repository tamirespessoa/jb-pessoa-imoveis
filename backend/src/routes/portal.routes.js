const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const { listPortals } = require("../controllers/portal.controller");

router.get("/", authMiddleware, listPortals);

module.exports = router;