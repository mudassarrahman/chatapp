// socketLogic.js
const http = require("http");
const socketIO = require("socket.io");
const app = require("./app");
const chatHandlers = require("./chatHandlers");

const server = http.createServer(app);
const io = socketIO(server);

let userSocketMap = new Map();
let socketUserMap = new Map();
let unreadMessages = [];

io.on("connection", (socket) => {
  chatHandlers.handleHeartbeat(socket);

  socket.on("connectUser", (userId) => {
    chatHandlers.handleConnectUser(socket, userId);
  });

  socket.on("chatMessage", (body) => {
    chatHandlers.handleChatMessage(socket, body);
  });

  socket.on("disconnect", () => {
    chatHandlers.handleDisconnect(socket, userSocketMap, socketUserMap);
  });
});

const port = process.env.PORT || 3002;
server.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
