const fs = require("fs");

module.exports.about = "List available commands.";

module.exports.execute = async (msg) => {
  let output = "";
  let files = fs.readdirSync(__dirname).filter((file) => file.endsWith(".js"));
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
    msg.reply(output);
  }
};
