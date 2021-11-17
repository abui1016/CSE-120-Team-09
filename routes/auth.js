// Contains routes for different pages

const express = require("express");
const authController = require("../controllers/auth");
const router = express.Router();

// From user submitted info
router.post("/register", authController.register);

// For logging in user
router.post("/login", authController.login);

// test configuration on my end. 
router.post("/test", authController.test);

module.exports = router;
