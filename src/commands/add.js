const Command = require("../command");
const regex = require("../regex");
const prompts = require("../prompts");
const paramGetter = require("../paramGetter");

const add = new Command();

add.about = "Get reminded about a course's due dates at a certain time.";
add.params = ["courseName", "date", "time", "memo"];

add.execute = async (user, tokens) => {
  let nextParam;
  let givenParams = {};
  let remainingParams = [];
  let ongoingCommand = null;
  let body;
  let paramReadSuccess;
  if (user && user.ongoingCommand != "null") {
    ongoingCommand = user.ongoingCommand;
    let params = await paramGetter(user, tokens);
    if (params) {
      nextParam = params.nextParam;
      givenParams = params.givenParams;
      remainingParams = params.remainingParams;
      paramReadSuccess = true;
      body = prompts.get(nextParam);
    } else {
      nextParam = user.nextParam;
      givenParams = user.givenParams;
      remainingParams = user.remainingParams;
      paramReadSuccess = false;
    }
  } else {
    // Entry point of command, user has not interacted with bot before.
    paramReadSuccess = true;
    remainingParams = new Array(...add.params);
    let courseName = tokens.filter(
      (token) => regex.get("course").exec(token) !== null
    )[0];
    if (courseName) {
      givenParams.courseName = courseName;
      remainingParams.splice(remainingParams.indexOf("courseName"), 1);
    }
    nextParam = remainingParams[0];
  }
  let complete;
  let task;
  if (paramReadSuccess) {
    body = prompts.get(nextParam);
  } else {
    body =
      "I wasn't able to read that, please try again.\n\n" +
      prompts.get(nextParam);
  }
  if (nextParam) {
    complete = false;
  } else {
    // Routine on completion
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
    complete = true;
  }
  return {
    embed: { title: "New Due Date", description: body },
    complete: complete,
    givenParams: JSON.stringify(givenParams),
    remainingParams: remainingParams,
    nextParam: nextParam,
    task: task,
  };
};

module.exports = add;
