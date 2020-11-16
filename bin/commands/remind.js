const Command = require("../command");
const regex = require("../regex");
const prompts = require("../prompts");
const paramGetter = require("../paramGetter");

const remind = new Command();

remind.about = "Get reminded about a course's due dates at a certain time.";
remind.help =
  "Example command: ``$remind 2020-09-30 at 12pm for math-200`` \nGeneral form: ``$remind [YYYY-MM-DD] (at [HH:mm])? (for [course])?``";
remind.params = ["courseName", "date", "time"];

remind.execute = async (user, tokens) => {
  let nextParam;
  let givenParams = {};
  let remainingParams = [];
  if (user && user.ongoingCommand != "null") {
    let params = await paramGetter(user, tokens);
    nextParam = params.nextParam;
    givenParams = params.givenParams;
    remainingParams = params.remainingParams;
  } else {
    // Entry point of command, user has not interacted with bot before.
    remainingParams = new Array(...remind.params);
    let courseName = tokens.filter(
      (token) => regex.get("course").exec(token) !== null
    )[0];
    if (courseName) {
      givenParams.courseName = courseName;
      remainingParams.splice(remainingParams.indexOf("courseName"), 1);
    }
    nextParam = remainingParams[0];
  }
  let body;
  let complete;
  let task;
  if (nextParam) {
    body = prompts.get(nextParam);
    complete = false;
  } else {
    // Routine on completion
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
    complete = true;
  }
  return {
    embed: { title: "New Reminder", description: body },
    complete: complete,
    givenParams: JSON.stringify(givenParams),
    remainingParams: remainingParams,
    nextParam: nextParam,
    task: task,
  };
};

module.exports = remind;
