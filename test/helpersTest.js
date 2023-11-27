const { assert } = require('chai');

const { getUserByEmail, generateRandomString } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert.strictEqual(user.id, expectedUserID);
  });

  it('should return null for non-valid email', function() {
    const actual = getUserByEmail("null-user@example.com", testUsers)
    const userEmail = null;
    assert.strictEqual(actual, userEmail);
  });

  it('should return false when comparing two generated random strings', function() {
    const actual = generateRandomString(6) === generateRandomString(6);
    const expected = false;
    assert.strictEqual(actual, expected);
  });
});