// Packages
/////////////////////////////////////////////////
const express = require("express");
//const session = require('express-session');
const cookieSession = require("cookie-session");
const morgan = require('morgan');
const bcrypt = require("bcryptjs");

//Set-up
////////////////////////////////////////////////
const app = express();
const PORT = 8080; // default port 8080

//Helper Function's
/////////////////////////////////////////////////

const {
  emailExists,
  findUserByID,
  findUserByEmail,
  generateRandomString,
  userSpecificURLS
 } = require('./helpers');

/*
const helpers = require("./helpers");
//const urlDatabase = helpers.urlDatabase;
const userSpecificURLS = helpers.userSpecificURLS;
//previously listed as obj, forgot it was a function
const emailExists = helpers.emailExists;
const findUserByEmail = helpers.findUserEmail
const findUserByID = helpers.findUserByID
//const users = helpers.users;
const generateRandomString = helpers.generateRandomString;
*/
const path = require('path');

//Installed Middleware
/////////////////////////////////////////////////
app.use(express.urlencoded({ extended: true }));
//app.use(cookieParser());
app.use(morgan('dev'));

//Session management
/////////////////////////////////////////////////
app.use(cookieSession({
  //keeping as close to bcrypt example in doc as possible.
  //try user_id to make sessions like bycrypt docs?
  name: 'session',
  keys: ['suzie'],
  maxAge: 24 * 60 * 60 * 1000
}));
app.use("/static", express.static("public"));

//Template used
/////////////////////////////////////////////////
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Maybe try to login and use empty obj ?
//will be an in-memory database object to store data, BUT.... will delete ever time server restarts, however this will work as the preexisting users are stored in the users object and I cannot seem to get the users object to work as a database with the passwords hashed.
const users = {};
const urlDatabase = {};

//Routing
/////////////////////////////////////////////////


//LOGIN
/////////////////////////////////////////////////

//render login page
app.get('/urls_login', (req, res) => {
  console.log('User in /urls_login:', users[req.session.userId]);
  if (req.session.userId) {
  // if (req.session.user && req.session.userId) {
    res.redirect('/urls');
  } else {
    const templateVars = {
      users: users[req.session.userId]
      // users:users[users.req.session.userId],
    };
    res.render('urls_login', templateVars);
  }
});

app.post('/urls_login', (req, res) => {
  const {userEmail, userPassword } = req.body;
  console.log('User Provided Email:', userEmail);
  const user = findUserByEmail(userEmail); // find user by email

  if (!user) {
      return res
      .status(400)
      .send('We could not find a user with that email address.');
  }
  console.log('Hashed password in database:', user.password); // Log the hashed password

  bcrypt.compare(userPassword, user.password, (err, result) => {
    console.log('User Provided Password:', userPassword);
    console.log('Hashed Password in Database:', user.password);
    console.log('Password Comparison Result:', result);

    if (!result) {
      return res
      .status(400)
      .send('You have entered an incorrect password.');
    }
      req.session.userId = user.id;
      res.redirect('/urls');
  });
});

//LOGOUT
/////////////////////////////////////////////////

//Sign-out user when the Sign-out button is selected
app.post('/logout', (req, res) => {
  delete req.session.userId;
  //req.session = null;
  res.redirect('/urls_login');
});

//Delete email cookie
app.get('/logout', (req, res) => {
  req.session.userEmail = null;
  res.redirect('/urls');
});

//REGISTRATION
/////////////////////////////////////////////////

// Render Registration Page
app.get('/register', (req, res) => {
  //console.log('User in /register:', users[req.session.userId]);
  if (req.session.userId && users[req.session.userId]) {
    console.log('Logged in as:', users[req.session.userId].email);
    res.redirect('/urls');
  } else {
    const templateVars = {
      user: users[req.session.userId],
      userEmail: req.session.userEmail
    };
    res.render('urls_register', templateVars);
  }
});

// POST /register
app.post('/register', (req, res) => {
  const userID = generateRandomString(8);
  console.log('Generated userID:', userID);
  const userEmail = req.body.userEmail;
  const password = req.body.userPassword;
  const saltRounds = 10;

  if (!userEmail || !password || emailExists(userEmail, users)) {
    return res.status(400).send('An incorrect e-mail or password has been entered.');
  }

  // console.log('Users before registration:', users);
  // console.log('Session before registration:', req.session);

const hashedPassword = bcrypt.hashSync(password, saltRounds);
  users[userID] = {
    id: userID,
    email: userEmail,
    password: hashedPassword
  };
  req.session.userId = userID; //needed to create a session for the user facepalm moment
  console.log('Users after registration:', users);
  console.log('Session after registration:', req.session);
  res.redirect('/urls');
});

//URL HANDELING
/////////////////////////////////////////////////


//URLS
/////////////////////////////////////////////////

app.get("/urls", (req, res) => {
  const userID = req.session.userId;
  console.log('User in /urls:', users[userID]);

  if (!userID) {
    res.status(401).send('Login required');
  } else {
    const userEmail = req.session.userEmail;
    const userURLS = userSpecificURLS(userID, urlDatabase);
    const user = users[userID];
    const templateVars = {
      urls: userURLS,
      user: user,
      userEmail: userEmail
    };
    console.log('Logged in as:', userEmail);
    return res.render("urls_index", templateVars);
  };
});

//Handler for post req to create a new shortURL, then add to database
app.post('/urls', (req, res) => {
  if (req.session.userId) {
    const shortURL = generateRandomString(6);
    const userID = req.session.userId;

    if (findUserByID(userID, users)) {
      urlDatabase[shortURL] = {
        longURL: req.body.longURL,
        userID: userID
      };
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    return res
    .status(400)
    .send("You must be logged in, to interact with your URLs.")
    .redirect('/urls_login');
  }
});


//Handler for post req to update a urlDatabase in database
app.post('/urls/:id', (req, res) => {
  const userID = req.session.userId;
  if (!userID) {
    res.status(401).send('Login required');
  } else {
    const shortURL = req.params.id;
    if (urlDatabase[shortURL]) {
      if (urlDatabase[shortURL].userID === userID) {
        const newLongURL = req.body.newLongURL;
        urlDatabase[shortURL].longURL = newLongURL;
        res.redirect('/urls');
      } else {
        res.status(403).send('You are not authorized to update this URL.');
      }
    } else {

      res.status(404).send('URL not found');
    }
  }
});


//delets selected URL from table of URLS
app.post('/urls/:id/delete', (req, res) => {
  const userID = req.session.userId;
  if (!userID) {
    res.status(401).send('Login or, registration required');
  } else {
    const shortURL = req.params.id;
    if (urlDatabase[shortURL] && urlDatabase[shortURL].userID === userID) {
      const deleteUrl = req.params.id; 
      delete urlDatabase[deleteUrl];
      res.redirect('/urls');
    } else {
      res.status(403).send("You are not authorized to delete this entry.");
    }
  }
});

//render new urls page
app.get('/urls/new', (req, res) => {
const userID = req.session.userId;
const user = findUserByID(userID, users);

  if ( user === null) {
    return res.redirect('/login');
  } else {
    const userEmail = req.session.userEmail;
    const templateVars = {
      urls: urlDatabase,
      user: users[userID],
      userEmail: userEmail
      
  }
  console.log('logged in:', userEmail);
  res.render('urls_new', templateVars);
  }
});

//retrive user specific urls from the datatbase
app.get('/urls/:id', (req, res) => {
  const userID = req.session.userId;
  if (!userID) {
    res.status(401).send('Login or, registration required ');
  } else {
    const shortURL = req.params.id;
    if (urlDatabase[shortURL] && urlDatabase[shortURL].userID === userID) {
      const user = users[userID];
      const templateVars = {
        id: shortURL,
        longURL: urlDatabase[shortURL].longURL,
        user: user
      };
      res.render('urls_show', templateVars);
    } else {
      res.status(403).send('You are not authorized to access this URL!');
    }
  }
});

//retrieve  a specific URL to Edit on the urls_shows pg
app.post('/urls/:id', (req, res) => {
  const userID = req.session.userId;
  if (!userID) {
    res.status(401).send('Login or, registration required ');
  } else {
    const shortURL = req.params.id;
    if (urlDatabase[shortURL] && urlDatabase[shortURL].userID === userID) {
      const editURL = req.body.longURL;
      if (urlDatabase[editURL].longURL) {
        res.redirect('/urls');
      } else {
        res.status(404).send("I'm sorry the page you are trying to access is not here.");
      }
    }
  }
});

//retrieve  a specific URL to Edit on the urls_shows pg
app.get('/u/:id', (req, res) => {
  const shortURL = req.params.id;
  const userID = req.session.userID;

  if (urlDatabase[shortURL] && urlDatabase[shortURL].userID === userID) {
    const longURL = urlDatabase[shortURL].longURL;
    const userID = urlDatabase[shortURL].userId;
    res.redirect(longURL);
  } else {
    res.status(404).send("I'm sorry the page you are trying to access is not here.");;
  }
});


//PAGE RENDERING
/////////////////////////////////////////////////

//render the login route for users 
app.get('/login', (req, res) => {
  const templateVars = {
    user: users[req.session.userId],
  };
  res.render('urls_login', templateVars);
})

//render urls index page to display all urls in database
//iterate over all URLs in the urlDatabase and filter them based on the user.
app.get('/urls', (req, res) => {
  const userID = req.session.userId;

  if (!userID) {
    res.status(401).send('Login needed');
  }
    const user = users[userID];
    const userURLS = userSpecificURLS(userID);
    const templateVars = {
      urls: userURLS,
      user: user
    };
    res.render("urls_index", templateVars);
});

//route to render index 
app.get('/index', (req, res) => {
  res.render('index');
});

//route to render about
app.get('/about', (req, res) => {
  const userEmail = req.session.userEmail;
  const templateVars = {
    userEmail: userEmail
  };
  res.render('about', templateVars);
});

// sends a response with the url database sent as a json file 
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Listener
/////////////////////////////////////////////////
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
