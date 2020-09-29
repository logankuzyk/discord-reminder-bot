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

module.exports.about =
  "Get reminded about a classes' due dates at a certain time.";

module.exports.help =
  "Example command: ``$remind 2020-09-30 at 12pm for math-200``";

module.exports.execute = async ({ bot, msg, input }) => {
  try {
    let {
      groups: { date, time, timeSuffix, course },
    } = /^(?<date>\S+)( at ((?<time>\d{1,2})(?<timeSuffix>[a-z]{2})*))*( for (?<course>([(a-z]{3,4}-([0-9]{2})\w$)))*$/g.exec(
      input
    );
    date = new Date(date);
    time = Number(time);
    if (!course && msg.channel.name != "bot-commands") {
      course = msg.channel.name;
    } else if (msg.channel.name == "bot-commands") {
      throw new Error(
        "Since you're in the bot-commands channel, you're going to need to provide the course for this reminder."
      );
    }
    if (date == "Invalid Date")
      throw new Error("Date is invalid or not present");
    if (time && timeSuffix) {
      if (timeSuffix.toLowerCase() == "pm" && time != 12) {
        date.setHours(time + 12);
      } else if (timeSuffix.toLowerCase() == "pm" && time == 12) {
        date.setHours(12);
      } else if (time != 12) {
        date.setHours(time);
      }
    } else if (time) {
      date.setHours(time);
    }
    if (msg.createdTimestamp > date.getTime())
      throw new Error("Can't change history");
    await sheets.spreadsheets.values
      .append({
        spreadsheetId: process.env.SHEET_ID,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        range: "A1:A",
        resource: {
          range: "A1:A",
          values: [[date.getTime(), course, msg.author.id, "reminder"]],
        },
      })
      .then((res) => {
        msg.reply(
          `Reminder added! I will send you a PM with ${course}'s upcoming due dates at ${date.toString()}.`
        );
        return bot.loadRange(res.data.updates.updatedRange);
      })
      .catch((err) => {
        throw new Error(`Something went wrong with Google Sheets ${err}`);
      });
  } catch (err) {
    if (err.name == "TypeError") {
      throw new Error(`Date is invalid or not present ${err}`);
    } else {
      throw err;
    }
  }
};
