'use strict';

var http = require('http');
var io = require('socket.io');

const uuidV1 = require('uuid/v1');

var users = [];


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
      socket.on('messageLine', ({messageLine, userName, hash}) => {

        if (messageLine.length > 0 && messageLine[0] === '/') {
          const commandLine = messageLine.slice(1)
          const args = commandLine.split(' ');
          const [ command, ...rest ] = args;

          var name = rest[0];
          var password = rest[1];

          switch (command) {
            case 'register':
              const reg = registerUser(name, password);

              let registerResult;
              if (reg) {
                registerResult = `${name} is registered!`;
              } else {
                registerResult = `${name} user exist!`;
              }
              socket.emit('registerResult', registerResult);

              break;
            case 'login':
              socket.emit('logedin', {
                name: name,
                hash: loginUser(name, password),
              });

              if (loginUser(name, password)) {
                socket.broadcast.emit('message', {
                  name,
                  messageLine:`${name} is logged in`,
                 });
              }
              break;
              case 'logout' :
                logOut(hash);
                socket.emit('logoutResult', 'You are logged out');
              break;
            default:
          }
        }

        if (isUserExists(hash)) {
          socket.broadcast.emit('message', {userName, messageLine});
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
       }
       return user.hash;
     }
  }
  return null;
}

function registerUser(name, password) {
  for (const usr of users) {
    if (usr.name === name) {
      return false;
    }
  }
  const user = new User(name, password);
  users.push(user);
  return true;
}

function isUserExists(hash) {
  return users.some( u => {
    return (hash && u.hash === hash);
  });
}

function logOut(hash) {
    return users = users.filter( u => {
      return u.hash !== hash;
    });
}

class User {
  constructor(name, password) {
    this.name = name;
    this.password = password;
    this.hash = null;
  }
}
