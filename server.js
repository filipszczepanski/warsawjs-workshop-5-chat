'use strict';

const http = require('http');
const io = require('socket.io');

const uuidV1 = require('uuid/v1');


class HttpServer {
  constructor(http, port = 3001) {
    this.http = http;
    this.port = port;
    this.server = this.createHttpServer();
  }
  createHttpServer() {
    return new Promise((resolve, reject) => {
        var server = this.http.createServer();
        server.on('listening', () => resolve(server));
        server.on('error', (error)=> {
          console.log(reject);
        });
        server.listen(this.port);
    });
  }
}

class ChatServer {
  constructor(http, io) {
    this.http = http;
    this.io = io;
    this.users = [];
  }
  createServer() {
    const httpServer = new HttpServer(http, 3001);
    return httpServer.server;
  }
  runServer() {
    var createServer = this.createServer();
    createServer.then((server) => {
      console.log('Server started!');
      var socketio = io(server);
      socketio.on('connection', socket => {

        // client info
        console.log(`Client (ID: ${socket.id}) is connected.`);

        //connection emit
        socket.emit('hello', `Welcome!!!`);

        //Events
        socket.on('messageLine', ({messageLine, userName, hash}) => {

          let serverMessage;

          if (messageLine.length > 0 && messageLine[0] === '/') {
            const commandLine = messageLine.slice(1)
            const args = commandLine.split(' ');
            const [ command, ...rest ] = args;

            var name = rest[0];
            var password = rest[1];

            let commandResultMessage;


            switch (command) {
              case 'register':
                const reg = this.registerUser(name, password);
                if (reg) {
                  commandResultMessage = `${name} is registered!`;
                } else {
                  commandResultMessage = `${name} user exist!`;
                }

              break;

              case 'login':
                hash = this.loginUser(name, password);
                if (hash) {
                  socket.emit('logedin', {
                    name: name,
                    hash: hash,
                  });
                  commandResultMessage = `You are logged in`;
                  serverMessage = `${name} is logged in`;

                } else {
                  commandResultMessage = `ERROR: '${name}' is not logged in!!! You should register user.`;
                }
                break;

                case 'logout' :
                  if (this.isUserLogged(hash)) {
                    this.logOut(hash);
                    commandResultMessage = `You are logged out!`;
                  } else {
                    commandResultMessage = `ERROR: you were not logged in!!!`;
                  }
                  serverMessage = `${userName} is logged out!`;
                break;
              default:
                commandResultMessage = `command not exist`;
            }

            socket.emit('commandResultMessage', commandResultMessage);
          }
          if (serverMessage) {
            console.log(serverMessage);
            return socket.broadcast.emit('serverMessage', serverMessage);
          }

          if (this.isUserLogged(hash)) {
            socket.broadcast.emit('message', {userName, messageLine});
          }

        });
      });
    }).catch((error) => {
        console.log('error: ', error);
    });
  }

  createToken() {
    return uuidV1()
  }

  loginUser(name, password) {
    for (const user of this.users) {
       if (user.name === name && user.password === password) {
         if (user.hash === null) {
           user.hash = this.createToken();
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

  isUserExists(name) {
    return this.users.some( u => {
      return (name && u.name === name);
    });
  }

  isUserLogged(hash) {
    return hash && this.users.some( u => {
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
