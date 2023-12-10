// Description: Helper functions for TinyApp

//generateRandomString
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

//userSpecificURLS
function userSpecificURLS(id, urlDatabase) {
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

//findUserByID
const findUserByID = (id, users) => {
  const user = users[id];
  if (user) {
    return user;
  }
  return null;
};

//foundUser

//emailExists
const emailExists = (emailProvided, users) => {
  for (const user in users) {
    if (emailProvided === users[user].email) {
      return true;
    }
  }
};

//getUserByEmail
//saving to try re-implementing with login handler
////////////////////
const getUserByEmail = (email, users) => {
  for (const userId in users) {
    const user = users[userId];
    if (email === user.email) {
      return user;
    }
  }
  return null;
};
module.exports = {
   emailExists,
   findUserByID,
   generateRandomString,
   userSpecificURLS
  };