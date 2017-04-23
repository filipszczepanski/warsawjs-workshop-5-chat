var io = require('socket.io-client');
var readline = require('readline');
var socket = io('http://localhost:3001');
var os = require('os');

var user = {name:'anonymous', hash:null};

socket.on('hello', message => {
  writeLine(message);
});

socket.on('message', ({userName, messageLine}) => {
  const usrMsg = `${userName}: ${messageLine}`;
  writeLine(usrMsg);
});

socket.on('commandResultMessage', message => {
  writeLine(message);
});

socket.on('serverMessage', message => {
  writeLine(message);
});

socket.on('logedin', ({name, hash}) => {
  user.name = name;
  user.hash = hash;
});

function writeLine(messageLine) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(messageLine + os.EOL);
  cli.prompt(true);
}

var cli = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

cli.setPrompt(`> `);
cli.prompt();

cli.on('line', messageLine => {
  writeLine(messageLine);
  socket.emit('messageLine', {messageLine, userName: user.name, hash: user.hash});
})
