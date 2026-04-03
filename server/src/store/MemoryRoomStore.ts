import type { Room } from '../Room.js';
import type { RoomStore } from './RoomStore.js';

/**
 * In-process Map-backed room store.
 * This is the default when no REDIS_URL is configured.
 * All operations resolve synchronously (wrapped in Promise for interface compat).
 */
export class MemoryRoomStore implements RoomStore {
  private rooms = new Map<string, Room>();

  async get(code: string): Promise<Room | undefined> {
    return this.rooms.get(code);
  }

  async set(code: string, room: Room): Promise<void> {
    this.rooms.set(code, room);
  }

  async delete(code: string): Promise<void> {
    this.rooms.delete(code);
  }

  async has(code: string): Promise<boolean> {
    return this.rooms.has(code);
  }

  async size(): Promise<number> {
    return this.rooms.size;
  }

  async values(): Promise<IterableIterator<Room>> {
    return this.rooms.values();
  }
}
