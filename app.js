const express = require("express");
const morgan = require("morgan");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

// Start express app
const app = express();

// Create the maps
let userSocketMap = new Map();
let socketUserMap = new Map();

// Function to save user data and socket ID
function saveUserSocket(userId, userType, socketId) {
  const userKey = `${userId}-${userType}`;

  // Save in userSocketMap
  if (userSocketMap.has(userKey)) {
    userSocketMap.get(userKey).push(socketId);
  } else {
    userSocketMap.set(userKey, [socketId]);
  }

  // Save in socketUserMap
  socketUserMap.set(socketId, { userId, userType });
  // console.log(userSocketMap);
  // console.log(socketUserMap);
}

// Function to retrieve all socket IDs for a user using user ID and type
function getUserSockets(userId, userType) {
  const userKey = `${userId}-${userType}`;
  return userSocketMap.get(userKey) || [];
}

// Function to retrieve user data using socket ID
function getUserBySocket(socketId) {
  return socketUserMap.get(socketId);
}

// Example usage
saveUserSocket("user123", "admin", "socket456");
saveUserSocket("user123", "admin", "socket789");
saveUserSocket("user456", "regular", "socket123");
saveUserSocket("user456", "regular", "socket124");
saveUserSocket("user456", "regular", "socket125");

const userSockets = getUserSockets("user456", "regular");
console.log(userSockets); // Output: ['socket456', 'socket789']

const userData = getUserBySocket("socket123");
console.log(userData); // Output: { userId: 'user456', userType: 'regular' }

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

module.exports = app;
