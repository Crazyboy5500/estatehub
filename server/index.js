const http = require('http');
const { Server } = require('socket.io');

const config = require('./config');
const connectDB = require('./config/db');
const setupSockets = require('./sockets');
const app = require('./app');

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: [config.clientURL, 'http://localhost:5173', 'http://localhost:3000'], credentials: true },
});
app.set('io', io);
setupSockets(io);

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

connectDB().then(() => {
  server.listen(config.port,'0.0.0.0', () => {
    console.log(`EstateHub API running on http://localhost:${config.port}`);
  });
});

module.exports = { app, server };
