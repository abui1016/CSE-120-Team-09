// Contains routes for different pages

const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.render("index");
});

router.get("/register", (req, res) => {
  res.render("register");
});

router.get("/login", (req, res) => {
  res.render("login");
});

router.get("/editInfo", (req, res) => {
  res.render("editInfo");
});

router.get("/recovery", (req, res) => {
  res.render("recovery");
});

router.get("/recoveryInput", (req, res) => {
  res.render("recoveryInput");
});

module.exports = router;
