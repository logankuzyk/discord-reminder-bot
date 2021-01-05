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
    if (!time instanceof Date) {
      return;
    }
    if (time.getTime() > Date.now()) {
      let job = new cron.CronJob(time, callback, null, true, this.tz);
      return job;
    } else {
      console.log("Job is in the past, skipping");
      return;
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

    let dayBefore;
    if (task.executeDate && task.taskType == "assignment") {
      dayBefore = new Date(task.executeDate);
      dayBefore.setHours(dayBefore.getHours() - 24);
      await this.addMiscJob(dayBefore, callback);
    }

    await this.addMiscJob(new Date(task.executeDate), callback);
    return;
  };
}

// Circular dependency, node things
module.exports = Schedule;
