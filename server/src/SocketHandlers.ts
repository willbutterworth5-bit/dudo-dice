import { Server, Socket } from 'socket.io';
import type { SupabaseClient } from '@supabase/supabase-js';
import { RoomManager } from './RoomManager.js';
import { RatingStore } from './RatingStore.js';
import type { SocketContext } from './handlers/types.js';
import { registerSessionHandlers } from './handlers/SessionHandlers.js';
import { registerLobbyHandlers } from './handlers/LobbyHandlers.js';
import { registerGameHandlers } from './handlers/GameHandlers.js';

const SECURITY_WINDOW_MS = 10_000;
const MAX_SECURITY_ATTEMPTS = 12;

function createRateLimiter() {
  const attempts = new Map<string, number[]>();

  return (key: string): boolean => {
    const now = Date.now();
    const recent = (attempts.get(key) ?? []).filter((timestamp) => now - timestamp < SECURITY_WINDOW_MS);
    recent.push(now);
    attempts.set(key, recent);
    return recent.length <= MAX_SECURITY_ATTEMPTS;
  };
}

export function setupSocketHandlers(io: Server, roomManager: RoomManager, ratingStore: RatingStore, supabase: SupabaseClient | null = null): void {
  io.on('connection', (socket: Socket) => {
    const allowAttempt = createRateLimiter();

    const ctx: SocketContext = {
      io,
      socket,
      roomManager,
      ratingStore,
      supabase,
      boundPlayerId: { value: null },
      rejectRateLimited: (bucket: string): boolean => {
        if (allowAttempt(bucket)) return false;
        socket.emit('error', { message: 'Too many multiplayer attempts. Please wait a moment.' });
        return true;
      },
    };

    registerSessionHandlers(ctx);
    registerLobbyHandlers(ctx);
    registerGameHandlers(ctx);
  });
}
