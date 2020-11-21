module.exports = class Command {
  constructor() {
    this.about = "";
    this.params = [];
    this.execute = async () => {};
  }
};
