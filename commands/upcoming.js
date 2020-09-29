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
  if (!course) course = msg.channel.name;
  let output = `No due dates have been added for ${course}. Want to add some? Use \`\`$add\`\`.`;
  sheets.spreadsheets.values
    .get({
      spreadsheetId: process.env.SHEET_ID,
      range: "A1:E",
    })
    .then((res) => {
      if (!res.data.values) return;
      output = "";
      output += `Here are the assignments due in the next 7 days for ${course}\n`;
      let weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      let assignments = res.data.values.filter(
        (row) =>
          row[0] > Date.now() && row[0] < weekFromNow && row[3] == "assignment"
      );
      for (let row of assignments) {
        output += `${row[4]} is due ${new Date(Number(row[0]))}\n`;
      }
      console.log(output);
      if (msg) msg.reply(output);
      else if (channel) channel.send(output);
    });

  return;
};
