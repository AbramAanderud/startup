// peerProxy.js
const { WebSocketServer } = require('ws');

function peerProxy(httpServer) {
  // Create a WebSocket server attached to the HTTP server.
  const socketServer = new WebSocketServer({ server: httpServer });

  socketServer.on('connection', (socket) => {
    socket.isAlive = true;

    // When a message arrives, broadcast it (except back to the sender).
    socket.on('message', (data) => {
      socketServer.clients.forEach((client) => {
        if (client !== socket && client.readyState === client.OPEN) {
          client.send(data);
        }
      });
    });

    // Mark socket as alive upon receiving pong.
    socket.on('pong', () => {
      socket.isAlive = true;
    });
  });

  // Periodic ping to check health of clients.
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
