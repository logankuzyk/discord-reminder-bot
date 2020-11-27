const Command = require("../command");

const remind = new Command(
  ["courseName", "date", "time"],
  async (givenParams) => {
    givenParams.time = new Date(givenParams.time);
    task = {
      executeDate: givenParams.time.getTime(),
      courseName: givenParams.courseName,
      taskType: "reminder",
      isActive: 1,
      score: 1,
    };
    body = `Reminder added! I will send you a PM with ${
      givenParams.courseName
    }'s due dates on ${givenParams.time.toString()}`;
    return {
      embed: { title: "Success!", description: body },
      complete: true,
      givenParams: JSON.stringify(givenParams),
      task: task,
    };
  },
  "New Reminder",
  "Get a DM with a course's due dates sent to you at a specific time.",
  "remind"
);

module.exports = remind;
