const Command = require("../command");

const add = new Command(
  ["courseName", "date", "time", "memo"],
  async (givenParams) => {
    givenParams.time = new Date(givenParams.time);
    task = {
      executeDate: givenParams.time.getTime(),
      courseName: givenParams.courseName,
      taskType: "assignment",
      isActive: 1,
      score: 1,
      memo: givenParams.memo,
    };
    body = `Due date added! ${
      givenParams.memo
    } is due on ${givenParams.time.toString()} for ${givenParams.courseName}.`;
    return {
      embed: { title: "New Due Date", description: body },
      complete: true,
      givenParams: JSON.stringify(givenParams),
      task: task,
    };
  },
  "New Due Date",
  "Set a due date for a certain class for others to access through the bot.",
  "add"
);

module.exports = add;
