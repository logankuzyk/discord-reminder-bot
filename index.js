const Discord = require("discord.js");
const fs = require("fs");
const cron = require("cron");
const { google } = require("googleapis");
const dotenv = require("dotenv").config();

const bot = new Discord.Client();
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
google.options({
  auth: auth,
});
const sheets = google.sheets({
  version: "v4",
  credentials: auth,
});

bot.loadRange = (range) => {
  sheets.spreadsheets.values
    .get({
      spreadsheetId: process.env.SHEET_ID,
      range: range,
    })
    .then((res) => {
      if (!res.data.values) {
        return;
      }
      for (let row of res.data.values) {
        let date = new Date(Number(row[1]));
        if (row[4] == "reminder" && date.getTime() > Date.now()) {
          let user = bot.users.cache.get(row[3]);
          user.createDM().then((dmChannel) => {
            bot.addJob(date, bot.commands.get("upcoming").execute, {
              bot: bot,
              channel: dmChannel,
              course: row[2],
            });
          });
          console.log(`Added reminder on ${date.toString()}`);
        }
        console.log(`Added due date on ${date.toString()}`);
      }
    });
};

bot.addJob = (date, command, options) => {
  let job = new cron.CronJob(
    date,
    () => {
      command(options);
    },
    null,
    true,
    "America/Los_Angeles"
  );
  job.start();
};

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
  let channels = bot.channels.cache.filter(
    (channel) =>
      channel.type == "text" &&
      channel.name.match(/^([a-z]{3,4})-([0-9]{2})\w$/g)
  );
  for (let channel of channels) {
    bot.addJob("0 0 0 * * *", bot.commands.get("upcoming").execute, {
      bot: bot,
      channel: channel[1],
    });
  }
  bot.loadRange("A2:E");
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
    bot.commands.get(command).execute({ bot: bot, msg: msg, input: input });
    // .catch((err) => {
    //   if (err.name == "TypeError") {
    //     console.log("Not a recognized command");
    //     console.log(err);
    //     msg.reply(
    //       `That isn't a recognized command, type \`\`$help\`\` for a list of available commands.`
    //     );
    //     msg.react("😂");
    //   } else {
    //     console.log(err);
    //     msg.reply(`Something went wrong. \`\`${err}\`\``);
    //   }
    // });
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

// bot.on("messageReactionAdd", async (reaction, user) => {
//   try {
//     await reaction.fetch();
//   } catch (err) {
//     console.log(`Something went wrong getting the message: ${err}`);
//     return;
//   }
//   sheets.spreadsheets.values
//     .append({
//       spreadsheetId: process.env.SHEET_ID,
//       valueInputOption: "RAW",
//       insertDataOption: "INSERT_ROWS",
//       range: "A2:A",
//       resource: {
//         range: "A2:A",
//         values: [
//           [id, date.getTime(), course, msg.author.id, "assignment", 0, note],
//         ],
//       },
//     })
//     .then((res) => {

//     });
// });

bot.login(process.env.TOKEN);
