const Discord = require("discord.js");
const cron = require("cron");
const index = require("../index");

class Schedule {
  constructor(tasks) {
    this.tasks = tasks; // Same as the output of Storage.dumpSheet()
    if (this.tasks) {
      this.tasks.forEach(addJob);
    }
  }

  addJob = async (task) => {
    if (task instanceof Map) {
      return task.forEach(this.addJob);
    }
    // Execution defaults to everyday at midnight. This is for the daily class reminders.
    let executeDate = "0 0 0 * * *";
    if (task.executeDate) {
      executeDate = new Date(Number(task.executeDate));
      if (executeDate.getTime() - Date.now() < 0) return;
    }
    let command = index.commands.get("upcoming").execute;

    let job = new cron.CronJob(
      executeDate,
      () => {
        command(null, [task.courseName]).then((context) => {
          let channel = index.channels.cache.get(task.channelId);
          let embed = new Discord.MessageEmbed(context.embed);
          embed.setColor("ffc83d");
          channel.send(embed);
        });
      },
      null,
      false, // Job needs to be started with .start()
      "America/Los_Angeles"
    );
    return job;
  };
}

// Circular dependency, node things
module.exports = Schedule;
