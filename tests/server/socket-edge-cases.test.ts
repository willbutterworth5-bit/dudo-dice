import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { Socket } from 'socket.io-client';
import { createClient, createHarness, Harness, waitForEvent } from './helpers/socketHarness.ts';

type SessionBound = {
  playerId: string;
  reconnectToken: string;
  roomCode: string;
};

describe('socket edge cases', () => {
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

  it('rejects illegal lower bids and out-of-turn actions', async () => {
    const harness = await createHarness();
    harnesses.push(harness);

    const host = createClient(harness.baseUrl);
    const guest = createClient(harness.baseUrl);
    clients.push(host, guest);

    await Promise.all([waitForEvent(host, 'connect'), waitForEvent(guest, 'connect')]);

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

    const hostJoinUpdate = waitForEvent(host, 'room_update');
    const guestJoinUpdate = waitForEvent(guest, 'room_update');
    const guestSeatPromise = waitForEvent<SessionBound>(guest, 'session_bound');
    guest.emit('join_room', {
      code: created.roomCode,
      playerName: 'Bob',
    });
    await guestSeatPromise;
    await Promise.all([hostJoinUpdate, guestJoinUpdate]);

    const hostGame = waitForEvent<{ state: { players: Array<{ id: string }>; currentPlayerIndex: number } }>(host, 'game_state');
    const guestGame = waitForEvent<{ state: { players: Array<{ id: string }>; currentPlayerIndex: number } }>(guest, 'game_state');
    host.emit('start_game');
    const [hostState] = await Promise.all([hostGame, guestGame]);

    const currentPlayer = hostState.state.players[hostState.state.currentPlayerIndex].id;
    const opener = currentPlayer === hostSeat.playerId ? host : guest;
    const responder = currentPlayer === hostSeat.playerId ? guest : host;

    const activeStatePromise = waitForEvent<{ state: { currentBid: { quantity: number; faceValue: number } } }>(opener, 'game_state');
    opener.emit('make_bid', { quantity: 1, faceValue: 2 });
    await activeStatePromise;

    const outOfTurnError = waitForEvent<{ message: string }>(opener, 'error');
    opener.emit('make_bid', { quantity: 1, faceValue: 1 });
    assert.match((await outOfTurnError).message, /Not your turn/i);

    const illegalRaiseError = waitForEvent<{ message: string }>(responder, 'error');
    responder.emit('make_bid', { quantity: 1, faceValue: 2 });
    assert.match((await illegalRaiseError).message, /higher quantity|higher face value/i);
  });
});
