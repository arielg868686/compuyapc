require('dotenv').config();
const DiscordBot = require('./discord');

// Iniciar el bot de Discord
const bot = new DiscordBot(process.env.DISCORD_BOT_TOKEN);
bot.start(); 