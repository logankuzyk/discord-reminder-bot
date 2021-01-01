const { timeout } = require("cron");
const regex = require("./regex");
const dotenv = require("dotenv").config(); // Needed anywhere I'm dealing with dates because of tz environment variable.
const blocked = require("blocked-at");

paramGetter = async (user, tokens) => {
  let nextParam = user.nextParam;
  let givenParams = user.givenParams;
  let remainingParams = user.remainingParams;

  console.log(`Remaining: ${remainingParams}`);
  console.log(`Given: ${givenParams}`);
  console.log(`Looking for ${nextParam}`);

  let param = checks.get(nextParam)(tokens, givenParams);
  let message = await new Promise((resolve, reject) => {
    if (param && nextParam == "date") {
      const index = require("../index");
      let date = new Date(`${param} 00:00`);
      let output = "";
      index.storage
        .getTasksOnDay(date, givenParams.courseName)
        .then((tasks) => {
          if (tasks && tasks.size > 0 && user.ongoingCommand == "add") {
            output =
              "**There is already one or more things due on that day.**\nIf the task you were going to add is a duplicate of one of the below, please type **$cancel**.\nIf your due date has NOT been added, please continue with the next parameter.\n\n";
            tasks.forEach((task) => {
              output += `**Task Name**: ${task.memo}\n **Date Due**: ${new Date(
                Number(task.executeDate)
              )}\n\n`;
            });
            resolve(output);
          } else {
            resolve(undefined);
          }
        });
    } else {
      resolve(undefined);
    }
  });
  if (checks.get(nextParam)(tokens, givenParams)) {
    console.log(`Found ${nextParam}, ${param}`);
    remainingParams.splice(remainingParams.indexOf(nextParam), 1);
    givenParams[nextParam] = param;
    nextParam = remainingParams[0];
    return {
      nextParam: nextParam,
      givenParams: givenParams,
      remainingParams: remainingParams,
      message: message,
    };
  } else {
    console.log(`Did not find ${nextParam}, will prompt again`);
    return null;
  }
};

const checks = new Map([
  [
    "courseName",
    (tokens) => {
      let output = tokens.filter(
        (token) => regex.get("course").exec(token) !== null
      );
      if (output.length > 0) {
        return output[0];
      } else {
        return null;
      }
    },
  ],
  [
    "date",
    (tokens) => {
      tokens = tokens.filter((token) => regex.get("date").exec(token));
      let output = tokens.filter((token) => new Date(token) != "Invalid Date");
      if (output.length > 0) {
        let taskTime = new Date(output[0] + " 24:00");
        if (taskTime == "Invalid Date") return null;
        if (Date.now() > taskTime.getTime()) return null;
        return output[0];
      } else {
        return null;
      }
    },
  ],
  [
    "time",
    (tokens, givenParams) => {
      let output = tokens.filter(
        (token) => regex.get("time").exec(token) !== null
      );
      if (output.length > 0) {
        let time = regex.get("time").exec(...output).groups;
        time.hour = Number(time.hour);
        time.minute = Number(time.minute);
        let taskTime = givenParams.date;
        if (time.hour && time.timeSuffix) {
          if (time.timeSuffix.toLowerCase() == "pm" && time.hour != 12) {
            time.hour += 12;
          }
        } else if (time.hour == 24) {
          time.hour = 0;
        }
        if (time.hour && time.minute) {
          taskTime += ` ${time.hour}:${time.minute}`;
        } else if (time.hour) {
          taskTime += ` ${time.hour}:00`;
        } else {
          taskTime += ` 00:00`;
        }
        taskTime = new Date(taskTime);
        if (taskTime == "Invalid Date") return null;
        if (Date.now() > taskTime.getTime()) return null;
        return taskTime;
      } else {
        return null;
      }
    },
  ],
  [
    "memo",
    (tokens) => {
      let output = "";
      for (let i in tokens) {
        if (i != 0) {
          output += tokens[i] + " ";
        }
      }
      return output;
    },
  ],
  [
    "cancel",
    (tokens) => {
      if (tokens.indexOf("cancel") >= 0) {
        return "cancel";
      }
    },
  ],
]);

// blocked((time, stack) => {
//   console.log(`Blocked for ${time}ms, operation started here:`, stack);
// });

module.exports = paramGetter;
