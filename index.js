console.log("🚀 Starting both scheduler and server...");

require('./scheduler');

const app = require('./server');
const net = require('net');
const PORT = process.env.PORT;

const server = net.createServer();
server.once('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use!`);
    process.exit(1);
  }
});

server.once('listening', () => {
  server.close();
  app.listen(PORT, () => {
    console.log(`🌐 Web service is listening on port ${PORT}`);
  });
});

server.listen(PORT);
