module.exports = new Map([
  ["course", /^(?<course>([(a-z]{3,4}-([0-9]{2})\w$))/],
  ["command", /^\$(?<command>\w+)/],
  ["token", /(?<token>\w+)/g],
  ["time", /((?<hour>\d{1,2})(:(?<minute>\d{2}))*(?<timeSuffix>[a-z]{2})*)*/],
  [
    "dueDate",
    /^(?<note>(\w( )*)+) on (?<date>\S+)( at ((?<hour>\d{1,2})(:(?<minute>\d{2}))*(?<timeSuffix>[a-z]{2})*))*( for (?<course>([(a-z]{3,4}-([0-9]{2})\w$)))*$/,
  ],
  [
    "reminder",
    /^(?<date>\S+)( at ((?<hour>\d{1,2})(:(?<minute>\d{2}))*(?<timeSuffix>[a-z]{2})*))*( for (?<course>([(a-z]{3,4}-([0-9]{2})\w$)))*$/,
  ],
]);
