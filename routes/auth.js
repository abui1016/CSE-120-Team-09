// Contains routes for different pages

const express = require("express");
const authController = require("../controllers/auth");
const router = express.Router();

// From user submitted info
router.post("/register2", authController.register);

// For logging in user
router.post("/login", authController.login);

module.exports = router;
