const express = require("express");
const router = express.Router();

const vaultController = require("../controllers/vault.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

// Protegemos TODO el router:
router.use(requireAuth);

// POST /vault
router.post("/", vaultController.create);

// GET /vault
router.get("/", vaultController.list);

router.put("/:id", vaultController.update);
router.delete("/:id", vaultController.remove);

module.exports = router;