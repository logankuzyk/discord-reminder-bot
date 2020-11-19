const Command = require("../command");

const cancel = new Command();

cancel.about = "Cancel your ongoing command.";
cancel.help = "";
cancel.params = [];

cancel.execute = async (user, tokens) => {
  console.log("Cancelling");
  let output = { complete: true };
  if (tokens.indexOf("cancel") >= 0) {
    output.embed = { title: "Command Canceled" };
  }
  return output;
};

module.exports = cancel;
