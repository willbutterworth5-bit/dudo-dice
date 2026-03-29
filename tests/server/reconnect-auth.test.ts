import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { Socket } from 'socket.io-client';
import { createClient, createHarness, Harness, waitForEvent, waitForNoEvent } from './helpers/socketHarness.ts';

type SessionBound = {
  playerId: string;
  reconnectToken: string;
  roomCode: string;
};

describe('reconnect authorization', () => {
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

  it('requires the correct reconnect token and a disconnected seat', async () => {
    const harness = await createHarness();
    harnesses.push(harness);

    const host = createClient(harness.baseUrl);
    const guest = createClient(harness.baseUrl);
    const reconnectingClient = createClient(harness.baseUrl);
    const staleClient = createClient(harness.baseUrl);
    clients.push(host, guest, reconnectingClient, staleClient);

    await Promise.all([
      waitForEvent(host, 'connect'),
      waitForEvent(guest, 'connect'),
      waitForEvent(reconnectingClient, 'connect'),
      waitForEvent(staleClient, 'connect'),
    ]);

    const hostSeatPromise = waitForEvent<SessionBound>(host, 'session_bound');
    const createdPromise = waitForEvent<{ roomCode: string }>(host, 'room_created');
    host.emit('create_room', {
      settings: {
        maxPlayers: 2,
        startingDice: 5,
        palificoEnabled: true,
        calzaEnabled: false,
        difficulty: 'medium',
      },
      isPublic: false,
      playerName: 'Alice',
    });
    const [hostSeat, created] = await Promise.all([hostSeatPromise, createdPromise]);

    const guestSeatPromise = waitForEvent<SessionBound>(guest, 'session_bound');
    const hostJoinUpdate = waitForEvent(host, 'room_update');
    const guestJoinUpdate = waitForEvent(guest, 'room_update');
    guest.emit('join_room', {
      code: created.roomCode,
      playerName: 'Bob',
    });
    await guestSeatPromise;
    await Promise.all([hostJoinUpdate, guestJoinUpdate]);

    const hostGame = waitForEvent(host, 'game_state');
    const guestGame = waitForEvent(guest, 'game_state');
    host.emit('start_game');
    await Promise.all([hostGame, guestGame]);

    const earlyReconnectError = waitForEvent<{ message: string }>(reconnectingClient, 'error');
    const earlyReconnectNoState = waitForNoEvent(reconnectingClient, 'game_state');
    reconnectingClient.emit('register_session', { reconnectToken: hostSeat.reconnectToken });
    assert.match((await earlyReconnectError).message, /Reconnect failed/i);
    await earlyReconnectNoState;

    host.disconnect();

    const reconnectedSeatPromise = waitForEvent<SessionBound>(reconnectingClient, 'session_bound');
    const reconnectedGamePromise = waitForEvent(reconnectingClient, 'game_state');
    reconnectingClient.emit('register_session', { reconnectToken: hostSeat.reconnectToken });
    const [reconnectedSeat] = await Promise.all([reconnectedSeatPromise, reconnectedGamePromise]);

    assert.equal(reconnectedSeat.playerId, hostSeat.playerId);
    assert.notEqual(reconnectedSeat.reconnectToken, hostSeat.reconnectToken);

    const staleReconnectError = waitForEvent<{ message: string }>(staleClient, 'error');
    const staleReconnectNoState = waitForNoEvent(staleClient, 'game_state');
    staleClient.emit('register_session', { reconnectToken: hostSeat.reconnectToken });
    assert.match((await staleReconnectError).message, /Reconnect failed/i);
    await staleReconnectNoState;
  });
});
