const Discord = require("discord.js");
const cron = require("cron");
const index = require("../index");
const dotenv = require("dotenv").config();

class Schedule {
  constructor() {
    this.courseReminders = new Map(); // Map of all cron jobs which send reminder messages to users or course channels, key is the reminder/assignment ID.
    this.tz = process.env.TZ;
  }

  synchronize = async (sheetTasks) => {
    this.courseReminders.forEach((scheduledTaskJobs, scheduledTaskId) => {
      if (!sheetTasks.has(scheduledTaskId)) {
        scheduledTaskJobs.forEach((job) => job.stop());
        this.courseReminders.delete(scheduledTaskId);
        console.log(`Deleted ${scheduledTaskId}`);
      }
    });
  };

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

    task.taskId = String(task.taskId);
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

    let jobs;

    if (task.executeDate && task.taskType == "assignment") {
      jobs = [
        await this.addMiscJob(new Date(task.executeDate - 300000), callback),
        await this.addMiscJob(new Date(task.executeDate - 86400000), callback),
      ]; // 5 minutes and 24 hour reminders before due date.
    } else {
      jobs = [await this.addMiscJob(new Date(task.executeDate), callback)];
    }

    this.courseReminders.set(task.taskId, jobs);

    return;
  };
}

// Circular dependency, node things
module.exports = Schedule;
