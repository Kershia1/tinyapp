//Users 
/////////////////
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

// new database to implement better access control 
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

function generateRandomString(length) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";

  for (let i = 0; i < length; i++) {
    const randoString = Math.floor(Math.random() * characters.length);
    randomString += characters[randoString];
  }
  return randomString;
};

const randomString = generateRandomString(6);

function userSpecificURLS(id) {
  const usersURLS = {};
  for (const shortURL in urlDatabase) {
    //if the user id value matches the url key true 
    if (urlDatabase[shortURL].userID === id) {
      usersURLS[shortURL] = urlDatabase[shortURL];
      //moving out of nested obj to 1 level up
    }
  }
  return usersURLS;
};

//findUserByEmail
////////////////////
const findUserEmail = (email) => {
  for (const userId in users) {
    const user = users[userId];
    if (email === user.Email) {
      return user;
    }
  }
  return null;
};


//findUserByID
////////////////////
//check to see if user exists in database by id key
const findUserByID = (id) => {
  const user = users[id];
  if (user) {
    return user;
  }
  return null;
};

//emailExists
////////////////////
//check to see if e-mail exists by checking users database email key
const emailExists = (emailProvided) => {
  for (const user in users) {
    if (emailProvided === users[user].email) {
      return true;
    }
  }
};

module.exports = { emailExists, findUserByID, findUserEmail, generateRandomString, urlDatabase, userSpecificURLS, users };