module.exports = new Map([
  [
    "courseName",
    'What **course** is this for?\nRespond in the same format as the course channels, like **$math-200** for example.\nYou need to start the message with "$" for the bot to see it.\nType $cancel to escape.',
  ],
  [
    "date",
    'What **day**?\nRespond in the format **$YYYY-MM-DD**.\nYou need to start the message with "$" for the bot to see it.\nType $cancel to escape.',
  ],
  [
    "time",
    'What **time** do you want on that day?\nRespond in the format **$HH:MM** for 24 hour format, or **$HH:MMam/pm** for 12 hour format.\nYou need to start the message with "$" for the bot to see it.\nType $cancel to escape.',
  ],
  [
    "memo",
    'What is the **memo** for the due date?\nMake it something helpful like the name of an assignment or test.\nYou need to start the message with "$" for the bot to see it.\nType $cancel to escape.',
  ],
]);
