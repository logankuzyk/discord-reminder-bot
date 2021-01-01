const Command = require("../command");

const about = new Command(
  [],
  async (givenParams) => {
    let output = {
      title: "About",
      description:
        "Developed by C1RRU5 using primarily Node.js and Discord.js.\nCheck out the source code on Github at https://github.com/logankuzyk/discord-reminder-bot. Stars make me happy.",
    };
    return {
      embed: output,
      complete: true,
    };
  },
  undefined,
  "Find out more about Assignment Reminder and its author.",
  "about"
);

module.exports = about;
