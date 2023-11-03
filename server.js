// Packages
/////////////////////////////////////////////////
const express = require("express");
// const session = require('express-session');
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
const generateRandomString = helpers.generateRandomString;

//Installed Middleware
/////////////////////////////////////////////////
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use("/static", express.static("public")); //express.static(root, [options])
//The express.static() function is a built-in middleware function in Express. It serves static files and is based on serve-static. Parameters: The root parameter describes the root directory from which to serve static assets. 
// https://www.geeksforgeeks.org/express-js-express-static-function/
//Return Value: It returns an Object. 



//Template used
/////////////////////////////////////////////////
app.set("view engine", "ejs");

//Routing
/////////////////////////////////////////////////

//Handler for Get request to set cookie, and display login form
app.get('/login', (req, res) => {
  const username = "Michelle_Flowers"; // You should specify the username here
  const userData = user[username]; //user k:v p
  if (userData) { // passed obj is t 
    req.cookie('username', userData.username); // Set a cookie with the username
    console.log('Cookie set:', userData.username); // Add this line to log the cookie value
    res.redirect('/urls');// if all good
  } else {
    res.status(404).end('<p>User not found</p>');//redirect failed
  }
});

//Set cookie for login 
app.post('/login', (req, res) => {
  const username = req.body.username; // Read the cookie with the key 'userName'
  // console.log('User Name:', username); // I want this to be on the header?
  if (username) {
    res.cookie('username', username);
  }
  res.redirect('/urls');
});

//Sign-out user when the Sign-out button is selected
app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

//Delete User Cookie
app.get('/login', (req, res) => {
  // for(const username in req.cookies) {
  //     res.clearCookie(username);
  // }
  res.clearCookie('username'); // DELETE A COOKIE BY KEY
  res.redirect('/urls'); //status(200).end('<p>Cookie is deleted!</p>');
});

//Display User Name in header 
app.get("/urls", (req, res) => {
  const username = req.cookies.username; // need to request the cookies here 
  const templateVars = {
    urls: urlDatabase,
    username: username, // do not request here in object
  };
  console.log('Logged in as:', username);
  res.render("urls_index", templateVars);
});

// a GET /register endpoint, which returns the template you just created.


// Instruction
// Create a new template that includes a form with an email address and password field. The email field should use type=email and have name=email. The password field should use type=password and have name=password. The form should POST to /register.
////////////// IN progress 
//Renders Registration Page
app.get("/urls/register", (req, res) => {
  const templateVars = {
    user: req.cookies.username,
    password: req.cookies.password
  }
  res.render("urls_register", templateVars);
});

app.post('/register', (req, res) => {
  const username = req.body.username; // Read the cookie with the key 'userName'
  // console.log('User Name:', username); // I want this to be on the header?
  const password = req.body.password
  if (username && password) {
    res.cookie('username', username);
    res.cookie('passsword', password);
  }
  res.redirect('/urls');
});

//////////////
//render new urls page
// app.get("/urls/new", (req, res) => {
//   res.render("urls_new");
// });

//post /register route is in the next activity, will return 404 until we reach that stage


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
  res.render("urls_new");
});

//render the 'urls_show' page to display a specific URL
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id]
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

//Basic welcome message done with HTML
app.get("/hello", (req, res) => {
  res.send("<html><body><b>Welcome !</b></body></html>\n");
}); // Welcome ! in bold text

//route to render index 
app.get('/index', (req, res) => {
  res.render('index'); //render index
});

//route to render about
app.get('/about', (req, res) => {
  res.render('pages/about'); //render about
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
