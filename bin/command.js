module.exports = class Command {
  constructor() {
    this.about = "";
    this.help = "";
    this.params = [];
    this.execute = () => {};
  }
};
