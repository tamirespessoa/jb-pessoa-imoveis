const express = require("express");

const router = express.Router();

const {
  verifyWebhook,
  receiveWebhook,
  testMetaIntegration
} = require("../controllers/meta.controller");

router.get("/webhook", verifyWebhook);

router.post("/webhook", receiveWebhook);

router.get("/test", testMetaIntegration);

module.exports = router;