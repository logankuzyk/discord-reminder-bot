const fs = require("fs");

module.exports.about = "List available commands.";

module.exports.help = "Example command: ``$help``";

module.exports.execute = async ({ bot, msg, input }) => {
  let output = "";
  let files = fs.readdirSync(__dirname).filter((file) => file.endsWith(".js"));
  if (input) {
    msg.reply(bot.commands.get(input).help);
    return;
  }
  for (let file of files) {
    let command = file.substring(0, file.indexOf("."));
    try {
      let module = require(`${__dirname}/${command}`);
      if (module) output += `\n \`\`\$${command}: ${module.about}\`\``;
    } catch (err) {
      console.log(err);
      continue;
    }
  }
  if (output) {
    output +=
      "\nFor more information about a command, type ``$help {command name}``.";
    msg.reply(output);
  }
};