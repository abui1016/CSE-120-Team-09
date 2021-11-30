// Import
const mysql = require("mysql");
// const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const url = require("url");
const alert = require("alert");

const saltRounds = 10;

const db = mysql.createConnection({
  host: process.env.RDS_HOSTNAME,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DB_NAME,
  port: process.env.RDS_PORT,
});

// Email setup
const transporter = nodemailer.createTransport({
  host: process.env.SES_HOST,
  port: process.env.SES_PORT,
  secure: process.env.SES_SECURE,
  auth: {
    user: process.env.SES_USER,
    pass: process.env.SES_PASS,
  },
});

// verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log(error);
  } else {
    console.log("Server is ready to take our messages");
  }
});

// Email functions
function sendMailRegister(user) {
  // console.log(user.emailAddress);
  optionsRegister = {
    from: process.env.SES_FROM,
    to: user.emailAddress,
    subject: "EFM : Account Registered",
    text:
      "Hello " +
      user.firstName +
      ",\n You are now a registered user with Early Family Math. You will automatically receive daily emails with 2 activities for your child. If you feel that the pace is too slow or fast, you may log in to your account to adjust your child's skill level.",
  };

  transporter.sendMail(optionsRegister, function (err, info) {
    if (err) {
      console.log(err);
      return;
    }
    console.log("Sent: " + info.response);
  });
}

const oneDay = 86400000;
const oneWeek = 604800000;

// Function to send out activities
function sendActivities() {
  db.query(
    "SELECT * FROM users WHERE subscribed = 'TRUE'",
    (error, results) => {
      if (error) {
        console.log(error);
      }
      for (let i = 0; i < results.length; i++) {
        const optionsActivities = {
          from: process.env.SES_FROM,
          to: results[i].emailAddress,
          subject: "EFM Daily Activity",
          text: `Hello ${results[i].firstName} \nHere are two daily activities based on your child's skill level (${results[i].skillLevel})!`,
          attachments: [
            {
              path: `./Activities/${results[i].skillLevel}-${results[i].activityLevel}.pdf`,
            },
            {
              path: `./Activities/${results[i].skillLevel}-${
                results[i].activityLevel + 1
              }.pdf`,
            },
          ],
        };
        transporter.sendMail(optionsActivities, function (err, info) {
          if (err) {
            console.log(err);
            return;
          }
          console.log("Sent Activities!");
        });
      }
    }
  );
  updateSkillLevel();
}

// Function to update skill and activity levels
function updateSkillLevel() {
  db.query(
    "SELECT * FROM users WHERE subscribed = 'TRUE' ",
    (error, results) => {
      if (error) {
        console.log(error);
      }
      for (let i = 0; i < results.length; i++) {
        if (results[i].activityLevel >= 13) {
          db.query(
            "UPDATE users SET skillLevel = skillLevel + 1, activityLevel = 1 ",
            (error, results) => {
              if (error) {
                console.log(error);
              }
            }
          );
        } else {
          db.query(
            "UPDATE users SET activityLevel = activityLevel + 2",
            (error, results) => {
              if (error) {
                console.log(error);
              }
            }
          );
        }
      }
    }
  );
}

// Send activites daily
// setInterval(sendActivities, oneDay);

// Get skill level
function getSkillLevel(id) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT skillLevel from users WHERE id = ?",
      [id],
      (error, results) => {
        if (error) {
          return reject(err);
        }
        let skill = results[0].skillLevel;
        resolve(skill);
      }
    );
  });
}

// Register user to database Pushes the emails and the info to the DB.
exports.register = (req, res) => {
  // console.log(req.body);

  //   const name = req.body.name;
  //   const email = req.body.email;
  //   const password = req.body.password;
  //   const passwordConfirm = req.body.passwordConfirm;

  const {
    firstName,
    lastName,
    emailAddress,
    phoneNumber,
    password,
    passwordConfirm,
    skillLevel,
  } = req.body;

  // Query into database
  // for bcrypt -> add 'async' in front of (error, results)
  db.query(
    "SELECT emailAddress FROM users WHERE emailAddress = ?",
    [emailAddress],
    (error, results) => {
      if (error) {
        console.log(error);
      }

      // If it gets a result from the DB that matches at all then it will send out the prompt

      if (results.length > 0) {
        alert("That email is already in use");
        return res.redirect("http://localhost:3304/register");
        // Authenticates Passwords
      } else if (password !== passwordConfirm) {
        alert("Passwords did not match");
        return res.redirect("http://localhost:3304/register");
      }
      // let hashedPassword = await bcrypt.hash(password, 8)
      // console.log(hashedPassword);
      // res.send('testing')

      const hashedPassword = bcrypt.hashSync(password, saltRounds);
      // console.log(hashedPassword);
      // console.log(bcrypt.compareSync(password, hashedPassword));

      db.query(
        "INSERT INTO users SET ?",
        {
          firstName: firstName,
          lastName: lastName,
          emailAddress: emailAddress,
          phoneNumber: phoneNumber,
          password: hashedPassword,
          skillLevel: skillLevel,
        },
        (error, results) => {
          if (error) {
            console.log(error);
          } else {
            // console.log(results);
            sendMailRegister(req.body);
            alert("Sucessfully Registered!");
            return res.redirect("http://localhost:3304");
          }
        }
      );
    }
  );
};

// Login user
// Query the DB for both email and password.
exports.login = (req, res) => {
  const { emailAddress, password } = req.body;

  // Get password
  db.query(
    "SELECT password FROM users WHERE emailAddress = ?",
    [emailAddress],
    (error, results) => {
      if (error) {
        console.log(error);
      }
      if (results.length === 0) {
        alert("Invalid Login Credentials");
        return res.redirect("http://localhost:3304/login");
      }
      if (bcrypt.compareSync(password, results[0].password)) {
        // Query DB to match an email and password
        // If there is no match -> invalid login
        db.query(
          "SELECT * FROM users WHERE emailAddress = ? AND password = ?",
          [emailAddress, results[0].password],
          (error, results) => {
            if (error) {
              console.log(error);
            }
            if (results.length === 1) {
              return res.render("editInfo", {
                firstName: results[0].firstName,
                lastName: results[0].lastName,
                emailAddress: results[0].emailAddress,
                phoneNumber: results[0].phoneNumber,
                password: results[0].password,
                skillLevel: results[0].skillLevel,
                id: results[0].id,
              });
            } else {
              alert("Invalid Login Credentials");
              return res.redirect("http://localhost:3304/login");
            }
          }
        );
      } else {
        alert("Invalid Login Credentials");
        return res.redirect("http://localhost:3304/login");
      }
    }
  );
};

exports.editInfo = (req, res) => {
  // console.log(req.body);
  const {
    firstName,
    lastName,
    emailAddress,
    phoneNumber,
    password,
    passwordConfirm,
    skillLevel,
    id,
  } = req.body;
  // Query into DB and UPDATE
  // Reset activity level if user changes skill level
  getSkillLevel(id).then((value) => {
    const prevSkillLevel = value;
    if (password === "" && passwordConfirm === "") {
      if (prevSkillLevel !== skillLevel) {
        db.query(
          "UPDATE users SET activityLevel = 1 WHERE id = ?",
          [id],
          (error, results) => {
            if (error) {
              console.log(error);
            }
          }
        );
      }
      db.query(
        "UPDATE users SET firstName = ?, lastName = ?, emailAddress = ?, phoneNumber = ?, skillLevel = ? WHERE id = ?",
        [firstName, lastName, emailAddress, phoneNumber, skillLevel, id],
        (error, results) => {
          if (error) {
            console.log(error);
          }
          alert("Successfully updated information");
          return res.redirect("http://localhost:3304");
        }
      );
    } else if (
      password === passwordConfirm &&
      password !== "" &&
      passwordConfirm !== ""
    ) {
      const hashedPassword = bcrypt.hashSync(password, saltRounds);
      db.query(
        "UPDATE users SET firstName = ?, lastName = ?, emailAddress = ?, phoneNumber = ?, password = ?, skillLevel = ? WHERE id = ?",
        [
          firstName,
          lastName,
          emailAddress,
          phoneNumber,
          hashedPassword,
          skillLevel,
          id,
        ],
        (error, results) => {
          if (error) {
            console.log(error);
          }
          alert("Successfully updated information");
          return res.redirect("http://localhost:3304");
        }
      );
    } else {
      // Password and password confirm did not match
      console.log("Passwords did not match");
      alert("Passwords did not match");
      return res.redirect("http://localhost:3304");
    }
  });
};
