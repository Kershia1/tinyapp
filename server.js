// Packages
const express = require("express");
const cookieSession = require("cookie-session");
const morgan = require('morgan');
const bcrypt = require("bcryptjs");

//Set-up
const app = express();
const PORT = 8080; // default port 8080

//Helper Function's
const {
  emailExists,
  findUserByID,
  generateRandomString,
  userSpecificURLS
} = require('./helpers');
const path = require('path');
const { url } = require("inspector");

//Installed Middleware
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

//Session management
app.use(cookieSession({
  name: 'session',
  keys: ['suzie'],
  maxAge: 24 * 60 * 60 * 1000
}));

app.use("/static", express.static("public"));

//Template used
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//In-memory Database
const users = {};
const urlDatabase = {};

//landing page
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.redirect('/urls');
  } else {
    res.redirect('/urls_login');
  }
});

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
  const { userEmail, userPassword } = req.body;
  console.log('userEmail:', userEmail);

  let foundUser = null;
  for (const userId in users) {
    if (users[userId].email === userEmail) {
      foundUser = users[userId];
      break;
    }
  }

  if (!foundUser) {
    return res.status(400).send('We could not find a user with that email address.');
  }

  bcrypt.compare(userPassword, foundUser.password, (err, result) => {
    if (err || !result) {
      return res.status(400).send('You have entered an incorrect password.');
    }
    req.session.userId = foundUser.id;
    res.redirect('/urls');
  });
});

//Delete user cookie session when the Sign-out button is selected
app.post ('/logout', (req, res) => {
  req.session = null;
    res.redirect('/urls_login');
  });

// Render Registration Page, register new user
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

// Create new user and add to database
app.post('/register', (req, res) => {
  const userID = generateRandomString(8);
  const userEmail = req.body.userEmail;
  const password = req.body.userPassword;
  const saltRounds = 10;

  if (!userEmail || !password || emailExists(userEmail, users)) {
    //check logic to ensure passwords are not being chaecked against other e-mails
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

//Handler for get req to display all urls in database
app.get('/urls', (req, res) => {
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
    return res.render('urls_index', templateVars);
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
    res.redirect('/urls');
  } else {
    return res.status(400).send("You must be logged in, to interact with your URLs.").redirect('/urls_login');
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

//delets a logged in usersURL selected URL from table of URLS
app.post('/urls/:id/delete', (req, res) => {
  const shortURL = req.params.id;
  const userID = req.session.userId;
  if (!userID) {
    res.status(401).send('Login or, registration required');
  } else {
    if (urlDatabase[shortURL] && urlDatabase[shortURL].userID === userID) {
      delete urlDatabase[shortURL];
      res.redirect('/urls');
    } else {
      res.status(403).send("You are not authorized to delete this entry.");
    }
  }
});

//make the shortURL editable
app.get('/urls/:id/edit', (req, res) => {
  const userID = req.session.userId;
  if (!userID) {
    res.status(401).send('Login or, registration required ');
  } else {
    const shortURL = req.params.id;

    
    if (urlDatabase[shortURL] && urlDatabase[shortURL].userID === userID) {
      const templateVars = {
        id: shortURL,
        longURL: urlDatabase[shortURL].longURL
      };
      res.render('urls_edit', templateVars);
    } else {
      res.status(404).send("I'm sorry the page you are trying to access is not here.");
    }
  }
});

// Edit a logged-in user's URL on the urls_shows page
app.post('/urls/:id/edit', (req, res) => {
  const userID = req.session.userId;
  if (!userID) {
    res.status(401).send('Login or registration required');
  } else {
    const shortURL = req.params.id;
    console.log(`checking url parmeters: ${shortURL}`);
    console.log(`urlDatabase[${shortURL}].userID: ${urlDatabase[shortURL].userID}`);
    console.log(`userID: ${userID}`);

    if (urlDatabase[shortURL] && urlDatabase[shortURL].userID === userID) {
      let newLongURL = req.body.newLongURL;

        if(!newLongURL.startsWith('http://') && !newLongURL.startsWith('https://')) {
          newLongURL = `http://${newLongURL}`;
    }
      urlDatabase[shortURL].longURL = newLongURL;
      res.redirect('/urls');
    } else {
      res.status(404).send("I'm sorry, the page you are trying to access is not here.");
    }
  }
});

//render new urls page
app.get('/urls/new', (req, res) => {
  const userID = req.session.userId;
  const user = findUserByID(userID, users);

  if (user === null) {
    return res.redirect('/login');
  } else {
    const userEmail = req.session.userEmail;
    const templateVars = {
      urls: urlDatabase,
      user: users[userID],
      userEmail: userEmail,
    };
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
        user: user,
      };
      res.render('urls_show', templateVars);
    } else {
      res.status(403).send('You are not authorized to access this URL!');
    }
  }
});

//retrieve and allow any user to access a specific URL wether logged in or not
app.get('/u/:id', (req, res) => {
  const shortURL = req.params.id;
  let longURL;
  if (urlDatabase[shortURL]) {
  longURL = urlDatabase[shortURL].longURL;
    console.log('longURL redirection:', longURL);
    res.redirect(longURL);
  } else {
    console.log('longURL redirection FAILED:', longURL);
    res.status(404).send("I'm sorry the page you are trying to access is not here.");
  }
});

//render urls new page to create a new shortURL
app.get('/:id', (req, res) => {
  const shortURL = req.params.id;

  if (urlDatabase[shortURL]) {
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.status(404).send("I'm sorry the page you are trying to access is not here.");
  }
}); 

// sends a response with the url database sent as a json file 
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//listen on port 8080
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});