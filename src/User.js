class User {
  constructor(name, password, clientID) {
    this.name = name;
    this.password = password;
    this.clientID = clientID;
    this.hash = null;
  }
}
module.exports = User;
