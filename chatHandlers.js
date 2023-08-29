// chatHandlers.js
// const db = require("./dataBase");
// const admin = require("./utils/notifcations");

async function handleHeartbeat(socket) {
  console.log("hello from the heart beat");
  // Handle heartbeat logic
}

async function handleConnectUser(socket, userId) {
  // Handle user connection logic
}

async function handleChatMessage(socket, body) {
  // Handle sending and receiving chat messages
}

function handleDisconnect(socket, userSocketMap, socketUserMap) {
  // Handle user disconnection logic
}

module.exports = {
  handleHeartbeat,
  handleConnectUser,
  handleChatMessage,
  handleDisconnect,
};
