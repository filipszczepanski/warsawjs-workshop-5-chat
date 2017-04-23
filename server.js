'use strict';

var http = require('http');
var io = require('socket.io');

const uuidV1 = require('uuid/v1');

var users = [];
var sessions = [];


function createServer() {
    return new Promise((resolve, reject) => {
        var server = http.createServer();

        server.on('listening', () => resolve(server));
        server.on('error', reject);
        server.listen(3001);
    });
}

createServer().then((server) => {
    console.log('Server started!');
    var socketio = io(server);
    socketio.on('connection', socket => {

      // client info
      console.log(`new userID: ${socket.id}`);

      //connection emit
      socket.emit('hello', `Welcome!!!`);

      //Events
      socket.on('userName', userName => {
        console.log(`${userName} is connected`);
        socket.broadcast.emit(`message`, `${userName} is connected`);
      });


      socket.on('messageLine', ({messageLine, hash}) => {

        if (messageLine.length > 0 && messageLine[0] === '/') {
          const commandLine = messageLine.slice(1)
          const args = commandLine.split(' ');
          const [ command, ...rest ] = args;

          if (rest.length < 2) {
            console.log(`wrong params`);
            //TODO: to client emit
            // socket.emit('error', )
            return;
          }

          var name = rest[0];
          var password = rest[1];

          switch (command) {
            case 'register':
              registerUser(name, password);
              break;
            case 'login':

              socket.emit('logedin', {
                name: name,
                hash: loginUser(name, password),
              });
              
              if (loginUser(name, password)){
                socket.broadcast.emit(`message`, `${name} is connected`);
              }

              break;
            default:
          }
        }

        if (sessions.indexOf(hash) !== -1) {
          socket.broadcast.emit(`message`, messageLine);
        }

      });

    });
}).catch((error) => {
    console.log('error: ', error);
});



function loginUser(name, password) {
  for (const user of users) {
     if (user.name === name && user.password === password) {
       if (user.hash === null) {
         const hash = uuidV1();
         user.hash = hash;
         sessions.push(hash);
       } else {
         console.log('logdedin x');
       }
       return user.hash;
     }
  }
  return null;
}

function registerUser(name, password) {
  for (const usr of users) {
    if (usr.name === name) {
      return console.log('user exist, change your name');
    }
  }
  const user = new User(name, password);
  users.push(user);
}

class User {
  constructor(name, password) {
    this.name = name;
    this.password = password;
    this.hash = null;
  }
}
