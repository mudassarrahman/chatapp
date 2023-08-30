const dotenv = require("dotenv");
const app = require("./app");
// const pool = require("./dataBase");
// const { Pool } = require("./dataBase");
const createDatabaseTables = require("./models/createTables");
dotenv.config({ path: "./config.env" });
const admin = require("./utils/notifcations");

const http = require("http");
const socketIO = require("socket.io");
const pool = require("./dataBase");
const AppError = require("./utils/appError");
const { user } = require("firebase-functions/v1/auth");

// createDatabaseTables();

const server = http.createServer(app);
const io = socketIO(server);

let userSocketMap = new Map();
let socketUserMap = new Map();
let unreadMessages = [];

io.on("connection", (socket) => {
  // Handle socket connections here

  let lastHeartbeat = Date.now().toString();

  // Handle heartbeat message from client
  socket.on("heartbeat", () => {
    lastHeartbeat = Date.now();
    //console.log("heartbeat", socket.id, lastHeartbeat);
    socket.emit("heartbeat"); // Respond back to the client
  });

  // socket.on("connectUser", (userId) => {
  //   console.log(userId, "connect usersss");

  //   // Check if the user already exists in the map
  //   if (userSocketMap.has(userId)) {
  //     const socketIds = userSocketMap.get(userId.userId);
  //     socketIds.push(socket.id);
  //     userSocketMap.set(userId.userId, socketIds);
  //   } else {
  //     // New user, add to the map
  //     userSocketMap.set(userId.userId, [socket.id]);
  //   }

  //   socketUserMap.set(socket.id, userId.userId);

  //   console.log(userSocketMap);
  //   console.log(socketUserMap);
  // });

  socket.on("connectUser", async (userId) => {
    console.log(userId);
    const _selectQuery = `
    SELECT * FROM messages
    WHERE receiver_id = ? AND is_read =?
  `;
    [unreadMessages] = await db.query(_selectQuery, [userId.userId, 0]);
    //  console.log(unreadMessages)
    // if (unreadMessages && unreadMessages.length > 0) {
    //   io.to(socket.id).emit("unreadMessages", unreadMessages);
    // }
    if (userId.userType === "owner") {
      const selectQuery = `
  SELECT c.*, c.user_id, c.owner_id, c.salon_id, c.last_message, c.last_message_time, 
         u1.fullName AS user_name, s.name AS salon_name
  FROM chats c
  LEFT JOIN users u1 ON c.user_id = u1.id
  LEFT JOIN salons s ON c.salon_id = s.id
  WHERE c.owner_id = ?
  ORDER BY c.last_message_time DESC
`;

      const [chats] = await db.query(selectQuery, [userId.userId]);

      io.to(socket.id).emit("inbox", {
        chats,
      });
      console.log(chats, "cahts");
    } else {
      const selectQuery = `
    SELECT c.*, c.user_id, c.owner_id, c.salon_id, c.last_message, c.last_message_time, 
           u1.fullName AS user_name, s.name AS salon_name
    FROM chats c
    LEFT JOIN users u1 ON c.user_id = u1.id
    LEFT JOIN salons s ON c.salon_id = s.id
    WHERE c.user_id = ?
    ORDER BY c.last_message_time DESC
  `;

      const [chats] = await db.query(selectQuery, [userId.userId]);

      io.to(socket.id).emit("inbox", {
        chats,
      });
      console.log(chats, "cahts");
    }

    if (userId && userType) {
      const userKey = `${userId}-${userType}`;

      if (userSocketMap.has(userKey)) {
        const socketIds = userSocketMap.get(userKey);
        socketIds.push(socket.id);
        userSocketMap.set(userKey, socketIds);
      } else {
        userSocketMap.set(userKey, [socket.id]);
      }

      socketUserMap.set(socket.id, userKey);

      console.log(userSocketMap);
      console.log(socketUserMap);
    } else {
      console.log("Missing userId or userType");
    }
  });
  // Listen for chat messages
  socket.on("chatMessage", async (body) => {
    let chat_id = 0;
    console.log(body);
    console.log(body.data);

    const { senderId, receiverId, message, senderType, salonId, image } =
      body.data;

    // const receiverLoggedIn = isUserLoggedIn(receiverId);
    console.log(body.data);

    if (senderType == "salon") {
      const checkQuery = `SELECT id FROM chats WHERE user_id = ? AND owner_id = ? AND salon_id = ?`;
      const [[existingChat]] = await db.query(checkQuery, [
        receiverId,
        senderId,
        salonId,
      ]);

      console.log(existingChat);
      // chat_id = existingChat.id;
      // console.log(chat_id);
      if (existingChat) {
        chat_id = existingChat.id;
      } else {
        const query = `INSERT INTO chats (user_id, owner_id, salon_id) VALUES (?, ?, ?)`;
        const [result] = await db.query(query, [receiverId, senderId, salonId]);
        chat_id = result.insertId;

        //console.log(chat_id, result);
      }
    } else {
      const checkQuery = `SELECT id FROM chats WHERE user_id = ? AND owner_id = ? AND salon_id = ?`;
      // console.log(checkQuery);

      const [[existingChat]] = await db.query(checkQuery, [
        senderId,
        receiverId,
        salonId,
      ]);

      if (existingChat) {
        chat_id = existingChat.id;
      } else {
        const query = `INSERT INTO chats (user_id, owner_id, salon_id) VALUES (?, ?, ?)`;
        const [result] = await db.query(query, [senderId, receiverId, salonId]);
        chat_id = result.insertId;

        //console.log(chat_id, result);
      }
    }

    const updateQuery = `
    UPDATE chats
    SET last_message = ?, last_message_time = NOW()
    WHERE id = ?
  `;
    const [updateResult] = await db.query(updateQuery, [message, chat_id]);

    function getUserSockets(userId, userType) {
      const userKey = `${userId}-${userType}`;
      return userSocketMap.get(userKey) || [];
    }

    const userSockets = getUserSockets("user456", "regular");
    console.log(userSockets);

    // let senderSocketIds = new Set();
    // let receiverSocketIds = new Set();

    // for (const [userId, socketId] of userSocketMap.entries()) {
    //   if (String(userId) === String(senderId)) {
    //     senderSocketIds.add(...socketId);
    //   } else if (String(userId) === String(receiverId)) {
    //     receiverSocketIds.add(...socketId);
    //   }
    // }

    // connection.release()
    console.log(receiverSocketIds.size, "sizeeee");
    console.log(senderSocketIds.size, "sizeeee");
    console.log(senderSocketIds, "sendersocketids");
    console.log(receiverSocketIds, "receiversocketids");

    // console.log(receiverLoggedIn)

    let tokens = [];

    if (senderType == "salon") {
      [tokens] = await db.query(
        `
        SELECT fcmToken FROM fcmtokensusers WHERE user_id = ?
      `,
        [receiverId]
      );
    } else {
      [tokens] = await db.query(
        `
        SELECT fcmToken FROM fcmtokensowners WHERE owner_id = ?
      `,
        [receiverId]
      );
    }

    console.log(tokens, "tokens array");
    const tokenArray = tokens.map((token) => token.fcmToken);
    const messageOwner = {
      notification: {
        title: "New Message",
        body: message,
      },
      data: { title: "New Message", body: message },
    };
    const multicastMessage = {
      tokens: tokenArray,
      ...messageOwner,
    };

    admin
      .messaging()
      .sendMulticast(multicastMessage)
      .then((response) => {
        // console.log("Multicast notification sent successfully:", response);
      })
      .catch((error) => {
        // console.error("Error sending multicast notification:", error);
      });

    let messageId;

    if (receiverSocketIds.size < 1) {
      const insertQuery = `INSERT INTO messages (sender_id, receiver_id, message,is_read,sender_type,chat_id,image) VALUES (?,?, ?,?, ?,?,?)`;
      const [result] = await db.query(insertQuery, [
        senderId,
        receiverId,
        message,
        0,
        senderType,
        chat_id,
        image,
      ]);
      messageId = result.insertId;
    } else if (receiverSocketIds.size > 0 && receiverId) {
      const insertQuery = `INSERT INTO messages (sender_id, receiver_id, message,is_read,sender_type,chat_id,image) VALUES (?,?, ?,?,?, ?,?)`;
      const [result] = await db.query(insertQuery, [
        senderId,
        receiverId,
        message,
        1,
        senderType,
        chat_id,
        image,
      ]);
      messageId = result.insertId;
    }

    // Emit the message to the sender
    for (const senderSocketId of senderSocketIds) {
      console.log(senderSocketId, senderType, "senderhitt");

      if (senderType === "salon") {
        const selectQuery = `
        SELECT c.*, c.user_id, c.owner_id, c.salon_id, c.last_message, c.last_message_time,
               u1.fullName AS user_name, s.name AS salon_name
        FROM chats c
        LEFT JOIN users u1 ON c.user_id = u1.id
        LEFT JOIN salons s ON c.salon_id = s.id
        WHERE c.owner_id = ?
        ORDER BY c.last_message_time DESC
      `;
        console.log("senderIIIdddd", senderId);
        const [chats] = await db.query(selectQuery, [senderId]);

        io.to(senderSocketId).emit("inbox", {
          chats,
        });
        //console.log(chats, "cahts");
      } else {
        const selectQuery = `
          SELECT c.*, c.user_id, c.owner_id, c.salon_id, c.last_message, c.last_message_time,
                 u1.fullName AS user_name, s.name AS salon_name
          FROM chats c
          LEFT JOIN users u1 ON c.user_id = u1.id
          LEFT JOIN salons s ON c.salon_id = s.id
          WHERE c.user_id = ?
          ORDER BY c.last_message_time DESC
        `;
        console.log("senderIIIdddd", senderId);

        const [chats] = await db.query(selectQuery, [senderId]);

        io.to(senderSocketId).emit("inbox", {
          chats,
        });
        //console.log(chats, "cahts");
      }

      io.to(senderSocketId).emit("chatMessage", {
        previousMessages: unreadMessages,
        senderId,
        receiverId,
        message,
        messageId,
        senderType,
        salonId,
        chat_id,
        image,
        timestamp: new Date().toISOString(),
      });
    }

    // Emit the message to the receiver
    for (const receiverSocketId of receiverSocketIds) {
      console.log(receiverSocketId, senderType, "receiverhitt");

      if (senderType === "salon") {
        const selectQuery = `
    SELECT c.id, c.user_id, c.owner_id, c.salon_id, c.last_message, c.last_message_time, 
           u1.fullName AS user_name, s.name AS salon_name
    FROM chats c
    LEFT JOIN users u1 ON c.user_id = u1.id
    LEFT JOIN salons s ON c.salon_id = s.id
    WHERE c.user_id = ?
    ORDER BY c.last_message_time DESC
  `;
        console.log("receiveriiiddd", receiverId);

        const [chats] = await db.query(selectQuery, [receiverId]);

        io.to(receiverSocketId).emit("inbox", {
          chats,
        });
        //console.log(chats, "cahts");
      } else {
        const selectQuery = `
      SELECT c.id, c.user_id, c.owner_id, c.salon_id, c.last_message, c.last_message_time, 
             u1.fullName AS user_name, s.name AS salon_name
      FROM chats c
      LEFT JOIN users u1 ON c.user_id = u1.id
      LEFT JOIN salons s ON c.salon_id = s.id
      WHERE c.owner_id = ?
      ORDER BY c.last_message_time DESC
    `;
        console.log("receiveriiiddd", receiverId);

        const [chats] = await db.query(selectQuery, [receiverId]);

        io.to(receiverSocketId).emit("inbox", {
          chats,
        });
        //console.log(chats, "cahts");
      }

      console.log(receiverSocketId, "hitt");
      io.to(receiverSocketId).emit("chatMessage", {
        previousMessages: unreadMessages,
        senderId,
        receiverId,
        message,
        messageId,
        senderType,
        salonId,
        chat_id,
        image,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected");

    const userKey = socketUserMap.get(socket.id);

    if (userKey) {
      const socketIds = userSocketMap.get(userKey);
      const index = socketIds.indexOf(socket.id);

      if (index !== -1) {
        socketIds.splice(index, 1);

        if (socketIds.length === 0) {
          userSocketMap.delete(userKey);
        } else {
          userSocketMap.set(userKey, socketIds);
        }
      }

      socketUserMap.delete(socket.id);
    }

    console.log(userSocketMap);
    console.log(socketUserMap);
  });
});

// const userSocketMap = new Map();
// const socketUserMap = new Map();
// io.on("connection", (socket) => {
//   // Handle socket connections here
//   // console.log(socket, "user connected");
//   socket.on("connectUser", (userId) => {
//     console.log(userId);

//     if (userSocketMap.has(userId)) {
//       console.log(userId.userId, "inside object");
//       // User already exists, update the socket.id
//       const prevSocketId = userSocketMap.get(userId.userId);
//       socketUserMap.delete(prevSocketId);
//       userSocketMap.set(userId.userId, socket.id);
//     } else {
//       // New user, add to the map
//       userSocketMap.set(userId.userId, socket.id);
//     }

//     socketUserMap.set(socket.id, userId.userId);

//     console.log(userSocketMap);
//     console.log(socketUserMap);
//   });
//   // Listen for chat messages

//   socket.on("chatMessage", async (body) => {
//
//     let chat_id = 0;
//     console.log(body);
//     console.log(body.data);
//     const { senderId, receiverId, message, senderType } = body.data;
//     if (senderType == "salon") {
//       const checkQuery = `SELECT id FROM chats WHERE user_id = ? AND salon_id = ?`;
//       const [existingChat] = await db.query(checkQuery, [
//         receiverId,
//         senderId,
//       ]);
//       console.log(existingChat);
//       // chat_id = existingChat.id;
//       // console.log(chat_id);
//       if (existingChat && existingChat.length > 0) {
//         chat_id = existingChat[0].id;
//       } else {
//         const query = `INSERT INTO chats (user_id, salon_id) VALUES (?, ?)`;
//         const [result] = await db.query(query, [receiverId, senderId]);
//         chat_id = result.insertId;
//         console.log(chat_id, result);
//       }
//     } else {
//       const checkQuery = `SELECT id FROM chats WHERE user_id = ? AND salon_id = ?`;
//       // console.log(checkQuery);

//       const [existingChat] = await db.query(checkQuery, [
//         senderId,
//         receiverId,
//       ]);

//       if (existingChat && existingChat.length > 0) {
//         chat_id = existingChat[0].id;
//       } else {
//         const query = `INSERT INTO chats (user_id, salon_id) VALUES (?, ?)`;
//         const [result] = await db.query(query, [senderId, receiverId]);
//         chat_id = result.insertId;
//         console.log(chat_id, result);
//       }

//       if (existingChat.length === 0) {
//         // Create the chat conversation in the chats table
//         const query = `INSERT INTO chats (user_id, salon_id) VALUES (?, ?)`;
//         const [result] = await db.query(query, [senderId, receiverId]);
//         chat_id = result.insertId;
//         console.log(chat_id, result);
//       }
//     }

//     // console.log(senderId, receiverId, message, senderType);

//     const insertQuery = `INSERT INTO messages (sender_id, receiver_id, message,sender_type,chat_id) VALUES (?, ?,?, ?,?)`;
//     await db.query(insertQuery, [
//       senderId,
//       receiverId,
//       message,
//       senderType,
//       chat_id,
//     ]);

//     const selectQuery = `SELECT * FROM messages WHERE chat_id = ?`;
//     const [rows] = await db.query(selectQuery, [chat_id]);
//     // console.log(rows, "+++++++++++++++++++");

//     // Get the socket IDs of the sender and receiver
//     for (const [userId, socketId] of userSocketMap.entries()) {
//       console.log(userId, "userId");
//       if (userId === senderId) {
//         senderSocketId = socketId;
//       }
//     }

//     for (const [userId, socketId] of userSocketMap.entries()) {
//       console.log(userId, "userId");
//       if (userId === receiverId) {
//         receiverSocketId = socketId;
//       }
//     }

//     console.log(senderSocketId, "++++++++++++++++++");
//     console.log(receiverSocketId, "&&&&&&&&&&&&&&&");
//     console.log(userSocketMap);

//     // Emit the message to the sender
//     if (senderSocketId) {
//       io.to(senderSocketId).emit("chatMessage", {
//         previousMessages: rows,
//         senderId,
//         receiverId,
//         message,
//         senderType,
//       });
//     }

//     // Emit the message to the receiver
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit("chatMessage", {
//         previousMessages: rows,
//         senderId,
//         receiverId,
//         message,
//         senderType,
//       });
//     }

//     // socket.on("disconnect", () => {
//     //   const disconnectedUserId = socketUserMap.get(socket.id);

//     //   if (disconnectedUserId) {
//     //     userSocketMap.delete(disconnectedUserId);
//     //     socketUserMap.delete(socket.id);
//     //   }
//     // });
//   });
// });

const port = process.env.PORT || 3002;
server.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);

  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  console.log("👋 SIGTERM RECEIVED. Shutting down gracefully");
  server.close(() => {
    console.log("💥 Process terminated!");
  });
});
