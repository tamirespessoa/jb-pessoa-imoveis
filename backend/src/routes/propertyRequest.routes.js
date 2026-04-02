const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const {
  listPropertyRequests,
  createPropertyRequest,
  updatePropertyRequest,
  deletePropertyRequest
} = require("../controllers/propertyRequest.controller");

console.log("authMiddleware:", typeof authMiddleware);
console.log("listPropertyRequests:", typeof listPropertyRequests);
console.log("createPropertyRequest:", typeof createPropertyRequest);
console.log("updatePropertyRequest:", typeof updatePropertyRequest);
console.log("deletePropertyRequest:", typeof deletePropertyRequest);

router.get("/", authMiddleware, listPropertyRequests);
router.post("/", authMiddleware, createPropertyRequest);
router.put("/:id", authMiddleware, updatePropertyRequest);
router.delete("/:id", authMiddleware, deletePropertyRequest);

module.exports = router;