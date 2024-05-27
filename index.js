const express = require("express");
const winston = require("winston");
const app = express();
require('dotenv').config();
require("./config/logging")();
require("./bot/bot");
app.listen(process.env.PORT, () => winston.info("bot is running"));