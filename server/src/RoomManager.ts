import { Room, RoomSettings } from './Room.js';

const ROOM_CLEANUP_INTERVAL_MS = 60_000; // Check for stale rooms every minute
const STALE_ROOM_AGE_MS = 30 * 60_000;   // 30 minutes with no connected players

export class RoomManager {
  private rooms = new Map<string, Room>();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanupStaleRooms(), ROOM_CLEANUP_INTERVAL_MS);
  }

  createRoom(hostId: string, settings: RoomSettings, isPublic: boolean): Room {
    const code = this.generateCode();
    const room = new Room(code, hostId, settings, isPublic);
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  getRoomByPlayer(sessionId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.find(p => p.id === sessionId)) {
        return room;
      }
    }
    return undefined;
  }

  getPublicRooms(): Array<{
    code: string;
    playerCount: number;
    maxPlayers: number;
    settings: RoomSettings;
    hostName: string;
  }> {
    const result = [];
    for (const room of this.rooms.values()) {
      if (room.isPublic && room.phase === 'waiting' && room.players.length < room.settings.maxPlayers) {
        const host = room.players.find(p => p.id === room.hostId);
        result.push({
          code: room.code,
          playerCount: room.players.length,
          maxPlayers: room.settings.maxPlayers,
          settings: room.settings,
          hostName: host?.name ?? 'Unknown',
        });
      }
    }
    return result;
  }

  findQuickMatchRoom(): Room | undefined {
    // Find an open public room with the most players (closer to starting)
    let best: Room | undefined;
    for (const room of this.rooms.values()) {
      if (room.isPublic && room.phase === 'waiting' && room.players.length < room.settings.maxPlayers) {
        if (!best || room.players.length > best.players.length) {
          best = room;
        }
      }
    }
    return best;
  }

  removeRoom(code: string): void {
    const room = this.rooms.get(code);
    if (room) {
      room.cleanup();
      this.rooms.delete(code);
    }
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // No I or O (confusing with 1/0)
    let code: string;
    do {
      code = '';
      for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
    } while (this.rooms.has(code));
    return code;
  }

  private cleanupStaleRooms(): void {
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      // Remove finished rooms after they've been sitting
      if (room.phase === 'finished') {
        room.cleanup();
        this.rooms.delete(code);
        continue;
      }

      // Remove rooms where all players disconnected long ago
      const allDisconnected = room.players.every(p => !p.isConnected);
      if (allDisconnected && room.players.length > 0) {
        const oldestDisconnect = Math.min(
          ...room.players.map(p => p.disconnectedAt ?? now)
        );
        if (now - oldestDisconnect > STALE_ROOM_AGE_MS) {
          room.cleanup();
          this.rooms.delete(code);
        }
      }

      // Remove empty waiting rooms after 5 minutes
      if (room.phase === 'waiting' && room.players.length === 0) {
        room.cleanup();
        this.rooms.delete(code);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    for (const room of this.rooms.values()) {
      room.cleanup();
    }
    this.rooms.clear();
  }
}
