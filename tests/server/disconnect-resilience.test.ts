import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Room } from '../../server/src/Room.ts';
import { RoomManager } from '../../server/src/RoomManager.ts';

describe('disconnect and cleanup edge cases', () => {
  it('turns a disconnected in-game player into AI after the grace timer expires', () => {
    const room = new Room(
      'ABCD',
      {
        maxPlayers: 2,
        startingDice: 5,
        palificoEnabled: true,
        calzaEnabled: false,
        difficulty: 'medium',
      },
      true
    );

    let takeoverPlayerId: string | null = null;
    room.onAITakeover = (playerId) => {
      takeoverPlayerId = playerId;
    };

    const host = room.addPlayer('socket-1', 'Alice');
    const guest = room.addPlayer('socket-2', 'Bob');
    assert.ok(host);
    assert.ok(guest);
    assert.equal(room.startGame(), true);

    const originalSetTimeout = globalThis.setTimeout;
    globalThis.setTimeout = ((callback: TimerHandler) => {
      if (typeof callback === 'function') {
        callback();
      }
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout;

    try {
      room.handleDisconnect(guest.id);

      const disconnectedGuest = room.players.find((player) => player.id === guest.id);
      assert.equal(disconnectedGuest?.isConnected, false);
      assert.equal(disconnectedGuest?.isAI, true);
      assert.equal(takeoverPlayerId, guest.id);
    } finally {
      globalThis.setTimeout = originalSetTimeout;
      room.cleanup();
    }
  });

  it('removes empty waiting rooms during cleanup', () => {
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

    const host = room.addPlayer('socket-1', 'Alice');
    assert.ok(host);
    room.removePlayer(host.id);

    (manager as any).cleanupStaleRooms();

    assert.equal(manager.getRoom(room.code), undefined);
    manager.destroy();
  });
});
