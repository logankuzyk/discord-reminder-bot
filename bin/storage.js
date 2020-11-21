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
          "range",
        ],
      ],
    ]);
    this.pages = new Map([
      ["all", "Sheet1!A2:I"],
      ["users", "Sheet2!A2:J"],
    ]);
  }

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
        obj["range"] = range;
        return obj;
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
    remainingParams = []
  ) => {
    let user = await this.getUser(userId);
    let range = this.pages.get("users");
    if (user) {
      user["timeUpdated"] = Date.now();
      user["ongoingCommand"] = ongoingCommand;
      user["givenParams"] = givenParams;
      user["nextParam"] = nextParam;
      user["remainingParams"] = remainingParams;
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
