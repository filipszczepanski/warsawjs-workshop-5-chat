'use strict';
const http = require('http');
const config = require('./config');
const url = `${config.HOST}:${config.PORT}`;

class HttpServer {
  constructor() {
    this.server = this.createHttpServer();
  }
  createHttpServer() {
    return new Promise((resolve, reject) => {
        var server = http.createServer();
        server.on('listening', () => {
          console.info(`Server started... (${url})`);
          resolve(server);
        });
        server.on('error', (error)=> {
          console.log(reject);
        });
        server.listen(config.PORT);
    });
  }
}

module.exports = HttpServer;
