import { randomInt } from 'node:crypto';
import { Room, RoomSettings } from './Room.js';
import type { RoomStore } from './store/RoomStore.js';
import { MemoryRoomStore } from './store/MemoryRoomStore.js';

const ROOM_CLEANUP_INTERVAL_MS = 60_000; // Check for stale rooms every minute
const STALE_ROOM_AGE_MS = 30 * 60_000;   // 30 minutes with no connected players

export class RoomManager {
  private store: RoomStore;
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(store?: RoomStore) {
    this.store = store ?? new MemoryRoomStore();
    this.cleanupInterval = setInterval(() => this.cleanupStaleRooms(), ROOM_CLEANUP_INTERVAL_MS);
  }

  async createRoom(settings: RoomSettings, isPublic: boolean): Promise<Room> {
    const code = await this.generateCode();
    const room = new Room(code, settings, isPublic);
    await this.store.set(code, room);
    return room;
  }

  async getRoom(code: string): Promise<Room | undefined> {
    return this.store.get(code.toUpperCase());
  }

  async getRoomByPlayer(sessionId: string): Promise<Room | undefined> {
    for (const room of await this.store.values()) {
      if (room.players.find(p => p.id === sessionId)) {
        return room;
      }
    }
    return undefined;
  }

  async findRoomByReconnectToken(reconnectToken: string): Promise<{ room: Room; playerId: string } | undefined> {
    for (const room of await this.store.values()) {
      const player = room.getPlayerByReconnectToken(reconnectToken);
      if (player) {
        return { room, playerId: player.id };
      }
    }
    return undefined;
  }

  async getPublicRooms(): Promise<Array<{
    code: string;
    playerCount: number;
    maxPlayers: number;
    settings: RoomSettings;
    hostName: string;
    hostPersistentId?: string;
  }>> {
    const result = [];
    for (const room of await this.store.values()) {
      if (room.isPublic && room.phase === 'waiting' && room.players.length < room.settings.maxPlayers) {
        const host = room.players.find(p => p.id === room.hostId);
        result.push({
          code: room.code,
          playerCount: room.players.length,
          maxPlayers: room.settings.maxPlayers,
          settings: room.settings,
          hostName: host?.name ?? 'Unknown',
          hostPersistentId: host?.persistentId,
        });
      }
    }
    return result;
  }

  async findQuickMatchRoom(): Promise<Room | undefined> {
    let best: Room | undefined;
    for (const room of await this.store.values()) {
      if (room.isPublic && room.phase === 'waiting' && room.players.length < room.settings.maxPlayers) {
        if (!best || room.players.length > best.players.length) {
          best = room;
        }
      }
    }
    return best;
  }

  async removeRoom(code: string): Promise<void> {
    const room = await this.store.get(code);
    if (room) {
      room.cleanup();
      await this.store.delete(code);
    }
  }

  private async generateCode(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // No I or O (confusing with 1/0)
    let code: string;
    do {
      code = '';
      for (let i = 0; i < 4; i++) {
        code += chars[randomInt(chars.length)];
      }
    } while (await this.store.has(code));
    return code;
  }

  private async cleanupStaleRooms(): Promise<void> {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const room of await this.store.values()) {
      if (room.phase === 'finished') {
        room.cleanup();
        toDelete.push(room.code);
        continue;
      }

      const allDisconnected = room.players.every(p => !p.isConnected);
      if (allDisconnected && room.players.length > 0) {
        const oldestDisconnect = Math.min(
          ...room.players.map(p => p.disconnectedAt ?? now)
        );
        if (now - oldestDisconnect > STALE_ROOM_AGE_MS) {
          room.cleanup();
          toDelete.push(room.code);
        }
      }

      if (room.phase === 'waiting' && room.players.length === 0) {
        room.cleanup();
        toDelete.push(room.code);
      }
    }

    for (const code of toDelete) {
      await this.store.delete(code);
    }
  }

  async destroy(): Promise<void> {
    clearInterval(this.cleanupInterval);
    for (const room of await this.store.values()) {
      room.cleanup();
    }
  }
}
