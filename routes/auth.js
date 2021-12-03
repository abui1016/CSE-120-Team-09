// Contains routes for different pages

const express = require("express");
const authController = require("../controllers/auth.js");
const router = express.Router();

// From user submitted info
router.post("/register", authController.register);

// For logging in user
router.post("/login", authController.login);

// Editing info
router.post("/editInfo", authController.editInfo);

router.post("/recovery", authController.recovery);

router.post("/recoveryInput", authController.recoveryInput);

module.exports = router;
