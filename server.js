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
// app.set("views", join(__dirname, "views"));
app.set("view engine", "ejs");

//Routing
/////////////////////////////////////////////////

//Handler for Get request to set cookie, and display login form
app.get('/login', (req, res) => {
  const user_ID = ""; // You should specify the user_ID here
  const userData = users[id]; //user k:v p
  if (userData) { // passed obj is t 
    req.cookie('user_ID', userData.user_ID); // Set a cookie with the user_ID
    console.log('Cookie set:', userData.user_ID); // Add this line to log the cookie value
    res.redirect('/urls');// if all good
  } else {
    res.status(404).end('<p>User not found</p>');//redirect failed
  }
});

//Set cookie for login 
app.post('/login', (req, res) => {
  const user_ID = req.body.user_ID; // Read the cookie with the key 'user_ID'
  // console.log('User Name:', user_ID); // I want this to be on the header?
  if (user_ID) {
    res.cookie('user_ID', user_ID);
  }
  res.redirect('/urls');
});
//req.session.user_ID = user_ID; instead of cookies
//Sign-out user when the Sign-out button is selected
app.post('/logout', (req, res) => {
  res.clearCookie('user_ID');
  res.redirect('/urls');
});

//Delete User Cookie
app.get('/login', (req, res) => {
  // for(const user_ID in req.cookies) {
  //     res.clearCookie(user_ID);
  // }
  res.clearCookie('user_ID'); // DELETE A COOKIE BY KEY
  res.redirect('/urls'); //status(200).end('<p>Cookie is deleted!</p>');
});
//look at session option for logging out the user


//Display User Name in header 
app.get("/urls", (req, res) => {
  const user_ID = req.cookies.user_ID; // need to request the cookies here 
  const templateVars = {
    urls: urlDatabase,
    user_ID: user_ID, // do not request here in object
  };
  console.log('Logged in as:', user_Email);
  res.render("urls_index", templateVars);
});

//Display User Name in header 
// app.get("/urls", (req, res) => {
//   const user_ID = req.cookies.user_ID; // need to request the cookies here 
//   const templateVars = {
//     urls: urlDatabase,
//     user_ID: user_ID, // do not request here in object
//   };
//   console.log('Logged in as:', user_Email);
//   res.render("urls_index", templateVars);
// });

// Render Registration Page
//always remeber the status of the user no account, registered, and logged in ...
app.get('/register', (req, res) => {
  const templateVars = {
    user_ID: undefined
  };
  res.render('urls_register', templateVars);
});

//POST submitted forms to registration page
//Handler to register new user, save to user database, redirect to urls
app.post('/register', (req, res) => {
  const user_ID = generateRandomString(8); //create random user name 8 of 8 characters.
  // const user_ID = req.body.user_ID; feel like this will throw an error with headers as undefined?
  const user_Email = req.body.email; // email paras
  const password = req.body.password;// password paras
  //filter by checking if the email has already been used
  const registered_Email = Object.values(users).some(user => user.email === user_Email); // access and compar ID and Email, used .sort by accident
  const registered_ID = user_ID in users;//?
  if (registered_Email || registered_ID ) { 
    res.status(400).send('This email is already in use please try another.'); //
  } else {
    // email is not registered pass through users Object access k:v p's and create a new user?
    users[user_ID] = {
      id: user_ID,
      email: user_Email,
      password: password
    };
    console.log(users); //error handeling
    res.cookie('user_ID', user_ID);
    res.redirect('/urls');// my endpoint back to urls
  }
});

//Handler for post req to update a urlDatabase in database
app.post('/urls/:id', (req, res) => {
  const longURL = req.body.newLongURL; //adding new long URL
  const shortURL = req.params.id; // setting params to get short url
  urlDatabase[shortURL] = longURL; //store in database
  res.redirect('/urls'); // back to urls 
});

//Handler for post req to create a new shortURL, then add to database
app.post('/urls', (req, res) => {
  const shortURL = generateRandomString(6); // make random alphanumeric string.
  urlDatabase[shortURL] = req.body.longURL; //longURl to add to database
  res.redirect(`/urls/${shortURL}`); //newly created shortURL page 
  // res.status(200).send("Added URL: " + req.body.longURL)
});

//delets selected URL from table of URLS
app.post('/urls/:id/delete', (req, res) => {
  const deleteURL = req.params.id;
  if (urlDatabase[deleteURL]) {
    delete urlDatabase[deleteURL];
    res.redirect('/urls');
  } else {
    res.status(404).send("I'm sorry the page you are trying to access is not here.");
  }
});

//render new urls page
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user_ID: req.session.user_ID
  };
  res.render("urls_new", templateVars);
});

//render the 'urls_show' page to display a specific URL
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user_ID: req.session.user_ID
  };
  res.render("urls_show", templateVars);
});

//retrieve  a specific URL to Edit on the urls_shows pg
app.post("/urls/:id", (req, res) => {
  const editURL = req.body.longURL;
  if (urlDatabase[editURL]) {
    res.redirect('/urls');
  } else {
    res.status(404).send("I'm sorry the page you are trying to access is not here.");
  }
});

//Redirection from short url alias to long url
// potential for error handeling?
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send("I'm sorry the page you are trying to access is not here.");;
  }
});

//render urls index page to display all urls in database
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars); //render in urls_index.ejs
});

//route to render index 
app.get('/index', (req, res) => {
  res.render('index');
});

//route to render about
app.get('/about', (req, res) => {
  const templateVars ={
    user_ID: req.params.user_ID
  }
  res.render('about'); //render about
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
