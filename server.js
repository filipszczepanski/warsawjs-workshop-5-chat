'use strict';

const http = require('http');
const io = require('socket.io');

const uuidV1 = require('uuid/v1');


class ChatServer {
  constructor(http, io) {
    this.http = http;
    this.io = io;
    this.users = [];
  }
  createServer() {
      return new Promise((resolve, reject) => {
          var server = this.http.createServer();
          server.on('listening', () => resolve(server));
          server.on('error', (error)=> {
            console.log(reject);
          });
          server.listen(3001);
      });
  }
  runServer() {
    var createServer = this.createServer();
    createServer.then((server) => {
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
                  const reg = this.registerUser(name, password);

                  let registerResult;
                  if (reg) {
                    registerResult = `${name} is registered!`;
                  } else {
                    registerResult = `${name} user exist!`;
                  }
                  socket.emit('registerResult', registerResult);
                break;

                case 'login':
                  hash = this.loginUser(name, password);
                  socket.emit('logedin', {
                    name: name,
                    hash: hash,
                  });

                  if (hash) {
                    socket.broadcast.emit('message', {
                      userName: name,
                      messageLine: `is logged in`,
                     });
                  }
                  break;

                  case 'logout' :
                    this.logOut(hash);
                    socket.emit('logoutResult', 'You are logged out');
                  break;
                default:
              }
            }

            if (this.isUserExists(hash)) {
              socket.broadcast.emit('message', {userName, messageLine});
            }
          });
        });
    }).catch((error) => {
        console.log('error: ', error);
    });
  }

  loginUser(name, password) {
    for (const user of this.users) {
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

  registerUser(name, password) {
    for (const usr of this.users) {
      if (usr.name === name) {
        return false;
      }
    }
    const user = new User(name, password);
    this.users.push(user);
    return true;
  }

  isUserExists(hash) {
    return this.users.some( u => {
      return (hash && u.hash === hash);
    });
  }

  logOut(hash) {
    return this.users = this.users.filter( u => {
      return u.hash !== hash;
    });
  }

}

const chatServer = new ChatServer(http, io);
chatServer.runServer();

class User {
  constructor(name, password) {
    this.name = name;
    this.password = password;
    this.hash = null;
  }
}
