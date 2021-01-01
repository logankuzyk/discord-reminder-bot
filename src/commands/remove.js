const Command = require("../command");

const remove = new Command(
  [],
  async (givenParams) => {
    let output = {
      title: "Remove",
      description:
        "If you need to remove a due date or reminder, please PM <@237783055698231298>",
    };
    return {
      embed: output,
      complete: true,
    };
  },
  undefined,
  "Get instructions on how to remove a due date or reminder.",
  "remove"
);

module.exports = remove;
