const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middlewares/auth.middleware");

const authController = require("../controllers/auth.controller");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", requireAuth, authController.me);
router.post("/verify-email", authController.verifyEmail);

module.exports = router;