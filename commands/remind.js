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

module.exports.about =
  "Get reminded about a classes' due dates at a certain time.";

module.exports.help =
  "Example command: ``$remind 2020-09-30 at 12pm for math-200``";

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
    throw new Error("Can't change history");
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
      range: "A1:A",
      resource: {
        range: "A1:A",
        values: [[id, date.getTime(), course, msg.author.id, "reminder"]],
      },
    })
    .then((res) => {
      msg.reply(
        `Reminder added! I will send you a PM with ${course}'s upcoming due dates at ${date.toString()}. \nThis reminder's unique ID is \`\`${id}\`\``
      );
      return bot.loadRange(res.data.updates.updatedRange);
    })
    .catch((err) => {
      throw new Error(`Something went wrong with Google Sheets ${err}`);
    });
};
