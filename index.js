const Discord = require("discord.js");
const fs = require("fs");
const dotenv = require("dotenv").config();
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
    module.exports.commands = commands;
    bot.commands = commands;
    // console.log(module.exports);
    const storage = new Storage();
    const schedule = new Schedule();
    storage.tasks.then(schedule.addJob);
    let channels = bot.channels.cache.filter(
      (channel) =>
        channel.type == "text" &&
        channel.name.match(/^([a-z]{3,4})-([0-9]{2})\w$/g)
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
    !msg.channel.name.match(/^([a-z]{3,4})-([0-9]{2})\w$/g) &&
    msg.channel.name != "bot-commands"
  ) {
    console.log("Summoned in non-class channel");
    msg.reply("This channel doesn't correspond with a class.");
    return;
  }
  console.log(`Command received: ${msg.content}`);
  let {
    groups: { command, input },
  } = /^\$(?<command>\w+)( )*(?<input>(.+) *)*$/g.exec(msg.content);
  try {
    console.log(bot.commands);
    bot.commands
      .get(command)
      .execute({ bot: bot, msg: msg, input: input })
      .catch((err) => {
        console.log(err);
        msg.reply(`Something went wrong. \`\`${err}\`\``);
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
  let channel = guild.channels.cache.find(
    (channel) => channel.name == "bot-commands" && channel.type == "text"
  );
  if (channel) {
    channel.send(
      "I'm here to keep track of your assignments! To get started, type ``$help``!"
    );
  }
});

bot.on("messageReactionAdd", async (reaction, user) => {
  try {
    await reaction.fetch();
  } catch (err) {
    console.log(`Something went wrong getting the message: ${err}`);
    return;
  }
  if (reaction.emoji.name == "👍") {
    sheets.spreadsheets.values
      .get({
        spreadsheetId: process.env.SHEET_ID,
        range: "A2:G",
      })
      .then(async (res) => {
        let cols = res.data.values;
        let target = cols.filter((cell) => cell[0] == reaction.message.id)[0];
        if (!target) {
          return;
        }
        let score = Number(target[6]);
        if (score < 3) {
          score++;
        }
        let index = cols.indexOf(target);
        let cell = `Sheet1!F${index + 2}:G${index + 2}`;
        sheets.spreadsheets.values
          .update({
            spreadsheetId: process.env.SHEET_ID,
            range: cell,
            valueInputOption: "RAW",
            resource: {
              values: [[1, score]],
            },
          })
          .then(console.log(`Upvoted ${target[0]}`));
      });
  } else if (reaction.emoji.name == "👎") {
    sheets.spreadsheets.values
      .get({
        spreadsheetId: process.env.SHEET_ID,
        range: "A2:G",
      })
      .then(async (res) => {
        let cols = res.data.values;
        let target = cols.filter((cell) => cell[0] == reaction.message.id)[0];
        if (!target) {
          return;
        }
        let score = Number(target[6]);
        if (score > -3) {
          score--;
        }
        let index = cols.indexOf(target);
        let cell = `Sheet1!F${index + 2}:G${index + 2}`;
        sheets.spreadsheets.values
          .update({
            spreadsheetId: process.env.SHEET_ID,
            range: cell,
            valueInputOption: "RAW",
            resource: {
              values: [[1, score]],
            },
          })
          .then(console.log(`Downvoted ${target[0]}`));
      });
  }
});

bot.login(process.env.TOKEN);
