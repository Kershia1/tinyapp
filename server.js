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
const helpers = require("./helpers");
const urlDatabase = helpers.urlDatabase;
const userSpecificURLS = helpers.userSpecificURLS;
//previously listed as obj, forgot it was a function
const emailExists = helpers.emailExists;
const findUserByEmail = helpers.findUserEmail
const findUserByID = helpers.findUserByID
const users = helpers.users;
const generateRandomString = helpers.generateRandomString;
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
// const users = {};
// const urlDatabase {};

//Routing
/////////////////////////////////////////////////

//render login page
app.get('/urls_login', (req, res) => {
  // console.log('get the username:', users);
  if (req.session.userId) {
  // if (req.session.user && req.session.userId) {
    res.redirect('/urls');
  } else {
    const templateVars = {
      users: undefined
      // users:users[users.req.session.userId],
    };
    res.render('urls_login', templateVars);
  }
});

//Set cookie for login 
// app.post('/urls_login', (req, res) => {
//   console.log('rebody data:', req.body);

//   const userEmail = req.body.userEmail;
//   const password = req.body.userPassword;
  
//   console.log('User Email:', userEmail);
//   console.log('Password:', password);

//   if ( !userEmail || ! password) {
//     return res.status(400).send('<p> You have enetered an incorrect e-mail or password.</p>')
//   }

//   const user = findUserByEmail(userEmail);

//   if (!bcrypt.compareSync(password, users.password)) {
//       return res.status(400).send('<p> You have enetered an incorrect e-mail or password.</p>');
//     } else {
//       req.session.userId = user.id;
//       res.redirect('/urls');
//     }
//   });
// Set cookie for login 
app.post('/urls_login', (req, res) => {
  console.log('rebody data:', req.body);

  const userEmail = req.body.userEmail;
  const password = req.body.userPassword;
  
  console.log('User Email:', userEmail);
  console.log('Password:', password);

  console.log("entering first conditional");
  if (!userEmail || !password) {
    return res.status(400).send('<p> You have entered an incorrect email or password.</p>')
  }

  console.log("indUserByEmail");
  const user = findUserByEmail(userEmail);

  console.log("beginning bcrypt");

  bcrypt.compare(password, user.password)
  console.log("in bcrypt")
    .then((result) => {
      if (result) {
        req.session.userId = user.id;
        res.redirect('/urls');
      } else {
        return res.status(400).send('<p> You have entered an incorrect email or password.</p>');
      }
    })
    .catch((error) => {
      console.log(error);
      return res.status(500).send('<p> An error occurred while comparing passwords.</p>');
    });
    console.log("exiting");
});

app.post('/register', (req, res) => {
  console.log('Received data:', req.body);
});

//Sign-out user when the Sign-out button is selected
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls_login');
});

//Delete email cookie
app.get('/logout', (req, res) => {
  res.session.userEmail = null;
  res.redirect('/urls');
});


/* Update GET /urls to only show the logged-in user's URLs using the urlsForUser function.*/
////////////////////

//Display User Name in header 
app.get("/urls", (req, res) => {
  const userID = req.session.userID;
  if (!userID) {
    res.status(401).send('Login required');
  } else {
    const userEmail = req.session.userEmail;
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
  if (req.session.user && req.session.userID) {
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
  res.session.userID= userID;
  res.redirect('/urls');
});

//Handler for post req to update a urlDatabase in database
app.post('/urls/:id', (req, res) => {
  const userID = req.session.userID;
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
  if (req.session.userID) {
    const shortURL = generateRandomString(6);
    const longURL = req.body.longURL;
    const userID = req.session.userId;

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
  const userID = req.session.userID;
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
  if (req.session.user && req.session.userID) {
    const userEmail = req.session.userEmail;
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
  const userID = req.session.userID; // need the id to match in everything 
  if (!userID) { // user id filter 
    res.status(401).send('Login or, registration required ');
  } else {
    //is there a url that  matches the user ?
    const shortURL = req.params.id;
    if (urlDatabase[shortURL] && urlDatabase[shortURL].userID === userID) {
      // if the key for the short url absolutly matches the short url key and id values continue. basicaly this is def the users key
      //const userEmail = req.session.userEmail; // retrive the email cookie 
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
  const userID = req.session.userID;
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
    const userID = urlDatabase[shortURL].userID;
    res.redirect(longURL);
  } else {
    res.status(404).send("I'm sorry the page you are trying to access is not here.");;
  }
});

//render urls index page to display all urls in database
//iterate over all URLs in the urlDatabase and filter them based on the user.
app.get('/urls', (req, res) => {
  const userID = req.session.userID;
  const userEmail = req.session.userEmail;

  if (!userID) {
    res.status(401).send('Login needed');
  }

  //if (urlDatabase[shortURL] && urlDatabase[shortURL].userID === userID) {
    const userURLS = userSpecificURLS(userID);
    const templateVars = {
      urls: userURLS,
      userEmail: userEmail
    };
    res.render("urls_index", templateVars);
  //}
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
