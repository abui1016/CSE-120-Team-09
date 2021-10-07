// npm i bcryptjs for ENCRYPTING PASSWORDS

// Import express, sql, dotenv, path
const express = require("express");
const mysql = require("mysql");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: "./.env" });

// Start server
const app = express();

// Start database and create connection
// Need socketPath for MAMP
// Create separate file to protect sensitive info
const db = mysql.createConnection({
  host: process.env.RDS_HOSTNAME,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DB_NAME,
  port: process.env.RDS_PORT,
});

const publicDirectory = path.join(__dirname, "./public");
app.use(express.static(publicDirectory));

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: false }));
// Parse JSON bodies (as sent by API clients)
app.use(express.json());

// Tell node.js which view engine to use
app.set("view engine", "hbs");

// Connect database
db.connect((error) => {
  if (error) {
    console.log(error);
  } else {
    console.log("MySQL Connected...");
  }
});

// // Route
// app.get("/", (req, res) => {
//   //   res.send("<h1>Home Page</h1>");
//   res.render("index");
// });

// // Going to different pages
// app.get("/register", (req, res) => {
//   res.render("register");
// });

// Stored routes on separate file
app.use("/", require("./routes/pages"));
app.use("/auth", require("./routes/auth"));

app.listen(3304, () => {
  console.log("Server started on Port 3304");
});
