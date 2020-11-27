const Command = require("../command");

const cancel = new Command(
  [],
  async (givenParams) => {
    console.log("Cancelling");
    return {
      complete: true,
      embed: { title: "Command Canceled" },
    };
  },
  undefined,
  "Cancel the ongoing command",
  "cancel"
);

module.exports = cancel;
