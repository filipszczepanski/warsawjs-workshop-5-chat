'use strict';

const socketIo = require('socket.io');
const uuidV1 = require('uuid/v4');

const HttpServer = require('./HttpServer');
const WebSocketServer = require('./WebSocketServer');
const User = require('./User');
const CommandParser = require('./CommandParser');

class ChatServer {
  constructor() {
    this.users = [];
  }

  init() {
    const httpServer = new HttpServer();
    const webSocketServer = new WebSocketServer(httpServer);

    webSocketServer.run( socketio => {
      this.chat(socketio);
    });
  }

  chat(socketio) {

    socketio.on('connection', socket => {

      const clientID = socket.id;

      const setClientUser = (clientUser) => {
        socket.emit('setClientUser', clientUser);
      }

      const handleMessage = (message) => {
        socket.emit('message', message);
      }

      const handleCommandMessage = (message) => {
        socket.emit('commandMessage', message);
      }

      const handleErrorMessage = (error) => {
        socket.emit('errorMessage', `ERROR: ${error.message}`);
      }

      const handleBroadcastCommandMessage = (message) => {
        console.log(message);
        socket.broadcast.emit('broadcastMessage', message);
      }

      const handleBroadcastMessage = (message, userName) => {
        const broadcastMessage = `[${userName}]: ${message}`;
        socket.broadcast.emit('broadcastMessage', broadcastMessage);
      }

      // client info
      console.info(`Client (ID: ${socket.id}) is connected.`);

      // initiate state
      setClientUser({
        name: 'anonymous',
        hash: null,
      });

      handleMessage(`Welcome to Chat!!! (Available commands: /register, /login, /logout)`);

      //Events
      socket.on('clientMessage', ({clientMessage, clientUser}) => {

        this.parseMessage(clientMessage, clientID, clientUser, setClientUser, handleCommandMessage, handleErrorMessage, handleBroadcastCommandMessage);

        // handle user messageLine
        if (this.isUserLoggedIn(clientUser.hash)) {
          handleBroadcastMessage(clientMessage, clientUser.name);
        }

      });

      socket.once('disconnect', () => {
        const disconnectedUser = this.getUserByClientId(socket.id);
        if (disconnectedUser) {
          if (disconnectedUser.hash) {
            this.logOut(disconnectedUser.hash);
            socket.broadcast.emit('broadcastCommandMessage', `${disconnectedUser.name} is logged out!`);
          }
          console.log(`${disconnectedUser.name} is disconnected.`);
        } else {
          console.log(`Client (ID: ${socket.id}) is disconnected.`);
        }
      });

    });

  }

  parseMessage(clientMessage, clientID, clientUser, setClientUser, handleCommandMessage, handleErrorMessage, handleBroadcastCommandMessage) {

    const parsedCommands = CommandParser.parse(clientMessage);

    if (parsedCommands) {
      const { command, name, password } = parsedCommands;

      switch (command) {
        case 'register':
          this.registerUser(name, password, clientID).then( ({name}) => {
            const registerMsg = `${name} is registered!`;
            console.log(registerMsg);
            handleCommandMessage(registerMsg);
          }).catch( error => {
            handleErrorMessage(error);
          });
        break;

        case 'login':
          const loggedUser = this.loginUser(name, password, clientID);
          loggedUser.then( user => {
            setClientUser({
              name: user.name,
              hash: user.hash,
            });
            handleBroadcastCommandMessage(`${name} is logged in`);
            handleCommandMessage(`You are logged in`);
          }).catch(error => {
            handleErrorMessage(error);
          });

          break;

          case 'logout' :
            if (this.isUserLoggedIn(clientUser.hash)) {
              this.logOut(clientUser.hash);
              setClientUser({
                name: 'anonymous',
                hash: null,
              });
              handleCommandMessage(`You are logged out!`);
              handleBroadcastCommandMessage(`${clientUser.name} is logged out!`);
            } else {
              handleErrorMessage(`you were not logged in!`);
            }
          break;
        default:
          handleErrorMessage(new Error(`Command not exist`));
          break;
      }
    }

  }

  createToken() {
    return uuidV1();
  }

  registerUser(name, password, clientID) {
    return new Promise( (resolve, reject) => {
      if (!name) {
        throw new Error('No user name');
      }
      if (!password) {
        throw new Error('No password');
      }
      for (const usr of this.users) {
        if (usr.name === name) {
          throw new Error('User name exist');
        }
      }
      const user = new User(name, password, clientID);
      this.addNewUser(user)
      resolve(user);
    });
  }

  loginUser(name, password, clientID) {
    return new Promise((resolve, reject) => {
      for (let user of this.users) {
         if (user.name === name) {
           if (user.password !== password) {
             throw new Error('Wrong password!');
           }
           if (user.hash) {
             throw new Error('Allready logged!');
           }
           user.clientID = clientID;
           user.hash = this.createToken();
           return resolve(user);
         }
      }
      throw new Error(`User '${name}' does not exist!`);
    });
  }

  logOut(hash) {
    this.users = this.users.map( u => {
      if(hash && u.hash === hash) {
        u.hash = null;
      }
      return u;
    });
  }

  addNewUser(user) {
    this.users.push(user);
  }

  isUserExists(name) {
    return this.users.some( user => {
      return (name && user.name === name);
    });
  }

  isUserLoggedIn(hash) {
    return this.users.some( user => {
      return (hash && user.hash === hash);
    });
  }

  getUserByClientId(clientID) {
    for (const usr of this.users) {
      if ( usr.clientID === clientID) {
        return usr;
      }
    }
    return;
  }

}

const chatServer = new ChatServer();
chatServer.init();
