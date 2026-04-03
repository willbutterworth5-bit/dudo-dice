import type { Room } from '../Room.js';

/**
 * Abstract interface for room storage.
 * Default implementation is MemoryRoomStore (in-process Map).
 * Can be swapped for RedisRoomStore when REDIS_URL is set,
 * enabling horizontal scaling across multiple server instances.
 */
export interface RoomStore {
  get(code: string): Promise<Room | undefined>;
  set(code: string, room: Room): Promise<void>;
  delete(code: string): Promise<void>;
  has(code: string): Promise<boolean>;
  size(): Promise<number>;
  values(): Promise<IterableIterator<Room>>;
}
