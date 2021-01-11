const { google } = require("googleapis");
const dotenv = require("dotenv").config();

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
  constructor() {
    this.sheetId = process.env.SHEET_ID;
    this.isSynchronized = false;
    this.indexes = new Map([
      [
        "all",
        [
          "taskId",
          "channelId",
          "executeDate",
          "courseName",
          "authorId",
          "taskType",
          "isActive",
          "score",
          "memo",
        ],
      ],
      [
        "users",
        [
          "userId",
          "name",
          "rep",
          "dueDatesAdded",
          "ongoingCommand",
          "timeUpdated",
          "givenParams",
          "nextParam",
          "remainingParams",
          "activeChannel",
          "range",
        ],
      ],
    ]);
    this.pages = new Map([
      ["all", "Sheet1!A2:I"],
      ["users", "Sheet2!A2:J"],
      ["old", "Sheet3!A2:I"],
    ]);
  }

  refresh = async () => {
    this.getAllTasks().then((allTasks) => {
      let activeTasks = [];
      let oldTasks = [];
      allTasks.forEach((task) => {
        if (Number(task.executeDate) > Date.now() || task.isActive == "TRUE") {
          let output = [];
          for (let [key, value] of Object.entries(task)) {
            output[this.indexes.get("all").indexOf(key)] = String(value);
          }
          activeTasks.push(output);
        } else {
          let output = [];
          for (let [key, value] of Object.entries(task)) {
            output[this.indexes.get("all").indexOf(key)] = String(value);
          }
          oldTasks.push(output);
        }
      });
      sheets.spreadsheets.values
        .clear({
          spreadsheetId: this.sheetId,
          range: this.pages.get("all"),
        })
        .then(() => {
          sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: this.sheetId,
            requestBody: {
              data: {
                range: this.pages.get("all"),
                majorDimension: "ROWS",
                values: activeTasks,
              },
              valueInputOption: "RAW",
            },
          });
        });
      sheets.spreadsheets.values.append({
        spreadsheetId: this.sheetId,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        range: this.pages.get("old"),
        resource: {
          range: this.pages.get("old"),
          values: oldTasks,
        },
      });
    });
  };

  // Get task info from database. Returns null if not found.
  getTask = async (taskId) => {
    let output = await sheets.spreadsheets.values
      .get({
        spreadsheetId: this.sheetId,
        range: this.pages.get("all"),
      })
      .then((res) => {
        if (!res.data.values) {
          return null;
        }
        let target = res.data.values.filter(
          (cell) => cell[this.indexes.get("all").indexOf("taskId")] == taskId
        )[0];
        if (!target) return null;
        let obj = {};
        for (let cell in target) {
          obj[this.indexes.get("all")[cell]] = target[cell];
        }
        return obj;
      });
    return output;
  };

  getAssignmentsOnDay = async (date, courseName) => {
    if (courseName) {
      courseName = courseName.toLowerCase();
    }
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    let tasks = await sheets.spreadsheets.values
      .get({
        spreadsheetId: this.sheetId,
        range: this.pages.get("all"),
      })
      .then((res) => {
        if (!res.data.values) {
          return null;
        }
        let targets = res.data.values.filter((cell) => {
          let otherDate = new Date(
            Number(cell[this.indexes.get("all").indexOf("executeDate")])
          );
          return (
            cell[this.indexes.get("all").indexOf("taskType")] == "assignment" &&
            cell[this.indexes.get("all").indexOf("courseName")] == courseName &&
            otherDate.getFullYear() == date.getFullYear() &&
            otherDate.getMonth() == date.getMonth() &&
            otherDate.getDate() == date.getDate()
          );
        });
        if (targets.length == 0) return null;
        let output = new Map();
        targets.forEach((taskRow) => {
          let obj = {};
          taskRow.forEach((cell, index) => {
            obj[this.indexes.get("all")[index]] = cell;
          });
          output.set(obj.taskId, obj);
        });
        return output;
      });
    return tasks;
  };

  getAllTasks = async () => {
    let output = new Map();
    await sheets.spreadsheets.values
      .get({
        spreadsheetId: this.sheetId,
        range: this.pages.get("all"),
      })
      .then((res) => {
        if (!res.data.values) return null;
        for (let row of res.data.values) {
          let obj = {};
          for (let cell in row) {
            obj[this.indexes.get("all")[cell]] = row[cell];
          }
          output.set(obj["taskId"], obj);
        }
      });
    return output;
  };

  // Get user info from database. Returns null if not found.
  getUser = async (userId) => {
    let output = await sheets.spreadsheets.values
      .get({
        spreadsheetId: this.sheetId,
        range: this.pages.get("users"),
      })
      .then((res) => {
        if (!res.data.values) {
          return null;
        }
        let target = res.data.values.filter(
          (row) => row[this.indexes.get("users").indexOf("userId")] == userId
        )[0];
        let range = `Sheet2!A${res.data.values.indexOf(target) + 2}`;
        if (!target) return null;
        let obj = {};
        for (let cell in target) {
          obj[this.indexes.get("users")[cell]] = target[cell];
        }
        obj["userId"] = obj["userId"];
        obj["rep"] = Number(obj["rep"]);
        obj["dueDatesAdded"] = Number(obj["dueDatesAdded"]);
        obj["timeUpdated"] = Number(obj["timeUpdated"]);
        obj["givenParams"] = JSON.parse(obj["givenParams"]);
        obj["remainingParams"] = obj["remainingParams"].split(",");
        obj["activeChannel"] = Number(obj["activeChannel"]);
        obj["range"] = range;
        return obj;
      });
    return output;
  };

  getAllUsers = async () => {
    let output = new Map();
    await sheets.spreadsheets.values
      .get({
        spreadsheetId: this.sheetId,
        range: this.pages.get("users"),
      })
      .then((res) => {
        if (!res.data.values) return null;
        for (let row of res.data.values) {
          let obj = {};
          for (let cell in row) {
            obj[this.indexes.get("users")[cell]] = row[cell];
          }
          output.set(obj["userId"], obj);
        }
      });
    return output;
  };

  addTask = async (task) => {
    let row = new Promise((resolve, reject) => {
      let arr = [];
      for (let [key, value] of Object.entries(task)) {
        arr[this.indexes.get("all").indexOf(key)] = String(value);
      }
      resolve(arr);
    });
    sheets.spreadsheets.values
      .append({
        spreadsheetId: this.sheetId,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        range: this.pages.get("all"),
        resource: {
          range: this.pages.get("all"),
          values: [await row],
        },
      })
      .then(async (res) => {
        // Might want to synchronize sheet or something...
      })
      .catch((err) => {
        console.log(err);
      });

    return;
  };

  // Add user to database, or update their ongoing command and timeout.
  addUser = async (
    userId,
    username,
    ongoingCommand = null,
    givenParams = [],
    nextParam = null,
    remainingParams = [],
    activeChannel
  ) => {
    let user = await this.getUser(userId);
    let range = this.pages.get("users");
    if (user) {
      user["timeUpdated"] = Date.now();
      user["ongoingCommand"] = ongoingCommand;
      user["givenParams"] = givenParams;
      user["nextParam"] = nextParam;
      user["remainingParams"] = remainingParams;
      user["activeChannel"] = activeChannel;
      range = user["range"];
    } else {
      user = {
        userId: userId,
        name: username,
        rep: 0,
        dueDatesAdded: 0,
        ongoingCommand: ongoingCommand,
        timeUpdated: Date.now(),
        givenParams: givenParams,
        nextParam: nextParam,
        remainingParams: remainingParams,
        range: "",
      };
    }
    let row = [];
    for (let [key, value] of Object.entries(user)) {
      row[this.indexes.get("users").indexOf(key)] = String(value);
    }
    if (!user.range) {
      sheets.spreadsheets.values
        .append({
          spreadsheetId: this.sheetId,
          valueInputOption: "RAW",
          insertDataOption: "INSERT_ROWS",
          range: this.pages.get("users"),
          resource: {
            range: this.pages.get("users"),
            values: [row],
          },
        })
        .then(async () => {
          // Might want to synchronize sheet or something...
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      sheets.spreadsheets.values
        .update({
          spreadsheetId: process.env.SHEET_ID,
          valueInputOption: "RAW",
          range: range,
          resource: {
            range: range,
            values: [row],
          },
        })
        .then(async () => {
          // Might want to synchronize sheet or something...
        })
        .catch((err) => {
          console.log(err);
        });
    }
    return user;
  };

  resetUser = async (userId) => {
    let user = await this.getUser(userId);
    if (user) {
      await this.addUser(userId, user.username, null, null, null, null);
      console.log("Reset user", userId);
    } else {
      return;
    }
  };
}

module.exports = Storage;
