const dotenv = require("dotenv").config();
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

module.exports.about = "List the next 7 days of assignments.";

module.exports.help = "Example command: ``$upcoming``";

module.exports.execute = async ({ bot, msg, input, channel, course }) => {
  if (!course && msg) course = msg.channel.name;
  if (!course && channel) course = channel.name;
  if (course == "bot-commands")
    throw new Error(
      "You need to specify the course when using the bot-commands channel."
    );
  let output = `Nothing is due in the next 7 days for ${course}! Or no one has added any due dates yet. Be the hero! Add some with \`\`$add\`\`.`;
  sheets.spreadsheets.values
    .get({
      spreadsheetId: process.env.SHEET_ID,
      range: "A1:E",
    })
    .then((res) => {
      if (!res.data.values) {
        if (msg) {
          msg.reply(output);
        } else if (channel) {
          channel.send(output);
        }
        return;
      }
      output = "";
      output += `Here are the assignments due in the next 7 days for ${course}\n`;
      let weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      let assignments = res.data.values.filter(
        (row) =>
          row[0] > Date.now() &&
          row[0] < weekFromNow &&
          row[3] == "assignment" &&
          row[1] == course
      );
      for (let row of assignments) {
        output += `${row[4]} is due ${new Date(Number(row[0]))}\n`;
      }
      console.log(output);
      if (msg) {
        msg.reply(output);
      } else if (channel) {
        channel.send(output);
      }
    });

  return;
};
