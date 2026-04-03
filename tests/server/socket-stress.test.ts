import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { Socket } from 'socket.io-client';
import { createClient, createHarness, Harness, waitForEvent } from './helpers/socketHarness.ts';

describe('multiplayer stress', () => {
  const harnesses: Harness[] = [];
  const clients: Socket[] = [];

  afterEach(async () => {
    for (const client of clients.splice(0)) {
      client.disconnect();
    }
    for (const harness of harnesses.splice(0)) {
      await harness.close();
    }
  });

  it('supports a full six-player room joining nearly simultaneously', async () => {
    const harness = await createHarness();
    harnesses.push(harness);

    const allClients = Array.from({ length: 6 }, () => createClient(harness.baseUrl));
    clients.push(...allClients);

    await Promise.all(allClients.map((client) => waitForEvent(client, 'connect')));

    const host = allClients[0];
    const createdPromise = waitForEvent<{ roomCode: string }>(host, 'room_created');
    const hostSeatPromise = waitForEvent(host, 'session_bound');
    host.emit('create_room', {
      settings: {
        maxPlayers: 6,
        startingDice: 5,
        palificoEnabled: true,
        calzaEnabled: false,
        difficulty: 'medium',
      },
      isPublic: false,
      playerName: 'Host',
    });
    const created = await createdPromise;
    await hostSeatPromise;

    await Promise.all(
      allClients.slice(1).map((client, index) => {
        const roomUpdatePromise = waitForEvent(client, 'room_update');
        const seatPromise = waitForEvent(client, 'session_bound');
        client.emit('join_room', {
          code: created.roomCode,
          playerName: `Guest-${index + 1}`,
        });
        return Promise.all([roomUpdatePromise, seatPromise]);
      })
    );

    const room = await harness.roomManager.getRoom(created.roomCode);
    assert.equal(room?.players.length, 6);

    const gameStatePromises = allClients.map((client) => waitForEvent<{ state: { players: unknown[] } }>(client, 'game_state'));
    host.emit('start_game');
    const gameStates = await Promise.all(gameStatePromises);

    for (const payload of gameStates) {
      assert.equal(payload.state.players.length, 6);
    }
  });
});
