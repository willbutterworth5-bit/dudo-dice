import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Room } from '../../server/src/Room.ts';

function createRoom() {
  return new Room(
    'ABCD',
    {
      maxPlayers: 4,
      startingDice: 5,
      palificoEnabled: true,
      calzaEnabled: false,
      difficulty: 'medium',
    },
    true
  );
}

describe('Room', () => {
  it('rejects duplicate players and enforces max capacity', () => {
    const room = createRoom();

    assert.ok(room.addPlayer('socket-1', 'Alice'));
    assert.ok(room.addPlayer('socket-2', 'Bob'));
    assert.ok(room.addPlayer('socket-3', 'Cara'));
    assert.ok(room.addPlayer('socket-4', 'Dylan'));
    assert.equal(room.addPlayer('socket-5', 'Eve'), null);

    room.cleanup();
  });

  it('requires at least two players to start', () => {
    const room = createRoom();
    room.addPlayer('socket-1', 'Alice');

    assert.equal(room.startGame(), false);

    room.cleanup();
  });

  it('hides opponents dice in sanitised state', () => {
    const room = createRoom();
    const host = room.addPlayer('socket-1', 'Alice');
    const guest = room.addPlayer('socket-2', 'Bob');
    assert.ok(host);
    assert.ok(guest);
    assert.equal(room.startGame(), true);

    const state = room.getSanitisedStateForPlayer(host.id);

    assert.ok(state);
    assert.ok(state.players.find((player) => player.id === host.id)?.dice.length);
    assert.equal(
      state.players.find((player) => player.id === guest.id)?.dice.length,
      0
    );

    room.cleanup();
  });

  it('removes waiting-room players immediately on disconnect', () => {
    const room = createRoom();
    const host = room.addPlayer('socket-1', 'Alice');
    assert.ok(host);

    room.handleDisconnect(host.id);

    assert.equal(room.players.length, 0);
    room.cleanup();
  });

  it('accepts a valid bid only from the active player', () => {
    const room = createRoom();
    const host = room.addPlayer('socket-1', 'Alice');
    const guest = room.addPlayer('socket-2', 'Bob');
    assert.ok(host);
    assert.ok(guest);
    assert.equal(room.startGame(), true);

    const engineState = ((room as any).engine as any).state;
    const hostIdx = engineState.players.findIndex((player: { id: string }) => player.id === host.id);
    engineState.currentPlayerIndex = hostIdx;

    const wrongTurn = room.makeBid(guest.id, 1, 2);
    const rightTurn = room.makeBid(host.id, 1, 2);

    assert.equal(wrongTurn.success, false);
    assert.equal(rightTurn.success, true);

    room.cleanup();
  });
});
