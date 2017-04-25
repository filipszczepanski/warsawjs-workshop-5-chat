'use strict';

const socketIo = require('socket.io');

class WebSocketServer {
  constructor(httpServer) {
    this.httpServer = httpServer;
  }
  run(chatServer) {
    const server = this.httpServer.server;
    server.then( server => {
      const socketio = socketIo(server);
      chatServer(socketio);
    }).catch( error => {
        console.log(error);
    });
  }
}

module.exports = WebSocketServer;
