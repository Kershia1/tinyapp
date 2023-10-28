const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
