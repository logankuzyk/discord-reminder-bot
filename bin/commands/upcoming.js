// TODO: make a service/function which takes care of the prompts to reduce the complexity of each command's code.

const Command = require("../command");
const index = require("../../index");
const regex = require("../regex");
const prompts = require("../prompts");
const paramGetter = require("../paramGetter");

const upcoming = new Command();

upcoming.about = "List available commands.";
upcoming.help = "Example command: ``$help``";
upcoming.params = ["courseName"];

upcoming.execute = async (user, tokens) => {
  let nextParam;
  let givenParams = {};
  let remainingParams = [];
  if (user && user.ongoingCommand != "null") {
    let params = await paramGetter(user, tokens);
    if (params) {
      nextParam = params.nextParam;
      givenParams = params.givenParams;
      remainingParams = params.remainingParams;
    } else {
      nextParam = user.nextParam;
      givenParams = user.givenParams;
      remainingParams = user.remainingParams;
    }
  } else {
    // Entry point of command, user has not interacted with bot before.
    remainingParams = new Array(...upcoming.params);
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
  let fields;
  if (nextParam) {
    body = prompts.get(nextParam);
    complete = false;
  } else {
    // Routine on completion
    body = "";
    fields = await new Promise((resolve, reject) => {
      index.storage.getAllTasks().then((tasks) => {
        let output = [];
        let dueDates = [];
        if (tasks.size == 0) {
          console.log("No due dates added");
          output =
            "Nothing is due, or no one has added any due dates for this class.";
          resolve(output);
        }
        tasks.forEach((task) => {
          if (
            task.courseName == givenParams.courseName &&
            task.taskType == "assignment" &&
            Number(task.executeDate) - Date.now() > 0
          ) {
            dueDates.push(task);
          }
        });
        dueDates.sort((a, b) => (a.executeDate > b.executeDate ? 1 : -1));
        dueDates.forEach((task) => {
          output.push(
            {
              name: "Task Name",
              value: task.memo + "\n",
              inline: false,
            },
            {
              name: "Date Due",
              value: new Date(Number(task.executeDate)),
              inline: false,
            }
          );
        });
        if (output.length == 0) {
          console.log("No due dates added");
          output = `Nothing is due, or no one has added any due dates for ${givenParams.courseName}.`;
          resolve(output);
        }
        resolve(output);
      });
    }).then((output) => {
      if (typeof output === "string") {
        body = output;
        return "";
      } else {
        return output;
      }
    });
    complete = true;
  }
  return {
    embed: {
      title: `${givenParams.courseName.toUpperCase()} Upcoming Due Dates`,
      description: body,
      fields: fields,
    },
    complete: complete,
    givenParams: JSON.stringify(givenParams),
    remainingParams: remainingParams,
    nextParam: nextParam,
  };
};

module.exports = upcoming;
