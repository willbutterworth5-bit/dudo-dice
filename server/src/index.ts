import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { RoomManager } from './RoomManager.js';
import { setupSocketHandlers } from './SocketHandlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      'https://dudodice.com',
      'https://www.dudodice.com',
      ...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : []),
    ]
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:59033'];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

const roomManager = new RoomManager();

// Setup socket handlers
setupSocketHandlers(io, roomManager);

// In production, serve the frontend build
if (process.env.NODE_ENV === 'production') {
  const frontendPath = join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));

  // SPA fallback
  app.get('*', (_req, res) => {
    res.sendFile(join(frontendPath, 'index.html'));
  });
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', rooms: roomManager.getPublicRooms().length });
});

const PORT = parseInt(process.env.PORT || '3001', 10);
httpServer.listen(PORT, () => {
  console.log(`🎲 Dudo Dice server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  roomManager.destroy();
  httpServer.close();
});
