const user = {
  "Michelle_Flowers": {
    userName: "Michelle_Flowers",
    password: 789
  },
  "Danny_Trejo": {
    userName: "Danny_Trejo",
    password: 456
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

module.exports = { urlDatabase, user, generateRandomString};