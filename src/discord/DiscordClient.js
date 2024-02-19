const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

let discordClient = new Client({
  intents: [],
});

discordClient.once("ready", (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}!`);
});

discordClient.login(process.env.DISCORD_BOT_TOKEN);

module.exports = {
  discordClient,
};
