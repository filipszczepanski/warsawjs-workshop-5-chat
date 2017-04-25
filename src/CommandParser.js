'use strict';

class CommandParser {
  static parse(message) {
    if (message && message[0] === '/') {
      const commandLine = message.slice(1);
      const args = commandLine.split(' ');
      const [ command, ...restArgs ] = args;
      const name = restArgs[0];
      const password = restArgs[1];
      return {command, name, password}
    }
    return;
  }
}

module.exports = CommandParser;
