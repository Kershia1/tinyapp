//no longer in use
////////////////
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

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

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


/* Create a function named urlsForUser(id) to return URLs where the userID is equal to the id of the currently logged-in user.*/
////////////////////

//same concept as register and login
//return user by email with id key from users database
// const findUserEmail = (email) => {
//   for (const userId in users) {
//     const user = users[userId];
//     if (email === user.Email) {
//       return user;
//     }
//   }
//   return undefined;
// };

// //check to see if user exists in database by id key
// const savedId = (id) => {
//   const user = users[id];
//   if (user) {
//     return user;
//   }
//   return undefined;
// };

// //check to see if e-mail exists by checking users database email key
// const savedEmail = (emailProvided) => {
//   for (const user in users) {
//     if(emailProvided === ?)
//   }
// }




module.exports = { urlDatabase, user, users, userSpecificURLS, generateRandomString };