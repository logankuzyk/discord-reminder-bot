module.exports.about = "About the bot and author!";

module.exports.help = "Example command: ``$about``";

module.exports.execute = async ({ bot, msg }) => {
  msg.reply(
    "Store due dates and reminders for courses. Developed by C1RRU5. https://github.com/logankuzyk/discord-reminder-bot"
  );
};
