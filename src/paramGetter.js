const { timeout } = require("cron");
const regex = require("./regex");
const dotenv = require("dotenv").config(); // Needed anywhere I'm dealing with dates because of tz environment variable.

paramGetter = async (user, tokens) => {
  let nextParam = user.nextParam;
  let givenParams = user.givenParams;
  let remainingParams = user.remainingParams;

  console.log(`Remaining: ${remainingParams}`);
  console.log(`Given: ${givenParams}`);
  console.log(`Looking for ${nextParam}`);

  let param = checks.get(nextParam)(tokens, givenParams);
  if (param) {
    console.log(`Found ${nextParam}, ${param}`);
    remainingParams.splice(remainingParams.indexOf(nextParam), 1);
    givenParams[nextParam] = param;
    nextParam = remainingParams[0];
    return {
      nextParam: nextParam,
      givenParams: givenParams,
      remainingParams: remainingParams,
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

module.exports = paramGetter;
