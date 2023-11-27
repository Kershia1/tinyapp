// Packages
/////////////////////////////////////////////////
const express = require("express");
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
  getUserByEmail,
  generateRandomString,
  userSpecificURLS
 } = require('./helpers');
const path = require('path');

//Installed Middleware
/////////////////////////////////////////////////
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

//Session management
/////////////////////////////////////////////////
app.use(cookieSession({
  name: 'session',
  keys: ['suzie'],
  maxAge: 24 * 60 * 60 * 1000
}));
app.use("/static", express.static("public"));

//Template used
/////////////////////////////////////////////////
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//In-memory Database
const users = {};
const urlDatabase = {};

//Routing
/////////////////////////////////////////////////


//LOGIN
/////////////////////////////////////////////////

//render login page
app.get('/urls_login', (req, res) => {
  if (req.session.userId) {
    res.redirect('/urls');
  } else {
    const templateVars = {
      users: users[req.session.userId]
    };
    res.render('urls_login', templateVars);
  }
});

app.post('/urls_login', (req, res) => {
  const {userEmail, userPassword } = req.body;
  const user = getUserByEmail(userEmail);

  if (!user) {
      return res
      .status(400)
      .send('We could not find a user with that email address.');
  }
 
  bcrypt.compare(userPassword, user.password, (err, result) => {
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
  const userEmail = req.body.userEmail;
  const password = req.body.userPassword;
  const saltRounds = 10;

  if (!userEmail || !password || emailExists(userEmail, users)) {
    return res.status(400).send('An incorrect e-mail or password has been entered.');
  }

  const hashedPassword = bcrypt.hashSync(password, saltRounds);
  users[userID] = {
    id: userID,
    email: userEmail,
    password: hashedPassword
  };
  req.session.userId = userID;
  req.session.userEmail = userEmail;
  res.redirect('/urls');
});

//URLS
/////////////////////////////////////////////////

app.get("/urls", (req, res) => {
  const userID = req.session.userId;

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
    res.redirect(longURL);
  } else {
    res.status(404).send("I'm sorry the page you are trying to access is not here.");;
  }
});

//retrieve and allow any user to access a specific URL wether logged in or not
app.get('/u/:id', (req, res) => {
  const shortURL = req.params.id;

  if (urlDatabase[shortURL]) {
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.status(404).send("I'm sorry the page you are trying to access is not here."); 
  }
});

//PAGE RENDERING
/////////////////////////////////////////////////

//render the registration route for users
app.get('/register', (req, res) => {
  const templateVars = {
    user: users[req.session.userId],
  };
  res.render('urls_register', templateVars);
});

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

// sends a response with the url database sent as a json file 
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Listener
/////////////////////////////////////////////////
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
