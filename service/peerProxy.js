// peerProxy.js
const { WebSocketServer } = require('ws');

function peerProxy(httpServer) {
  const socketServer = new WebSocketServer({ server: httpServer });

  socketServer.on('connection', (socket) => {
    socket.isAlive = true;
    
    socket.on('message', (data) => {
        socketServer.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(data);
          }
        });
    });
      
    
    socket.on('pong', () => {
      socket.isAlive = true;
    });
  });

  // Ping clients periodically to ensure they’re alive
  const interval = setInterval(() => {
    socketServer.clients.forEach((client) => {
      if (client.isAlive === false) return client.terminate();
      client.isAlive = false;
      client.ping();
    });
  }, 10000);

  socketServer.on('close', () => {
    clearInterval(interval);
  });
}

module.exports = { peerProxy };
