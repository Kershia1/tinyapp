// Packages
/////////////////////////////////////////////////
const express = require("express");
const session = require('express-session');
const cookieParser = require("cookie-parser");
const morgan = require('morgan');

//Set-up
////////////////////////////////////////////////
const app = express();
const PORT = 8080; // default port 8080


//Helper Function's
/////////////////////////////////////////////////
// tried doing this de-structured didn't go well
const helpers = require("./helpers");
const urlDatabase = helpers.urlDatabase;
const user = helpers.user;
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
  if (req.cookies.user && req.cookies.userID) { //actully check for cookie and matching user id property
    res.redirect('/urls');
  } else { // if false redirect and render login page
    const templateVars = {
      users: undefined
    };
    res.render('urls_login', templateVars);
  }
});

//Set cookie for login 
app.post('/urls_login', (req, res) => {

  const userEmail = req.body.email;
  const password = req.body.password;

  console.log('User Email:', userEmail);
  console.log('Password:', password);

  let userMatch = false;
  // test if this account exists 
  let userId; //create a liminal space to store info

  for (const id in users) {
    let user = users[id];
    if (user.email === userEmail) {
      //if email given matches database
      userId = id; //ReferenceError: id is not defined

      if (user.password === password) {
        //if password given matches database
        userMatch = true;
        // let userId = id; redundant code
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

//Sign-out user when the Sign-out button is selected
app.post('/logout', (req, res) => {
  res.clearCookie('userID'); //clear id cookie, not Id BUT not the value!
  res.redirect('/urls_login'); //refactore to redirect to login not urls
});

//Delete email cookie
app.get('/logout', (req, res) => {
  res.clearCookie('userEmail'); // DELETE A COOKIE BY KEY
  res.redirect('/urls'); //status(200).end('<p>Cookie is deleted!</p>');
});
//look at session option for logging out the user

//Display User Name in header 
app.get("/urls", (req, res) => {
  const userEmail = req.cookies.userEmail; // need to request the cookies here 
  const templateVars = {
    urls: urlDatabase,
    userEmail: userEmail // do not request here in object
  };
  console.log('Logged in as:', userEmail);
  res.render("urls_index", templateVars);
});

// Render Registration Page
//always remeber the status of the user no account, registered, and logged in ...
app.get('/register', (req, res) => {
  if (req.cookies.user && req.cookies.userID) { //actully check for cookie and matching user id property
    res.redirect('/urls');
  } else {
    const templateVars = {
      userEmail: undefined
    };
    res.render('urls_register', templateVars);
  }
});

//Duy's Happy Path intigrated in with my not happy path.
// POST /register
app.post('/register', (req, res) => {
  // pull the info off the body object
  const userEmail = req.body.email; // email paras
  const password = req.body.password;// password paras

  // did we NOT receive an email and/or password
  if (!userEmail || !password) {
    return res.status(400).send('Both e-mail and a password must be provided to successfully register.');
  }

  // look through existing users to see if one already has the email provided
  let registeredUser = null;

  for (const userId in users) {
    const user = users[userId];
    if (user.email === userEmail) {
      // we found a duplicate email
      registeredUser = user;
    }
  }

  // did we find an existing user with that email?
  if (registeredUser) {
    return res.status(400).send('a user with that email already exists');
  }

  // happy path! we can create the new user object
  const userID = generateRandomString(8); //create random user name 8 of 8
  const newUser = {
    id: userID,
    email: userEmail,
    // password: bcrypt.hashSync(password, 10)
  };

  // add the new user to the users object
  users[userID] = newUser;
  console.log(users); //error handeling
  res.cookie('userID', userID);
  res.redirect('/urls');
});

//Handler for post req to update a urlDatabase in database
app.post('/urls/:id', (req, res) => {
  const longURL = req.body.newLongURL; //adding new long URL
  const shortURL = req.params.id; // setting params to get short url
  urlDatabase[shortURL] = longURL; //store in database
  res.redirect('/urls');
});

//Handler for post req to create a new shortURL, then add to database
// not sure how to handle, don't quite understand the question
// to adapt function CRUD need a logged in user (userID)  and the corresponding longURL
//new entry to add to database will be to be shortUrl = key, with .longURl obj, and userID becomes of the value.
app.post('/urls', (req, res) => {
  if (req.cookies.userID) { 
  const shortURL = generateRandomString(6); 
  const longURL = req.body.longURL;
  const userID = req.cookies.user_ID;
  
  urlDatabase[shortURL] = {
   //add these keys and values to the new nested database
   longURL: longURL,
   userID: userID
  }
  res.redirect(`/urls/${shortURL}`); //backtick for template literal
  //newly created shortURL page 
} else {
  res.redirect('/urls_login');
  }
});

//delets selected URL from table of URLS
app.post('/urls/:id/delete', (req, res) => {
  const deleteUrl = req.params.id;
  if (urlDatabase[deleteUrl].longURL) {
    delete urlDatabase[deleteUrl].longURL;
    res.redirect('/urls');
  } else {
    res.status(404).send("I'm sorry the page you are trying to access is not here.");
  }
});

//render new urls page
app.get('/urls/new', (req, res) => {
  if (req.cookies.user && req.cookies.userID) { //actully check for cookie and matching user id property
  const userEmail = req.cookies.userEmail;
  const templateVars = {
    userEmail: userEmail
  };
  console.log('logged in:', userEmail);
  res.render('urls_new', templateVars);
} else {
  res.redirect('/urls_login'); // is this the corerct placement within body?
} //error 404 used /login not urls_login
});

//render the 'urls_show' page to display a specific URL
app.get('/urls/:id', (req, res) => {
  const userEmail = req.cookies.userEmail;
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    userID: req.session.user.id,
    userEmail: userEmail
  };
  res.render('urls_show', templateVars);
});

//retrieve  a specific URL to Edit on the urls_shows pg
app.post('/urls/:id', (req, res) => {
  const editURL = req.body.longURL;
  if (urlDatabase[editURL].longURL) {
    res.redirect('/urls');
  } else {
    res.status(404).send("I'm sorry the page you are trying to access is not here.");
  }
});

//Redirection from short url alias to long url
// potential for error handeling?
app.get('/u/:id', (req, res) => {
  const shortURL = req.params.id;
  if (urlDatabase[shortURL]) {
  const longURL = urlDatabase[shortURL].longURL;
  const userID = urlDatabase[shortURL].userID;
  // if (longURL) {
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
  res.render("urls_index", templateVars); //render in urls_index.ejs
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
  res.render('about', templateVars); //render about
});

// sends a response with the url database sent as a json file 
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
}); // JSON String => returns urlDatabase object at that point in time 

//Listener
/////////////////////////////////////////////////
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
