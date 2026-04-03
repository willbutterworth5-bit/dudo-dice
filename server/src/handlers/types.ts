import type { Server, Socket } from 'socket.io';
import type { RoomManager } from '../RoomManager.js';

export interface SocketContext {
  io: Server;
  socket: Socket;
  roomManager: RoomManager;
  /** Mutable ref to the player ID bound to this socket connection. */
  boundPlayerId: { value: string | null };
  /** Returns false if the attempt is allowed, true if rate-limited (and emits error). */
  rejectRateLimited: (bucket: string) => boolean;
}
