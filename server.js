const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
//http://localhost:8080/urls/b2xVn2 works!
//http://localhost:8080/urls/new

app.post('/urls', (req, res) => {
  const shortURL = generateRandomString(6); // make random alphanumeric string.
  urlDatabase[shortURL] = req.body.longURL; //longURl to add to database
  res.redirect('/urls/${shortURL}'); //newly created shortURL page 
})

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  res.send("Ok"); // Respond with 'Ok' (we will replace this)
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { 
    id: req.params.id,
    longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.get("urlDatabase: id", (req, res) => {
  const templateVars = {
    id : req.params.id, 
    longURL : urlDatabase[req.params.id] };
    res.render("urls_index", templateVars);
});

app.get("/urls", (req, res) => { 
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars); //render in urls_index.ejs
}); 

app.get("/hello", (req, res) => {
  res.send("<html><body><b>Welcome !</b></body></html>\n");
}); // Welcome ! in bold text

// app.get("/", (req, res) => { // handler is on root path
//   res.send("Hello!");
// });

//route to /views/index.ejs 
app.get('/index', (req, res) => {
  res.render('index'); //render index
});

//route to /views/about.ejs 
app.get('about', (req, res) => {
  res.render('pages/about'); //render about
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
}); // JSON String => returns urlDatabase object at that point in time 

function generateRandomString(length) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";

  for(let i = 0; i < length; i++) {
    const randoString = Math.floor(Math.random() * characters.length);
    randomString += characters[randoString];
  }
  return randomString;
}

const randomString = generateRandomString(6);

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
