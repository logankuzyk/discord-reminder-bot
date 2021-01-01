const Command = require("../command");
const fs = require("fs");

const help = new Command(
  [],
  async (givenParams) => {
    let body = "```";
    let files = fs
      .readdirSync(__dirname)
      .filter((file) => file.endsWith(".js"));
    for (let file of files) {
      let command = file.substring(0, file.indexOf("."));
      try {
        let module = require(`${__dirname}/${command}`);
        if (module) body += `\n\$${command}: ${module.about}`;
      } catch (err) {
        console.log(err);
        continue;
      }
    }
    if (body != "```") {
      body += "```";
    }
    return {
      embed: { title: "Assignment Reminder's Commands", description: body },
      complete: true,
    };
  },
  undefined,
  "List available commands.",
  "help"
);

help.about = "List available commands.";
help.params = [];

module.exports = help;
