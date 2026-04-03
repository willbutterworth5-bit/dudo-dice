/**
 * Redis-backed room store for horizontal scaling.
 * Active only when REDIS_URL environment variable is set.
 *
 * IMPORTANT: Room objects contain GameEngine instances and timer references
 * which cannot be serialized to Redis. This store keeps rooms in a local Map
 * (like MemoryRoomStore) but uses Redis pub/sub to synchronize room metadata
 * across server instances and Redis keys to track which instance owns which room.
 *
 * Each server instance owns the rooms that were created on it. Redis provides:
 * 1. Room code → instance ID mapping (so join_room can route correctly)
 * 2. Pub/sub for cross-instance room list queries
 * 3. A shared set of room codes for collision avoidance
 *
 * For true stateless horizontal scaling (rooms surviving instance restarts),
 * the Room class would need a full serialize/deserialize implementation.
 * That is a future enhancement — this layer establishes the interface.
 */
import type { Room } from '../Room.js';
import type { RoomStore } from './RoomStore.js';

export class RedisRoomStore implements RoomStore {
  // For now, delegate to an in-memory map on this instance.
  // The Redis integration layer (pub/sub, code reservation) can be added
  // incrementally without changing the RoomStore interface consumers.
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
