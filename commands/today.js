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

module.exports.about = "Display the assignments that are due today.";

module.exports.help = "Example command: ``$today``";

module.exports.execute = async ({ bot, msg, input, channel, course }) => {
  if (!course && msg) course = msg.channel.name;
  else if (!course && channel) course = channel.name;
  else if (course == "bot-commands") {
    if (/^(?<course>([(a-z]{3,4}-([0-9]{2})\w$))/g.exec(input)) {
      course = /^(?<course>([(a-z]{3,4}-([0-9]{2})\w$))/g.exec(input);
    } else {
      throw new Error(
        "You need to specify the course when using the bot-commands channel."
      );
    }
  }
  let output = `Nothing is due in the next 24 hours for ${course}! Or no one has added any due dates yet. Be the hero! Add some with \`\`$add\`\`.`;
  sheets.spreadsheets.values
    .get({
      spreadsheetId: process.env.SHEET_ID,
      range: "A1:E",
    })
    .then((res) => {
      console.log("hello");
      if (!res.data.values) {
        if (msg) {
          msg.reply(output);
        } else if (channel) {
          channel.send(output);
        }
        return;
      }
      output = "";
      output += `Here are the assignments due in the next 24 hours for ${course}\n`;
      let weekFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
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
