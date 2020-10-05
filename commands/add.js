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

module.exports.about = "Add an assignment due date to the calendar.";

module.exports.help =
  "Example command: ``$add Worksheet 2 on 2020-09-29 at 11pm for math-122``";

module.exports.execute = async ({ bot, msg, input }) => {
  let {
    groups: { note, date, time, timeSuffix, course },
  } = /^(?<note>(\w( )*)+) on (?<date>\S+)( at ((?<time>\d{1,2})(?<timeSuffix>[a-z]{2})*))*( for (?<course>([(a-z]{3,4}-([0-9]{2})\w$)))*$/g.exec(
    input
  );
  date = new Date(date);
  time = Number(time);
  if (!course && msg.channel.name != "bot-commands") {
    course = msg.channel.name;
  } else if (msg.channel.name == "bot-commands") {
    throw new Error(
      "Since you're in the bot-commands channel, you're going to need to provide the course for this due date."
    );
  }
  if (date == "Invalid Date") throw new Error("Date is invalid or not present");
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
    throw new Error("Can't add past assignment");
  await sheets.spreadsheets.values
    .append({
      spreadsheetId: process.env.SHEET_ID,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      range: "A1:A",
      resource: {
        range: "A1:A",
        values: [
          [date.getTime(), msg.channel.name, msg.author.id, "assignment", note],
        ],
      },
    })
    .then((res) => {
      msg.reply(
        `Due date added! ${note} is due at ${date.toString()} for ${course}. To set a reminder, use \`\`$remind\`\` followed by the date and time to be reminded.`
      );
      return bot.loadRange(res.data.updates.updatedRange);
    })
    .catch(console.log("Something went wrong with Google Sheets"));
};
