// Contains routes for different pages

const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.render("index");
});

router.get("/register2", (req, res) => {
  res.render("register2");
});

router.get("/login", (req, res) => {
  res.render("login");
});



module.exports = router;
