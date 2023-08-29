const express = require("express");
const morgan = require("morgan");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

// Start express app
const app = express();

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

module.exports = app;
