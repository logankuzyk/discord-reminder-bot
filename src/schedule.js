const Discord = require("discord.js");
const cron = require("cron");
const index = require("../index");
const dotenv = require("dotenv").config();

class Schedule {
  constructor(tasks) {
    this.tasks = tasks; // Same as the output of Storage.dumpSheet()
    this.tz = process.env.TZ;
    if (this.tasks) {
      this.tasks.forEach(addCourseReminder);
    }
  }
  addMiscJob = async (time, callback) => {
    let job = new cron.CronJob(time, callback, null, true, this.tz);
    return job;
  };

  addCourseReminder = async (task) => {
    if (task instanceof Map) {
      return task.forEach(this.addCourseReminder);
    }
    // Execution defaults to everyday at midnight. This is for the daily class reminders.
    let executeDate = "0 0 0 * * *";
    if (task.executeDate && task.taskType == "assignment") {
      executeDate = new Date(Number(task.executeDate));
      executeDate.setHours(executeDate.getHours() - 4);
      if (executeDate.getTime() - Date.now() < 0) return;
    } else if (task.executeDate && task.taskType == "reminder") {
      executeDate = new Date(Number(task.executeDate));
    }
    let command = index.commands.get("upcoming").onParamFulfilment;

    let job = new cron.CronJob(
      executeDate,
      () => {
        command({ courseName: task.courseName, scheduled: true }).then(
          (context) => {
            let channel = index.channels.cache.get(task.channelId);
            let embed = new Discord.MessageEmbed(context.embed);
            embed.setColor("ffc83d");
            channel.send(embed);
          }
        );
      },
      null,
      true,
      this.tz
    );
    return job;
  };
}

// Circular dependency, node things
module.exports = Schedule;
