const Command = require("../command");
const regex = require("../regex");
const prompts = require("../prompts");

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
    givenParams = user.givenParams;
    remainingParams = new Array(...user.remainingParams);
    console.log(`Remaining: ${remainingParams}`);
    console.log(`Given: ${givenParams}`);
    console.log(`Looking for ${user.nextParam}`);
    if (user.nextParam == "courseName") {
      let courseName = tokens.filter(
        (token) => regex.get("course").exec(token) !== null
      );
      if (courseName) {
        console.log(`Found courseName ${courseName}`);
        [givenParams.courseName] = courseName;
        remainingParams.splice(remainingParams.indexOf("courseName"), 1);
        nextParam = remainingParams[0];
      }
    } else if (user.nextParam == "date") {
      tokens = tokens.filter((token) => regex.get("date").exec(token));
      let date = tokens.filter((token) => new Date(token) != "Invalid Date");
      if (date.length > 0) {
        // console.log(date);
        console.log(`Found date ${date}`);
        [givenParams.date] = date;
        remainingParams.splice(remainingParams.indexOf("date"), 1);
        nextParam = remainingParams[0];
      }
    } else if (user.nextParam == "time") {
      let time = tokens.filter(
        (token) => regex.get("time").exec(token).groups.hour
      );
      if (time) {
        console.log(`Found time ${time}`);
        givenParams.time = regex.get("time").exec(time).groups;
        remainingParams.splice(remainingParams.indexOf("time"), 1);
        nextParam = remainingParams[0];
      }
    }
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
  let taskTime;
  if (nextParam) {
    body = prompts.get(nextParam);
    complete = false;
  } else {
    // Routine on completion
    // Time parsing
    taskTime = givenParams.date;
    givenParams.time.hour = Number(givenParams.time.hour);
    givenParams.time.minute = Number(givenParams.time.minute);
    if (givenParams.time.hour && givenParams.time.timeSuffix) {
      if (
        givenParams.time.timeSuffix.toLowerCase() == "pm" &&
        givenParams.time.hour != 12
      ) {
        givenParams.time.hour += 12;
      }
    } else if (givenParams.time.hour == 24) {
      givenParams.time.hour = 0;
    }
    if (givenParams.time.hour && givenParams.time.minute) {
      taskTime += ` ${givenParams.time.hour}:${givenParams.time.minute}`;
    } else if (givenParams.time.hour) {
      taskTime += ` ${givenParams.time.hour}:00`;
    } else {
      taskTime += ` 00:00`;
    }
    console.log(taskTime);
    taskTime = new Date(taskTime);
    if (taskTime == "Invalid Date")
      throw new Error("Date is invalid or not present");
    if (Date.now() > taskTime.getTime())
      throw new Error("Can't change history");
    body = `Reminder added! I will send you a PM with ${
      givenParams.courseName
    }'s due dates on ${taskTime.toString()}`;
    complete = true;
  }
  return {
    embed: { title: "New Reminder", description: body },
    complete: complete,
    givenParams: JSON.stringify(givenParams),
    remainingParams: remainingParams,
    nextParam: nextParam,
    taskTime: taskTime,
  };
};

module.exports = remind;
