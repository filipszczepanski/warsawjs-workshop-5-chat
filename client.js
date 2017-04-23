var io = require('socket.io-client');
var readline = require('readline');
var socket = io('http://localhost:3001');
var os = require('os');

var user = {name:'anonymous', hash:null};

socket.emit('userName', 'Filip Client');

socket.on('hello', message => {
  writeLine(message);
});

socket.on('message', msg => {
  writeLine(msg);
});

socket.on('logedin', ({name, hash}) => {
  user.name = name;
  user.hash = hash;
  writeLine(`You are loged in!`);
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
  socket.emit('messageLine', {messageLine, hash: user.hash});
})
