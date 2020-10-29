const { google } = require("googleapis");
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
google.options({
  auth: auth,
});
const sheets = google.sheets({
  version: "v4",
  credentials: auth,
});

class Storage {
  constructor(sheetId = process.env.SHEET_ID) {
    this.sheetId = sheetId;
    this.isSynchronized = false;
    this.indexes = [
      "taskId",
      "executeDate",
      "courseName",
      "authorId",
      "taskType",
      "isActive",
      "score",
      "memo",
    ];
    this.pages = new Map([["all", "Sheet1!A2:H"]]);
    this.tasks = this.dumpSheet("all");
  }

  dumpSheet = async (page) => {
    let output = new Map();
    await sheets.spreadsheets.values
      .get({
        spreadsheetId: this.sheetId,
        range: this.pages.get(page),
      })
      .then((res) => {
        if (!res.data.values) {
          return output;
        }
        for (let row of res.data.values) {
          let obj = {};
          let taskId = row[this.indexes.indexOf("taskId")];
          for (let index in row) {
            obj[this.indexes[index]] = row[index];
          }
          output.set(taskId, obj);
        }
      });
    return output;
  };

  synchronize = async () => {
    this.dumpSheet("all").then(() => {});
    // .then((res) => {
    //   for (let row of res.data.values) {
    //     let date = new Date(Number(row[1]));
    //     if (date.getTime() > Date.now()) {
    //       if (row[4] == "reminder") {
    //         let user = bot.users.cache.get(row[3]);
    //         user.createDM().then((dmChannel) => {
    //           bot.addJob(date, bot.commands.get("upcoming").execute, {
    //             bot: bot,
    //             channel: dmChannel,
    //             course: row[2],
    //           });
    //         });
    //         console.log(`Added reminder on ${date.toString()}`);
    //       }
    //       console.log(`Added due date on ${date.toString()}`);
    //     }
    //   }
    // });
  };
}

module.exports = Storage;
