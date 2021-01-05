module.exports = new Map([
  [
    "course",
    /^(?<course>([a-z]{3,4}(-([0-9]{3})(-linear-squircuits)*[a-z]*)+))$/,
  ],
  ["command", /^\$(?<command>\w+)/],
  ["token", /\$*(?<token>\S+)/g],
  ["time", /^(?<hour>\d{1,2})(:(?<minute>\d{2}))*(?<timeSuffix>[a-z]{2})*/],
  ["date", /^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/],
]);
