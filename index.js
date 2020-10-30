const Discord = require("discord.js");
const fs = require("fs");
const dotenv = require("dotenv").config();
const regex = require("./bin/regex");
const Storage = require("./bin/storage");
const Schedule = require("./bin/schedule");

const bot = new Discord.Client();

bot.on("ready", () => {
  new Promise((resolve, reject) => {
    try {
      let commands = new Map();
      let files = fs
        .readdirSync("./bin/commands/")
        .filter((file) => file.endsWith(".js"));
      for (let file of files) {
        let command = file.substring(0, file.indexOf("."));
        let module = require(`./bin/commands/${command}`);
        commands.set(file.substring(0, file.indexOf(".")), module);
        console.log(`Loaded ${file}`);
      }
      resolve(commands);
    } catch (err) {
      reject(err);
    }
  }).then((commands) => {
    // Export commands after loading.
    module.exports.commands = commands;
    bot.commands = commands;
    const storage = new Storage();
    const schedule = new Schedule();
    storage.tasks.then(schedule.addJob);
    let channels = bot.channels.cache.filter(
      (channel) =>
        channel.type == "text" && channel.name.match(regex.get("course"))
    );
    for (let channel of channels) {
      schedule.addJob({
        courseName: channel[1].id,
      });
    }
  });
});

bot.on("message", async (msg) => {
  if (
    !msg.content.startsWith("$") ||
    msg.author.bot ||
    msg.channel.type == "dm" ||
    msg.content.length == 1
  ) {
    return;
  } else if (
    !msg.channel.name.match(regex.get("course")) &&
    msg.channel.name != "bot-commands"
  ) {
    console.log("Summoned in non-class channel");
    msg.reply("This channel doesn't correspond with a class.");
    return;
  }
  console.log(`Command received: ${msg.content}`);
  let {
    groups: { command, input },
  } = regex.get("command").exec(msg.content);
  console.log(command);
  console.log(input);
  try {
    console.log(bot.commands);
    bot.commands
      .get(command)
      .execute(input)
      .catch((err) => {
        throw new Error(err); // This error does not get caught by the catch statement below.
      });
  } catch (err) {
    if (err.name == "TypeError") {
      console.log("Not a recognized command");
      console.log(err);
      msg.reply(
        `That isn't a recognized command, type \`\`$help\`\` for a list of available commands.`
      );
      msg.react("😂");
    } else {
      console.log(err);
      msg.reply(`Something went wrong. \`\`${err}\`\``);
    }
  }
});

bot.on("guildCreate", async (guild) => {
  // Sends greeting to bot-commands text channel on joining.
  let channel = guild.channels.cache.find(
    (channel) => channel.name == "bot-commands" && channel.type == "text"
  );
  if (channel) {
    channel.send(
      "I'm here to keep track of your assignments! To get started, type ``$help``!"
    );
  }
});

bot.login(process.env.TOKEN);
