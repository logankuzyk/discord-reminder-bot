const cron = require("cron");
const index = require("./index");

class Schedule {
  constructor(tasks) {
    this.tasks = tasks; // Same as the output of Storage.dumpSheet()
    if (this.tasks) {
      this.tasks.forEach(addJob);
    }
  }

  addJob = (task) => {
    if (task instanceof Map) {
      return task.forEach(this.addJob);
    }
    let executeDate = "0 0 0 * * *";
    if (task.executeDate) {
      executeDate = new Date(Number(task.executeDate));
      console.log(executeDate);
      if (task.isActive == 1 && executeDate.getTime() < Date.now())
        throw new Error("Date already passed. What's done is done, bud");
    }
    let command = index.commands.get("upcoming").execute;

    let job = new cron.CronJob(
      executeDate,
      () => {
        //Will add parameters when command parameters are improved/standardized.
        command();
      },
      null,
      true,
      "America/Los_Angeles"
    );
    return;
  };
}

module.exports = Schedule;
