import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { RoomManager } from './RoomManager.js';
import { setupSocketHandlers } from './SocketHandlers.js';
import { MemoryRoomStore } from './store/MemoryRoomStore.js';
import { RedisRoomStore } from './store/RedisRoomStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      'https://dudodice.com',
      'https://www.dudodice.com',
      ...(process.env.RENDER_EXTERNAL_URL ? [process.env.RENDER_EXTERNAL_URL] : []),
      ...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : []),
    ]
  : '*' as const;

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

// --- Redis adapter (env-gated) ---
// Requires: npm install ioredis @socket.io/redis-adapter
// Only activated when REDIS_URL is set AND packages are installed.
if (process.env.REDIS_URL) {
  try {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const adapterMod: any = await import('@socket.io/redis-adapter' as any);
    const redisMod: any = await import('ioredis' as any);
    const Redis = redisMod.default ?? redisMod;
    const pubClient = new Redis(process.env.REDIS_URL);
    const subClient = pubClient.duplicate();
    io.adapter(adapterMod.createAdapter(pubClient, subClient));
    /* eslint-enable @typescript-eslint/no-explicit-any */
    console.log('✅ Socket.io Redis adapter enabled');
  } catch (err) {
    console.warn('⚠️  Redis adapter packages not installed, falling back to in-memory:', (err as Error).message);
  }
}

// --- Room store (Redis-backed when REDIS_URL set) ---
const store = process.env.REDIS_URL ? new RedisRoomStore() : new MemoryRoomStore();
const roomManager = new RoomManager(store);

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
app.get('/api/health', async (_req, res) => {
  const rooms = await roomManager.getPublicRooms();
  res.json({ status: 'ok', rooms: rooms.length });
});

const PORT = parseInt(process.env.PORT || '3001', 10);
httpServer.listen(PORT, () => {
  console.log(`🎲 Dudo Dice server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await roomManager.destroy();
  httpServer.close();
});
