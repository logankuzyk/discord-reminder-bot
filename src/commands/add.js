const Command = require("../command");

const add = new Command(
  ["courseName", "date", "time", "memo"],
  async (givenParams) => {
    givenParams.time = new Date(givenParams.time);
    task = {
      executeDate: givenParams.time.getTime(),
      courseName: givenParams.courseName,
      taskType: "assignment",
      isActive: "TRUE",
      score: 1,
      memo: givenParams.memo,
    };
    body = `Due date added! ${
      givenParams.memo
    } is due on ${givenParams.time.toString()} for ${givenParams.courseName}.`;
    return {
      embed: { title: "Success!", description: body }, // TODO update embed title on completion.
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
