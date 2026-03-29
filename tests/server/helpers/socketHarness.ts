import { createServer } from 'node:http';
import express from 'express';
import { Server } from 'socket.io';
import { io as ioClient, Socket } from 'socket.io-client';
import { RoomManager } from '../../../server/src/RoomManager.ts';
import { setupSocketHandlers } from '../../../server/src/SocketHandlers.ts';

export type Harness = {
  baseUrl: string;
  io: Server;
  roomManager: RoomManager;
  close: () => Promise<void>;
};

export async function createHarness(): Promise<Harness> {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });
  const roomManager = new RoomManager();

  setupSocketHandlers(io, roomManager);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', rooms: roomManager.getPublicRooms().length });
  });

  await new Promise<void>((resolve) => {
    httpServer.listen(0, '127.0.0.1', () => resolve());
  });

  const address = httpServer.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind socket harness');
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    io,
    roomManager,
    close: async () => {
      roomManager.destroy();
      io.close();
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    },
  };
}

export function createClient(baseUrl: string): Socket {
  return ioClient(baseUrl, {
    transports: ['websocket'],
  });
}

export function waitForEvent<T>(socket: Socket, event: string, timeout = 4_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${event}`)), timeout);
    socket.once(event, (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

export function waitForNoEvent(socket: Socket, event: string, timeout = 500): Promise<void> {
  return new Promise((resolve, reject) => {
    const listener = () => {
      clearTimeout(timer);
      reject(new Error(`Unexpected ${event}`));
    };

    const timer = setTimeout(() => {
      socket.off(event, listener);
      resolve();
    }, timeout);

    socket.once(event, listener);
  });
}
