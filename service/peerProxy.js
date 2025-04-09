// peerProxy.js
const { WebSocketServer } = require('ws');

function peerProxy(httpServer) {
  // Create a WebSocket server attached to your HTTP server
  const socketServer = new WebSocketServer({ server: httpServer });

  socketServer.on('connection', (socket) => {
    socket.isAlive = true;

    // When a message is received from a client, broadcast it to everyone except the sender.
    socket.on('message', (data) => {
      // You can choose to parse the JSON here if needed:
      // const message = JSON.parse(data.toString());
      socketServer.clients.forEach((client) => {
        if (client !== socket && client.readyState === client.OPEN) {
          client.send(data);
        }
      });
    });

    // Update connection status on pong
    socket.on('pong', () => {
      socket.isAlive = true;
    });
  });

  // Periodically check that clients are still alive
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
