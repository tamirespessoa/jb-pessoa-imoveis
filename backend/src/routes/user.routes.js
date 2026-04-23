const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const permit = require("../middlewares/role.middleware");

const {
  createUser,
  listUsers,
  updateUser,
  deleteUser,
  updateMyOnlineStatus,
  listOnlineBrokers,
  listAssignableBrokers
} = require("../controllers/user.controller");

router.patch("/me/status", authMiddleware, updateMyOnlineStatus);

router.get(
  "/online-brokers",
  authMiddleware,
  permit("ADMIN"),
  listOnlineBrokers
);

router.get(
  "/assignable-brokers",
  authMiddleware,
  permit("ADMIN"),
  listAssignableBrokers
);

router.get("/", authMiddleware, permit("ADMIN"), listUsers);
router.post("/", authMiddleware, permit("ADMIN"), createUser);
router.put("/:id", authMiddleware, permit("ADMIN"), updateUser);
router.delete("/:id", authMiddleware, permit("ADMIN"), deleteUser);

module.exports = router;