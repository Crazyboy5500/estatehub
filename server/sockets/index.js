const jwt = require('jsonwebtoken');
const config = require('../config');

const setupSockets = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, config.jwt.secret);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
    socket.emit('connected', { userId: socket.userId });

    socket.on('message:read', async ({ conversationId }) => {
      socket.to(`user:${socket.userId}`).emit('message:read', { conversationId });
    });

    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`user:${socket.userId}`).emit('typing', { conversationId, isTyping });
    });

    socket.on('disconnect', () => {
      socket.leave(`user:${socket.userId}`);
    });
  });
};

module.exports = setupSockets;
