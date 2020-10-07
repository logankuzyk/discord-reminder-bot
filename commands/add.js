const { google } = require("googleapis");
const randomstring = require("randomstring");

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
    groups: { note, date, hour, minute, timeSuffix, course },
  } = /^(?<note>(\w( )*)+) on (?<date>\S+)( at ((?<hour>\d{1,2})(:(?<minute>\d{2}))*(?<timeSuffix>[a-z]{2})*))*( for (?<course>([(a-z]{3,4}-([0-9]{2})\w$)))*$/g.exec(
    input
  );
  hour = Number(hour);
  minute = Number(minute);
  if (!course && msg.channel.name != "bot-commands") {
    course = msg.channel.name;
  } else if (msg.channel.name == "bot-commands" && !course) {
    throw new Error(
      "Since you're in the bot-commands channel, you're going to need to provide the course for this due date."
    );
  }
  if (hour && timeSuffix) {
    if (timeSuffix.toLowerCase() == "pm" && hour != 12) {
      hour += 12;
    }
  } else if (hour == 24) {
    hour = 0;
  }
  if (hour && minute) {
    date += ` ${hour}:${minute}`;
  } else if (hour) {
    date += ` ${hour}:00`;
  }
  date = new Date(date);
  console.log(date.toString());
  if (date == "Invalid Date") throw new Error("Date is invalid or not present");
  if (msg.createdTimestamp > date.getTime())
    throw new Error("Can't add past assignment");
  let id = await randomstring.generate({
    length: 6,
    readable: true,
    charset: "alphabetic",
  });
  sheets.spreadsheets.values
    .append({
      spreadsheetId: process.env.SHEET_ID,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      range: "A2:A",
      resource: {
        range: "A2:A",
        values: [
          [id, date.getTime(), course, msg.author.id, "assignment", note],
        ],
      },
    })
    .then((res) => {
      msg.reply(
        `Due date added! ${note} is due at ${date.toString()} for ${course}. \nTo set a reminder, use \`\`$remind\`\` followed by the date and time to be reminded. \nThis assignment's unique ID is \`\`${id}\`\``
      );
      return bot.loadRange(res.data.updates.updatedRange);
    });
};
