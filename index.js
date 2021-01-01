const Discord = require("discord.js");
const fs = require("fs");
const dotenv = require("dotenv").config();
const regex = require("./src/regex");
const Storage = require("./src/storage");
const Schedule = require("./src/schedule");
const blocked = require("blocked-at");
// const { storage } = require("googleapis/build/src/apis/storage");

const bot = new Discord.Client();

bot.on("ready", () => {
  new Promise((resolve, reject) => {
    try {
      let commands = new Map();
      let files = fs
        .readdirSync("./src/commands/")
        .filter((file) => file.endsWith(".js"));
      for (let file of files) {
        let command = file.substring(0, file.indexOf("."));
        let module = require(`./src/commands/${command}`);
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
    bot.storage = storage;
    bot.schedule = schedule;
    module.exports.storage = bot.storage;
    module.exports.channels = bot.channels;
    bot.storage.refresh();
    bot.storage.getAllTasks().then(schedule.addCourseReminder); // Calls $upcoming 4 hours before each course's due dates.
    bot.storage.getAllUsers().then((users) => {
      users.forEach((user) => {
        bot.storage.resetUser(user.userId);
      });
    });
    // This adds a nightly reminder for all course channels. Probably won't use this.
    // let channels = bot.channels.cache.filter(
    //   (channel) =>
    //     channel.type == "text" && channel.name.match(regex.get("course"))
    // );
    // for (let channel of channels) {
    //   schedule.addCourseReminder({
    //     courseName: channel[1].id,
    //   });
    // }
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
    msg.reply(
      "This channel doesn't correspond with a course. Use the course channel or #bot-commands"
    );
    return;
  }
  msg.channel.startTyping();
  console.log(`Command received: ${msg.content}`);
  let user = await bot.storage.getUser(msg.author.id);
  let command = new Promise((resolve, reject) => {
    if (msg.content.indexOf("$cancel") >= 0) {
      reject("cancel");
    }
    if (user) {
      if (user.ongoingCommand != "null") {
        console.log("Ongoing command");
        resolve(user.ongoingCommand);
      } else if (regex.get("command").exec(msg.content) != null) {
        if (
          bot.commands.has(
            regex.get("command").exec(msg.content).groups.command
          )
        ) {
          console.log("Cached user, running new command");
          resolve(regex.get("command").exec(msg.content).groups.command);
        } else {
          reject();
        }
      } else {
        reject();
      }
    } else if (regex.get("command").exec(msg.content) != null) {
      if (
        bot.commands.has(regex.get("command").exec(msg.content).groups.command)
      ) {
        console.log("New user, running command");
        resolve(regex.get("command").exec(msg.content).groups.command);
      } else {
        reject();
      }
    } else {
      reject();
    }
  }).catch((err) => {
    let embed;
    if (err != "cancel") {
      console.log("Not a recognized command");
      embed = new Discord.MessageEmbed({
        title: "Oops!",
        color: "ffc83d",
        description: `That command isn't recognized. Try \`\`$help\`\` if you're stuck.`,
      });
    } else {
      bot.storage.resetUser(msg.author.id);
      embed = new Discord.MessageEmbed({
        title: "Command Canceled",
        color: "ffc83d",
      });
    }
    msg.channel.send(embed);
    return "cancel";
  });
  let tokens = [];
  let word;
  while ((word = regex.get("token").exec(msg.content)) !== null) {
    tokens.push(word.groups.token);
  }
  tokens.unshift(msg.channel.name);
  if (user) {
    if (user.nextParam != "memo") {
      tokens.splice(2, tokens.length - 2);
    }
  } else {
    tokens.splice(2, tokens.length - 2);
    // This deletes any extra words from the command call.
    // As of right now, all commands only require one token (other than courseName) to be run.
    // Yes this is a security feature.
  }
  console.log(`Command: ${await command}`);
  console.log(`Tokens: ${tokens}`);
  try {
    if ((await command) == "cancel") {
      msg.channel.stopTyping();
      return; // I hate this.
    }
    let context = await bot.commands.get(await command).execute(user, tokens);
    if (context.embed) {
      let output = new Discord.MessageEmbed(context.embed);
      output.setColor("ffc83d");
      msg.channel.send(output).then(() => {
        console.log("Replied with embed");
      });
    }
    if (!context.complete) {
      bot.storage.addUser(
        msg.author.id,
        msg.author.username,
        await command,
        context.givenParams,
        context.nextParam,
        context.remainingParams
      );
    } else if (context.task) {
      let task = context.task;
      task.taskId = msg.id;
      // Didn't need to make this a promise, but I did.
      task.channelId = await new Promise((resolve, reject) => {
        if (task.taskType == "assignment") {
          resolve(msg.channel.id);
        } else if (task.taskType == "reminder") {
          msg.author.createDM().then((dmChannel) => {
            console.log(dmChannel);
            resolve(dmChannel.id);
          });
        }
      });
      task.authorId = msg.author.id;
      bot.schedule.addCourseReminder(task);
      bot.storage.addTask(task);
      bot.storage.resetUser(msg.author.id);
    } else if (context.complete) {
      bot.storage.resetUser(msg.author.id);
    }
  } catch (err) {
    bot.storage.resetUser(msg.author.id);
    console.log(err);
    msg.reply(
      `Something went wrong. Pinging <@237783055698231298>.\n\`\`${err}\`\``
    );
    msg.channel.stopTyping();
  }
  msg.channel.stopTyping();
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

blocked((time, stack) => {
  console.log(`Blocked for ${time}ms, operation started here:`, stack);
});

bot.login(process.env.TOKEN);
