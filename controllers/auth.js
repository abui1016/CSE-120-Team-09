// Time function 

function getTime() {
  const date = new Date();
  const myDate = new Date();
  // get hour value.
  let hours = myDate.getHours();
  const ampm = hours >= 12 ? "Pm" : "Am";
  hours = hours % 12;
  hours = hours ? hours : 12;
  let minutes = myDate.getMinutes();
  minutes = minutes < 10 ? "0" + minutes : minutes;
  const myTime = hours + " " + ampm + " : " + minutes;
  return myTime;
}




// Import
const mysql = require("mysql");
// const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const url = require("url");

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
  console.log(user.emailAddress);
  optionsRegister = {
  from: process.env.SES_FROM,
  to:  user.emailAddress,
  subject: "EFM : Account Registered",
  text:
    "Hello , " + user.firstName +"\n You are now a registered user with Early Family Math. If you wish to get started please login to the Early Fmaily Math portal. Once logged in you may begin setup for conetnt delivery. ",
  // attachments : "C:\Users\bomba\Desktop\CSE-120-Team-09\Activities\3-" + user.Activity + ".pdf"
  };
  
  transporter.sendMail(optionsRegister, function (err, info) {
    if (err) {
      console.log(err);
      return;
    }
    console.log("Sent: " + info.response);
  });
}

function sendMailLogin(email) {
    console.log(email);
   optionsLogin = {
    from: process.env.SES_FROM,
    to: email,
    subject: "Early Family Math User Login",
    text: "A user has loggin to this account successfully at " + getTime() +".",
   }; 

  transporter.sendMail(optionsLogin , function (err, info) {
    if (err) {
      console.log(err);
      return;
    }
    console.log("Sent: " + info.response);
  });
}

function sendMailSettingChange(user) {

  const optionsSettingChange = {
    from: process.env.SES_FROM,
    to: user.emailAddress,
    subject: "Nodemailer Login",
    text: "A setting has changed.",
  
  };

  transporter.sendMail(optionsSettingChange, function (err, info) {
    if (err) {
      console.log(err);
      return;
    }
    console.log("Sent: " + info.response);
  });
}



function sendActivities(user){

  deliverable = {
    from: process.env.SES_FROM,
    to:  user.emailAddress,
    subject: "EFM : Weekly Activity",
    text:
      "Hello , " + user.firstName +"\n You are now a registered user with Early Family Math. If you wish to get started please login to the Early Fmaily Math portal. Once logged in you may begin setup for conetnt delivery. ",
    };

  transporter.sendMail(deliverable, function (err, info) {
    if (err) {
      console.log(err);
      return;
    }
    console.log("Sent: " + info.response);
  });

}



// Sample function to send out weekly emails
// Get emails
// results is an array, i.e. results[0] is first email
const oneDay = 86400000;
const oneWeek = 604800000;
function sendWeeklyEmail() {
  db.query("SELECT email FROM users", (error, results) => {
    if (error) {
      console.log(error);
    }
    for (let i = 0; i < results.length; i++) {
      // send emails here
      sendActivities(results);
      console.log(results[i]);
    }
  });
}

// Set interval so function is called everytime after time expires
// setInterval(sendWeeklyEmail, 10000);

// Register user to database Pushes the emails and the info to the DB.
exports.register = (req, res) => {
  console.log(req.body);

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
        return res.render("register", {
          message: "That email is already in use",
        });
        // Authenticates Passwords
      } else if (password !== passwordConfirm) {
        return res.render("register", {
          message: "Passwords do not match",
        });
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
            console.log(results);
            sendMailRegister(req.body);
            return res.render("register", {
              message: "User registered!",
            });
          }
        }
      );
    }
  );
};

// Login user  Querey the DB for both email and login.
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
              sendMailLogin(req.body.emailAddress);
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
              return res.render("login", {
                message: "Invalid login credentials",
              });
            }
          }
        );
      }
    }
  );
};

exports.editInfo = (req, res) => {
  console.log(req.body);
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
  sendMailSettingChange(req.body);
  return res.redirect("http://localhost:3304");
};