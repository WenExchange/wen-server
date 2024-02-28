
require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const token = process.env.TELEGRAM_BOT_TOKEN;
const telegramClient = new TelegramBot(token, { polling: false });

module.exports = {
  telegramClient
};
