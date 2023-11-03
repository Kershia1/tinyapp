const user = {
  "Michelle_Flowers": {
    userName: "Michelle_Flowers",
    email: "Michelle_Flowers@example.com",
    password: 789
  },
  "Danny_Trejo": {
    userName: "Danny_Trejo",
    email: "Danny_Trejo@example.com",
    password: 456
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString(length) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";

  for (let i = 0; i < length; i++) {
    const randoString = Math.floor(Math.random() * characters.length);
    randomString += characters[randoString];
  }
  return randomString;
}

const randomString = generateRandomString(6);

module.exports = { urlDatabase, user, users, generateRandomString};