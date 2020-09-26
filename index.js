const Discord = require('discord.js')
const dotenv = require('dotenv').config()

const bot = new Discord.Client()



bot.login(process.env.TOKEN)