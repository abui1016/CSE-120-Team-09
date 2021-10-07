// Import DB and SQL
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
// const bcrypt = require('bcryptjs');

const db = mysql.createConnection({
  host: process.env.RDS_HOSTNAME,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DB_NAME,
  port: process.env.RDS_PORT,
});

// Register user to database
exports.register = (req, res) => {
  console.log(req.body);

  //   const name = req.body.name;
  //   const email = req.body.email;
  //   const password = req.body.password;
  //   const passwordConfirm = req.body.passwordConfirm;

  const { name, email, password, passwordConfirm } = req.body;

  // Query into database
  // for bcrypt -> add 'async' in front of (error, results)
  db.query(
    "SELECT email FROM users WHERE email = ?",
    [email],
    (error, results) => {
      if (error) {
        console.log(error);
      }
      if (results.length > 0) {
        return res.render("register", {
          message: "That email is already in use",
        });
      } else if (password !== passwordConfirm) {
        return res.render("register", {
          message: "Passwords do not match",
        });
      }
      // let hashedPassword = await bcrypt.hash(password, 8)
      // console.log(hashedPassword);
      // res.send('testing')

      db.query(
        "INSERT INTO users SET ?",
        {
          name: name,
          email: email,
          password: password,
        },
        (error, results) => {
          if (error) {
            console.log(error);
          } else {
            console.log(results);
            return res.render("register", {
              message: "User registered!",
            });
          }
        }
      );
    }
  );
};

// Login user
exports.login = (req, res) => {
  const { email, password } = req.body;

  // Query DB to match an email and password
  // If there is no match -> invalid login
  db.query(
    "SELECT email, password FROM users WHERE email = ? AND password = ?",
    [email, password],
    (error, results) => {
      if (error) {
        console.log(error);
      }
      if (results.length === 1) {
        return res.render("login", {
          message: "Successfully logged in!",
        });
      } else {
        return res.render("login", {
          message: "Invalid login credentials",
        });
      }
    }
  );
};
