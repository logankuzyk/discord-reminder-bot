const regex = require("regex");

paramGetter = async (user, tokens) => {
  let nextParam = user.nextParam;
  let givenParams = user.givenParams;
  let remainingParams = user.remainingParams;

  console.log(`Remaining: ${remainingParams}`);
  console.log(`Given: ${givenParams}`);
  console.log(`Looking for ${nextParam}`);

  let param = checks.get(nextParam)(tokens);
  if (param) {
    console.log(`Found ${nextParam}, ${param}`);
    remainingParams = remainingParams.splice(
      remainingParams.indexOf(nextParam),
      1
    );
    givenParams[nextParam] = param;
    nextParam = remainingParams[0];
    return {
      nextParam: nextParam,
      givenParams: givenParams,
      remainingParams: remainingParams,
    };
  } else {
    console.log(`Did not find ${param}, will prompt again`);
  }
};

const checks = new Map([
  [
    "courseName",
    (tokens) => {
      let output = tokens.filter(
        (token) => regex.get("course").exec(token) !== null
      );
      if (output.length > 0) {
        return output[0];
      } else {
        return null;
      }
    },
  ],
  [
    "date",
    (tokens) => {
      tokens = tokens.filter((token) => regex.get("date").exec(token));
      let output = tokens.filter((token) => new Date(token) != "Invalid Date");
      if (output.length > 0) {
        return output[0];
      } else {
        return null;
      }
    },
  ],
  [
    "time",
    (tokens) => {
      let output = tokens.filter(
        (token) => regex.get("time").exec(token) !== null
      );
      if (output.length > 0) {
        let time = regex.get("time").exec(time).groups;
        return time;
      } else {
        return null;
      }
    },
  ],
  [
    "memo",
    (tokens) => {
      return "need to figure out how to validate memos";
    },
  ],
]);

module.exports = paramGetter;
