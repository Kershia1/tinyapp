// Packages
/////////////////////////////////////////////////
const express = require("express");
const session = require('express-session');
const cookieParser = require("cookie-parser");
const morgan = require('morgan');
const bcrypt = require("bcryptjs");

//Set-up
////////////////////////////////////////////////
const app = express();
const PORT = 8080; // default port 8080

//Helper Function's
/////////////////////////////////////////////////
// tried doing this de-structured didn't go well
const helpers = require("./helpers");
const urlDatabase = helpers.urlDatabase;
const userSpecificURLS = helpers.userSpecificURLS;
//previously listed as obj, forgot it was a function
const users = helpers.users;
const generateRandomString = helpers.generateRandomString;
const path = require('path');

//Installed Middleware
/////////////////////////////////////////////////
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
//how to set-up session management
app.use(session({
  secret: 'b@dgerBADGERMushr00m',
  resave: false,
  saveUninitialized: true
}));
app.use("/static", express.static("public"));

//Template used
/////////////////////////////////////////////////
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//Routing
/////////////////////////////////////////////////

//render login page
app.get('/urls_login', (req, res) => {
  // console.log('get the username:', users);
  if (req.cookies.user && req.cookies.userID) {
    res.redirect('/urls');
  } else {
    const templateVars = {
      users: undefined
    };
    res.render('urls_login', templateVars);
  }
});

//Set cookie for login 
app.post('/urls_login', (req, res) => {
// console.log('rebody data:', req.body);

  const userEmail = req.body.userEmail;
  const password = req.body.userPassword;
  // console.log('user email :', userEmail);
  // console.log('user password :', password);
  // return res.send('test');

  console.log('User Email:', userEmail);
  console.log('Password:', password);

  let userMatch = false;
  // test if this account exists 
  let userId; //create a liminal space to store info

  for (const id in users) {
    let user = users[id];
    if (user.email === userEmail) {
      userId = id;

      if (!bcrypt.compareSync(password, user.password)) {
        //if password given matches database
        userMatch = true;
        break;
      }
    }
  }
  if (!userMatch) {
    return res.status(403).send('<p>An incorrect email or password has been entered. Please try again.</p>');
  }
  res.cookie('userID', userId); // for id cookie
  res.cookie('userEmail', userEmail);// got email cookie (logout button functionality)
  //set the userID cookie with the matching user's random ID, then redirect to /urls.
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  console.log('Received data:', req.body);
});

//Sign-out user when the Sign-out button is selected
app.post('/logout', (req, res) => {
  res.clearCookie('userID'); //clear id cookie, not Id BUT not the value!
  res.clearCookie('userEmail')
  res.redirect('/urls_login'); //refactore to redirect to login not urls
});

//Delete email cookie
app.get('/logout', (req, res) => {
  res.clearCookie('userEmail');
  res.redirect('/urls'); //status(200).end('<p>Cookie is deleted!</p>');
});


/* Update GET /urls to only show the logged-in user's URLs using the urlsForUser function.*/
////////////////////

//Display User Name in header 
app.get("/urls", (req, res) => {
  const userID = req.cookies.userID;
  if (!userID) {
    res.status(401).send('Login required');
  } else {
    const userEmail = req.cookies.userEmail;
    const userURLS = userSpecificURLS(userID);
    const templateVars = {
      urls: userURLS,
      userEmail: userEmail
    };
    console.log('Logged in as:', userEmail);
    res.render("urls_index", templateVars);
  };
});

// Render Registration Page
app.get('/register', (req, res) => {
  if (req.cookies.user && req.cookies.userID) {
    res.redirect('/urls');
  } else {
    const templateVars = {
      userEmail: undefined
    };
    res.render('urls_register', templateVars);
  }
});

// POST /register
app.post('/register', (req, res) => {
  // pull the info off the body object
  const userEmail = req.body.userEmail;
  const password = req.body.userPassword;

  // did we NOT receive an email and/or password
  if (!userEmail || !password) {
    return res.status(400).send('Both e-mail and a password must be provided to successfully register.');
  }

  // look through existing users to see if one already has the email provided
  let registeredUser = null;

  for (const userId in users) {
    const user = users[userId];
    if (user.email === userEmail) {
      registeredUser = user;
    }
  }

  // did we find an existing user with that email?
  if (registeredUser) {
    return res.status(400).send('a user with that email already exists');
  }

const hashedPassword = bcrypt.hashSync(password, 10);
  // happy path! we can create the new user object
  const userID = generateRandomString(8);
  const newUser = {
    id: userID,
    email: userEmail,
    password: hashedPassword
  };

  // add the new user to the users object
  users[userID] = newUser;
  //console.log(users);
  res.cookie('userID', userID);
  res.redirect('/urls');
});

//Handler for post req to update a urlDatabase in database
app.post('/urls/:id', (req, res) => {
  const userID = req.cookies.userID;
  if (!userID) {
    res.status(401).send('Login required');
  } else {
    const shortURL = req.params.id;
    if (urlDatabase[shortURL]) {
      if (urlDatabase[shortURL].userID === userID) {
        // Get the updated longURL from the req body
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

//Handler for post req to create a new shortURL, then add to database
app.post('/urls', (req, res) => {
  if (req.cookies.userID) {
    const shortURL = generateRandomString(6);
    const longURL = req.body.longURL;
    const userID = req.cookies.user_ID;

    urlDatabase[shortURL] = {
      //add these keys and values to the new nested database
      longURL: longURL,
      userID: userID
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.redirect('/urls_login');
  }
});

//delets selected URL from table of URLS
app.post('/urls/:id/delete', (req, res) => {
  const userID = req.cookies.userID;
  if (!userID) {
    res.status(401).send('Login or, registration required');
  } else {
    const shortURL = req.params.id;
//does it exist in database? Is the current user the owner of the URL?
    if (urlDatabase[shortURL] && urlDatabase[shortURL].userID === userID) {
      const deleteUrl = req.params.id; //Already done on line 263 redundant?
      delete urlDatabase[deleteUrl]; //delete specific url from the database
      res.redirect('/urls');// redirect to appropiate location
    } else {
      //current user not the owner fo the url or the specified url dosen't exist
      res.status(403).send("You are not authorized to delete this entry.");
    }
  }
});

//render new urls page
app.get('/urls/new', (req, res) => {
  if (req.cookies.user && req.cookies.userID) {
    const userEmail = req.cookies.userEmail;
    const templateVars = {
      userEmail: userEmail
    };
    console.log('logged in:', userEmail);
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/urls_login');
  }
});

//retrive user specific urls from the datatbase
app.get('/urls/:id', (req, res) => {
  const userID = req.cookies.userID; // need the id to match in everything 
  if (!userID) { // user id filter 
    res.status(401).send('Login or, registration required ');
  } else {
    //is there a url that  matches the user ?
    const shortURL = req.params.id;
    if (urlDatabase[shortURL] && urlDatabase[shortURL].userID === userID) {
      // if the key for the short url absolutly matches the short url key and id values continue. basicaly this is def the users key
      //const userEmail = req.cookies.userEmail; // retrive the email cookie 
      const templateVars = { // acessing the nested k : v ps 
        id: shortURL, // access the key
        longURL: urlDatabase[shortURL].longURL, // check the key with new route 
        userID: userID //check the userID
      };
      res.render('urls_show', templateVars);
    } else {
      //redirect if wrong user or not their url
      res.status(403).send('You are not authorized to access this URL!');
    }
  }
});

//retrieve  a specific URL to Edit on the urls_shows pg
app.post('/urls/:id', (req, res) => {
  const userID = req.cookies.userID;
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
  if (urlDatabase[shortURL]) {
    const longURL = urlDatabase[shortURL].longURL;
    const userID = urlDatabase[shortURL].userID;
    res.redirect(longURL);
  } else {
    res.status(404).send("I'm sorry the page you are trying to access is not here.");;
  }
});

//render urls index page to display all urls in database
app.get('/urls', (req, res) => {
  const userEmail = req.cookies.userEmail;
  const templateVars = {
    urls: urlDatabase,
    userEmail: userEmail
  };
  res.render("urls_index", templateVars);
});

//route to render index 
app.get('/index', (req, res) => {
  res.render('index');
});

//route to render about
app.get('/about', (req, res) => {
  const userEmail = req.cookies.userEmail;
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
