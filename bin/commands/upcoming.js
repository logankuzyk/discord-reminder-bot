const Command = require("../command");
const index = require("../../index");
const regex = require("../regex");
const fs = require("fs");
const { resolve } = require("path");

const upcoming = new Command();

upcoming.about = "List available commands.";
upcoming.help = "Example command: ``$help``";
upcoming.params = ["courseName"];

upcoming.execute = async (user, tokens) => {
  let courseName = new Promise((resolve, reject) => {
    console.log("Looking for courseName");
    let courseName = tokens.filter(
      (token) => regex.get("course").exec(token) !== null
    );
    if (courseName) {
      console.log(`Found courseName ${courseName}`);
      resolve(...courseName);
    } else {
      reject();
    }
  });
  let body = new Promise((resolve, reject) => {
    let body;
    index.storage.getAllTasks().then((tasks) => {
      if (tasks.size == 0) {
        console.log("No due dates added");
        body =
          "Nothing is due, or no one has added any due dates for this class.";
        resolve(body);
        return;
      }
      let courseTasks = [];
      for (let task of tasks) {
        if (
          task.courseName == courseName &&
          task.taskType == "assignment" &&
          Number(task.executeDate) - Date.getTime() > 0
        ) {
          courseTasks.push(task);
        }
      }
      if (courseTasks.length == 0) {
        console.log("No due dates added");
        body =
          "Nothing is due, or no one has added any due dates for this class.";
        resolve(body);
        return;
      }
      for (let task of courseTasks) {
        body += `${task.memo} is due on ${Date(Number(task.executeDate))}\n`;
      }
      resolve(`\`\`\`${body}\`\`\``);
    });
  });
  console.log(await body);
  return {
    embed: { title: "Upcoming Due Dates", description: await body },
    complete: true,
    params: null,
  };
};

module.exports = upcoming;
