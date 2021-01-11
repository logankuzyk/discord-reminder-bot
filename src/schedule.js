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
    try {
      let job = new cron.CronJob(time, callback, null, true, this.tz);
      return job;
    } catch (e) {
      console.log("Job is in the past, skipping");
    }
  };

  addCourseReminder = async (task) => {
    if (task instanceof Map) {
      return task.forEach(this.addCourseReminder);
    }
    task.executeDate = Number(task.executeDate);

    let command = index.commands.get("upcoming").onParamFulfilment;
    let callback = () => {
      command({ courseName: task.courseName, scheduled: true }).then(
        (context) => {
          let channel = index.channels.cache.get(task.channelId);
          let embed = new Discord.MessageEmbed(context.embed);
          embed.setColor("ffc83d");
          channel.send(embed);
        }
      );
    };

    if (task.executeDate && task.taskType == "assignment") {
      await this.addMiscJob(new Date(task.executeDate - 300000), callback); // 5 minutes before due date.
      await this.addMiscJob(new Date(task.executeDate - 86400000), callback); // 24 hours before due date.
    } else {
      await this.addMiscJob(new Date(task.executeDate), callback);
    }

    return;
  };
}

// Circular dependency, node things
module.exports = Schedule;
