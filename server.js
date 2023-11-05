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
  const templateVars = {
    users: undefined
  };
res.render('urls_login', templateVars);
});

//Set cookie for login 
app.post('/urls_login', (req, res) => {
  // const user_ID = req.body.id; //If both checks pass, set the user_id cookie with the matching user's random ID, then redirect to /urls.
  const user_Email = req.body.email; 
  const password = req.body.password;

  console.log('User Email:', user_Email);
  console.log('Password:', password);

  let userMatch = false; 
  // test if this account exists 
  let userId; //create a liminal space to store info

  //still using my e-mail at the filter to compar with
  //remeber working with in the users obj therefore need to use id not ID to access key and return the values I am iterating for 
  for (const id in users) {
    let user = users[id];
    if (user.email === user_Email) {
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
  if(!userMatch) {
    return res.status(403).send('<p>An incorrect email or password has been entered. Please try again.</p>')
  }
  res.cookie('user_id', userId);
  //set the user_id cookie with the matching user's random ID, then redirect to /urls.
  res.redirect('/urls');
});

//req.session.user_ID = user_ID; instead of cookies
//Sign-out user when the Sign-out button is selected
app.post('/logout', (req, res) => {
  res.clearCookie('user_Email');
  res.redirect('/urls');
});

//Delete User Cookie
app.get('/logout', (req, res) => {
  res.clearCookie('user_Email'); // DELETE A COOKIE BY KEY
  res.redirect('/urls'); //status(200).end('<p>Cookie is deleted!</p>');
});
//look at session option for logging out the user


//Display User Name in header 
app.get("/urls", (req, res) => {
  const user_Email = req.cookies.user_Email; // need to request the cookies here 
  const templateVars = {
    urls: urlDatabase,
    user_Email: user_Email // do not request here in object
  };
  console.log('Logged in as:', user_Email);
  res.render("urls_index", templateVars);
});

// Render Registration Page
//always remeber the status of the user no account, registered, and logged in ...
app.get('/register', (req, res) => {
  const templateVars = {
    user_Email: undefined
  };
  res.render('urls_register', templateVars);
});

//Duy's Happy Path intigrated in with my not happy path.
// POST /register
app.post('/register', (req, res) => {
  // pull the info off the body object
  const user_Email = req.body.email; // email paras
  const password = req.body.password;// password paras

  // did we NOT receive an email and/or password
  if (!user_Email || !password) {
    return res.status(400).send('Both e-mail and a password must be provided to successfully register.');
  }

  // look through existing users to see if one already has the email provided
  let registeredUser = null;

  for (const userId in users) {
    const user = users[userId];
    if (user.email === user_Email) {
      // we found a duplicate email
      registeredUser = user;
    }
  }

  // did we find an existing user with that email?
  if (registeredUser) {
    return res.status(400).send('a user with that email already exists');
  }

  // happy path! we can create the new user object
  const user_ID = generateRandomString(8); //create random user name 8 of 8
  const newUser = {
    id: user_ID,
    email: user_Email,
    // password: bcrypt.hashSync(password, 10)
  };

  // add the new user to the users object
  users[user_ID] = newUser;
  console.log(users); //error handeling
  res.cookie('user_ID', user_ID);
  res.redirect('/urls');// my endpoint back to urls
  // redirect to the login page
  // res.redirect('/login');
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
  const user_Email = req.cookies.user_Email;
  const templateVars = {
    user_Email: user_Email
  };
  res.render("urls_new", templateVars);
});

//render the 'urls_show' page to display a specific URL
app.get("/urls/:id", (req, res) => {
  const user_Email = req.cookies.user_Email;
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user_ID: req.session.user_ID,
    user_Email: user_Email
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
  const user_Email = req.cookies.user_Email;
  const templateVars = { 
    urls: urlDatabase,
    user_Email: user_Email
   };
  res.render("urls_index", templateVars); //render in urls_index.ejs
});

//route to render index 
app.get('/index', (req, res) => {
  res.render('index');
});

//route to render about
app.get('/about', (req, res) => {
  const user_Email = req.cookies.user_Email;
  const templateVars = {
    user_Email: user_Email
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
