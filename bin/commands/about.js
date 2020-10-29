module.exports.about = "About the bot and author!";

module.exports.help = "Example command: ``$about``";

module.exports.execute = async ({ bot, msg }) => {
  msg.reply(
    "Store due dates and reminders for courses. \nDeveloped by C1RRU5. \nWant to have a closer look at the dumpster fire that stores all your important due dates? Check out https://github.com/logankuzyk/discord-reminder-bot"
  );
};
