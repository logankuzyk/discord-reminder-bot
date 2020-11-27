const regex = require("./regex");
const prompts = require("./prompts");
const paramGetter = require("./paramGetter");

module.exports = class Command {
  constructor(params, onParamFulfilment, embedTitle, about, commandName) {
    this.params = params;
    this.onParamFulfilment = onParamFulfilment;
    this.embedTitle = embedTitle;
    this.about = about;
    this.name = commandName;
  }

  execute = async (user, tokens) => {
    let nextParam;
    let givenParams = {};
    let remainingParams = [];
    let ongoingCommand = null;
    let body;
    let paramReadSuccess;
    if (user && user.ongoingCommand != "null") {
      ongoingCommand = user.ongoingCommand;
      let newParams = await paramGetter(user, tokens);
      if (newParams) {
        nextParam = newParams.nextParam;
        givenParams = newParams.givenParams;
        remainingParams = newParams.remainingParams;
        paramReadSuccess = true;
        body = prompts.get(nextParam);
      } else {
        nextParam = user.nextParam;
        givenParams = user.givenParams;
        remainingParams = user.remainingParams;
        paramReadSuccess = false;
      }
    } else {
      // Entry point of command, user has not interacted with bot before.
      paramReadSuccess = true;
      remainingParams = new Array(...this.params);
      let courseName = tokens.filter(
        (token) => regex.get("course").exec(token) !== null
      )[0];
      if (courseName) {
        givenParams.courseName = courseName;
        remainingParams.splice(remainingParams.indexOf("courseName"), 1);
      }
      nextParam = remainingParams[0];
    }
    if (paramReadSuccess) {
      body = prompts.get(nextParam);
    } else {
      body =
        "I wasn't able to read that, please try again.\n\n" +
        prompts.get(nextParam);
    }
    if (nextParam) {
      return {
        embed: { title: this.embedTitle, description: body },
        complete: false,
        givenParams: JSON.stringify(givenParams),
        remainingParams: remainingParams,
        nextParam: nextParam,
        task: undefined,
      };
    } else {
      return this.onParamFulfilment(givenParams);
    }
  };
};
