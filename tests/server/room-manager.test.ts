import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { RoomManager } from '../../server/src/RoomManager.ts';

describe('RoomManager', () => {
  it('creates retrievable rooms and lists them as public', () => {
    const manager = new RoomManager();
    const room = manager.createRoom(
      {
        maxPlayers: 6,
        startingDice: 5,
        palificoEnabled: true,
        calzaEnabled: false,
        difficulty: 'medium',
      },
      true
    );

    room.addPlayer('socket-1', 'Alice');

    assert.equal(manager.getRoom(room.code)?.code, room.code);
    assert.equal(manager.getRoom(room.code.toLowerCase())?.code, room.code);
    assert.equal(manager.getPublicRooms().length, 1);

    manager.destroy();
  });

  it('prefers the fullest eligible room for quick match', () => {
    const manager = new RoomManager();
    const settings = {
      maxPlayers: 6,
      startingDice: 5,
      palificoEnabled: true,
      calzaEnabled: false,
      difficulty: 'medium' as const,
    };

    const small = manager.createRoom(settings, true);
    small.addPlayer('socket-1', 'Alice');

    const large = manager.createRoom(settings, true);
    large.addPlayer('socket-2', 'Bob');
    large.addPlayer('socket-3', 'Cara');

    assert.equal(manager.findQuickMatchRoom()?.code, large.code);

    manager.destroy();
  });
});
