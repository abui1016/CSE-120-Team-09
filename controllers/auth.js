// gets time for the timestamps. 
function getTime(){
var date = new Date();
var myDate = new Date();
        // get hour value.
        var hours = myDate.getHours();
        var ampm = hours >= 12 ? 'Pm' : 'Am';
        hours = hours % 12;
        hours = hours ? hours : 12;
        var minutes = myDate.getMinutes();
        minutes = minutes < 10 ? '0' + minutes : minutes;
        var myTime = hours + " " + ampm + " : " + minutes;
        return myTime;
}



// Import DB and SQL
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
// const bcrypt = require('bcryptjs');

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

// Registrations Template and 

const optionsRegister = {
  from: process.env.SES_FROM,
  to: process.env.SES_TO,
  subject: "EFM : Account Registered",
  text: "Hello , " + " User \n You are now registered user for Early Family Math if you wish to get started please follow the link to setup content delivery. We have also attached a form to this email that is a quick start guide to walk you through setup. ",
  attachments: [
      {
        path: 'test.txt'
      },
    ],
};

function sendMailRegister() {
  transporter.sendMail(optionsRegister, function (err, info) {
    if (err) {
      console.log(err);
      return;
    }
    console.log("Sent: " + info.response);
  });
}

const optionsLogin = {
  from: process.env.SES_FROM,
  to: process.env.SES_TO,
  subject: "Early Family Math User Login",
  text: "User has successfully logged in at " + getTime() + ".",
  
};

function sendMailLogin() {
  transporter.sendMail(optionsLogin, function (err, info) {
    if (err) {
      console.log(err);
      return;
    }
    console.log("Sent: " + info.response);
  });
}


// This is for sending out the email upon any change to a users setting. 

const optionsSettingChange = {
  from: process.env.SES_FROM,
  to: process.env.SES_TO,
  subject: "Nodemailer Login",
  text: "A user has successfully logged in at " + getTime(),
  // attachments: [
  //     {
  //       path: 'directory/filename'
  //     },
  //   ],
};

function sendMailSettingChange() {
  transporter.sendMail(optionsSettingChange, function (err, info) {
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


  // Checks to see if any input was actually inputed into all the fields otherwise sends them all back. 
  if(firstName  == ""|| lastName  == "" ||emailAddress  == "" ||phoneNumber  == "" ||password  == "" || passwordConfirm  == "" || passwordConfirm == "" ){
    return res.render("register", {
      message: "Please input all feilds before continuing",
    });
  }

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

      db.query(
        "INSERT INTO users SET ?",
        {
          firstName: firstName,
          lastName: lastName,
          emailAddress: emailAddress,
          phoneNumber: phoneNumber,
          password: password,
          skillLevel: skillLevel,
        },
        (error, results) => {
          if (error) {
            console.log(error);
          } else {
            console.log(results);
            sendMailRegister();
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

  // Query DB to match an email and password
  // If there is no match -> invalid login
  db.query(
    "SELECT emailAddress, password FROM users WHERE emailAddress = ? AND password = ?",
    [emailAddress, password],
    (error, results) => {
      if (error) {
        console.log(error);
      }
      if (results.length === 1) {
        sendMailLogin();
        return res.render("login", {
          message: "Successfully logged in!",
        });
      } else {
        return res.render("login", {
          message: "This is the number of items " ,
        });
      }
    }
  );
};


exports.test = (req, res) => {

};