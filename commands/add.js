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
  "Example command: ``$add Worksheet 2 on 2020-09-29 at 11:00pm for math-122`` \nGeneral form: ``$add [name] on [YYYY-MM-DD] (at [HH:mm])? (for [course])?``";

module.exports.execute = async ({ bot, msg, input }) => {
  try {
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
    } else {
      date += ` 00:00`;
    }
    date = new Date(date);
    console.log(date.toString());
    if (date == "Invalid Date")
      throw new Error("Date is invalid or not present");
    if (msg.createdTimestamp > date.getTime())
      throw new Error("Can't add past assignment");
    msg
      .reply(
        `Due date added! ${note} is due at ${date.toString()} for ${course}. \nTo set a reminder for this class, use \`\`$remind\`\` followed by the date and time to be reminded. \nReact with a 👍 if the due date is accurate; 👎 if it isn't.`
      )
      .then((reply) => {
        sheets.spreadsheets.values
          .append({
            spreadsheetId: process.env.SHEET_ID,
            valueInputOption: "RAW",
            insertDataOption: "INSERT_ROWS",
            range: "A2:A",
            resource: {
              range: "A2:A",
              values: [
                [
                  reply.id,
                  date.getTime(),
                  course,
                  msg.author.id,
                  "assignment",
                  1,
                  0,
                  note,
                ],
              ],
            },
          })
          .then((res) => {
            return bot.loadRange(res.data.updates.updatedRange);
          });
      });
  } catch (err) {
    if (err.name == "TypeError") {
      throw new Error(
        "Your command doesn't match the format. Try $help add if you're stuck."
      );
    } else {
      throw new Error(err.message);
    }
  }
};
