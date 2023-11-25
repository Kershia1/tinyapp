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


//LOGIN
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

app.post('/urls_login', (req, res) => {
  const {userEmail, userPassword } = req.body;
  const user = findUserByEmail(userEmail); // find user by email

  if (!user) {
      return res.status(400).send('We could not find a user with that email address.');
  }

  bcrypt.compare(userPassword, user.password, (err, result) => {
    if (err) {
        return res
        .status(500)
        .send('An error occurred while comparing passwords.');
    }

      if (!result) { // if the result is false
          return res
          .status(400)
          .send('You have entered an incorrect password.');
      }
          req.session.userId = user.id;
          res.redirect('/urls');
      // } else {
      //     return res.status(400).send('You have entered an incorrect email or password.');
    });
});

// app.post('/urls_login', (req, res) => {
//   console.log('reqbody data:', req.body);

//   const userEmail = req.body.userEmail;
//   const password = req.body.userPassword;

//   console.log('User Email:', userEmail);
//   console.log('Password:', password);

//   console.log("entering first conditional");
//   if (!userEmail || !password) {
//     return res.status(400).send('<p> You have entered an incorrect email or password.</p>')
//   }

//   console.log("findUserByEmail");
//   const user = findUserByEmail(userEmail);

//   console.log("beginning bcrypt");

//   bcrypt.compare(password, user.password)
//     .then((result) => {
//       console.log("in bcrypt");
//       if (result) {
//         req.session.userId = user.id;
//         res.redirect('/urls');
//       } else {
//         return res
//         .status(400)
//         .send('<p> You have entered an incorrect email or password.</p>');
//       }
//     })
//     .catch((error) => {
//       console.log(error);
//       return res.status(500).send('<p> An error occurred while comparing passwords.</p>');
//     });
//     console.log("exiting");
// });


//LOGOUT
/////////////////////////////////////////////////

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

//REGISTRATION
/////////////////////////////////////////////////

// Render Registration Page
app.get('/register', (req, res) => {
  if (req.session.userId) {
    res.redirect('/urls');
  } else {
    const templateVars = {
      user: users[req.session.userId],
      // userEmail: undefined
    };
    res.render('urls_register', templateVars);
  }
});

// POST /register
app.post('/register', (req, res) => {
  // pull the info off the body object
  const userID = generateRandomString(8);
  const userEmail = req.body.userEmail;
  const password = req.body.userPassword;

  // did we NOT receive an email and/or password or they allready are there
  if (!userEmail || !password || emailExists(userEmail, users)) {
    return res.status(400).send('An incorrect e-mail or password has been entered.');
  }
  // removed additional code already checking in the above statement
const hashedPassword = bcrypt.hashSync(password, 10);
  users[userID] = {
    id: userID,
    email: userEmail,
    password: hashedPassword
  };
  res.redirect('/urls');
});

//URL HANDELING
/////////////////////////////////////////////////


//URLS
/////////////////////////////////////////////////

app.get("/urls", (req, res) => {
  const userID = req.session.userId;

  if (!userID) {
    res.status(401).send('Login required');
  } else {
    const userEmail = req.session.userEmail;
    const userURLS = userSpecificURLS(userID, urlDatabase);
    const user = findUserByID(userID, users);
    const templateVars = {
      urls: userURLS,
      user: users[userID]
    };
    console.log('Logged in as:', userEmail);
    return res.render("urls_index", templateVars);
  };
});

//Handler for post req to create a new shortURL, then add to database
app.post('/urls', (req, res) => {
  if (req.session.userId) {
    const shortURL = generateRandomString(6);
    // const longURL = req.body.longURL;
    const userID = req.session.userId;

    if (findUserByID(userID, users)) {
      urlDatabase[shortURL] = {
        //add these keys and values to the new nested database
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


//delets selected URL from table of URLS
app.post('/urls/:id/delete', (req, res) => {
  const userID = req.session.userId;
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
const userID = req.session.userId;
const user = findUserByID(userID, users);

  if ( user === null) {
    return res.redirect('/login');
  } else {
    const templateVars = {
      urls: urlDatabase,
      user: users[userID]
  }
  console.log('logged in:', userEmail);
  res.render('urls_new', templateVars);
  }
});

//retrive user specific urls from the datatbase
app.get('/urls/:id', (req, res) => {
  const userID = req.session.userId; // need the id to match in everything 
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

//render urls index page to display all urls in database
//iterate over all URLs in the urlDatabase and filter them based on the user.
app.get('/urls', (req, res) => {
  const userID = req.session.userId;
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

//route to render landing page
// app.get('/', (req, res) => {
//   if(req.session.userId) {
//     res.redirect('/urls');
//   } else {
//     res.redirect('/login');
//   }
// });
// sends a response with the url database sent as a json file 
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Listener
/////////////////////////////////////////////////
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
