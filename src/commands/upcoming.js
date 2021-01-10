const Command = require("../command");
const index = require("../../index");

const upcoming = new Command(
  ["courseName"],
  async (givenParams) => {
    body = "";
    fields = await new Promise((resolve, reject) => {
      index.storage.getAllTasks().then((tasks) => {
        let output = "";
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
            Number(task.executeDate) > Date.now()
          ) {
            dueDates.push(task);
          }
        });
        dueDates.sort((a, b) => (a.executeDate > b.executeDate ? 1 : -1));
        dueDates.forEach((task) => {
          output += `**Task Name**: ${task.memo}\n **Date Due**: ${new Date(
            Number(task.executeDate)
          )}\n`;
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
    let title;
    if (givenParams.scheduled) {
      title = `Something is due soon for ${givenParams.courseName.toUpperCase()}!`;
    } else {
      title = `${givenParams.courseName.toUpperCase()} Upcoming Due Dates`;
    }
    return {
      embed: {
        title: title,
        description: body,
        fields: fields,
      },
      complete: true,
    };
  },
  undefined,
  "List all future due dates for a course.",
  "help"
);

module.exports = upcoming;
