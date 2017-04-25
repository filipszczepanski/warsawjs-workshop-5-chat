const ioClient = require('socket.io-client');
const readline = require('readline');
const EOL = require('os').EOL;
const config = require('./config');
const URL = `${config.HOST}:${config.PORT}`;

class ChatClient {
  constructor() {
    this.clientUser = {
      name: 'anonymous',
      hash: null,
    };

    this.cli = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.socket = ioClient(URL);
  }

  init() {
    this.setPromtPrefix(this.clientUser.name);
    this.cli.prompt();
    this.cli.on('line', clientMessage => {
      this.cli.prompt(true);
      this.socket.emit('clientMessage', {
        clientMessage,
        clientUser: this.clientUser
      });
    })

    this.onSocketEmits();
  }

  onSocketEmits() {
    this.socket.on('message', message => {
      this.writeLine(message);
    });

    this.socket.on('commandMessage', message => {
      this.writeLine(message);
    });

    this.socket.on('errorMessage', message => {
      this.writeLine(message);
    });

    this.socket.on('broadcastMessage', message => {
      this.writeLine(message);
    });

    this.socket.on('setClientUser', newClientUser => {
      this.clientUser = newClientUser;
      this.setPromtPrefix(this.clientUser.name);
    });
  }

  setPromtPrefix(userName) {
    this.cli.setPrompt(`(${userName}) > `);
  }

  writeLine(messageLine) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(messageLine + EOL);
    this.cli.prompt(true);
  }
}

const chatClient = new ChatClient();
chatClient.init();
