const Discord = require("discord.js");
const fs = require("fs");
const dotenv = require("dotenv").config();

const bot = new Discord.Client();

bot.on("ready", () => {
  bot.commands = new Discord.Collection();
  let files = fs
    .readdirSync("./commands/")
    .filter((file) => file.endsWith(".js"));
  for (let file of files) {
    let command = file.substring(0, file.indexOf("."));
    let module = require(`./commands/${command}`);
    bot.commands.set(file.substring(0, file.indexOf(".")), module);
    console.log(`Loaded ${file}`);
  }
  console.log("Bot ready");
});

bot.on("message", async (msg) => {
  if (
    !msg.content.startsWith("$") ||
    msg.author.bot ||
    msg.content.length == 1
  ) {
    return;
  } else if (!msg.channel.name.match(/^([a-z]{3,4})-([0-9]{2})\w$/g)) {
    console.log("Summoned in non-class channel");
    msg.reply("This channel doesn't correspond with a class.");
  }
  console.log("Command received");
  let {
    groups: { command, input },
  } = /^\$(?<command>\w+)( )*(?<input>(.+) *)*$/g.exec(msg.content);

  try {
    bot.commands.get(command).execute(msg, input);
  } catch (err) {
    if (err.name == "TypeError") {
      console.log("Not a recognized command");
      msg.reply(
        "That isn't a recognized command, type $help for a list of commands."
      );
      msg.react("😂");
    }
  }
});

bot.login(process.env.TOKEN);
