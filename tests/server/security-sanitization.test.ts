import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { Socket } from 'socket.io-client';
import { createClient, createHarness, Harness, waitForEvent, waitForNoEvent } from './helpers/socketHarness.ts';

type SessionBound = {
  playerId: string;
  reconnectToken: string;
  roomCode: string;
};

describe('security and integrity', () => {
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

  it('never sends opponent dice to the wrong player in game_state payloads', async () => {
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
    const guestSeat = await guestSeatPromise;
    await Promise.all([hostJoinUpdate, guestJoinUpdate]);

    const hostGame = waitForEvent<{ state: { players: Array<{ id: string; dice: number[] }> } }>(host, 'game_state');
    const guestGame = waitForEvent<{ state: { players: Array<{ id: string; dice: number[] }> } }>(guest, 'game_state');
    host.emit('start_game');
    const [hostState, guestState] = await Promise.all([hostGame, guestGame]);

    const hostPlayers = hostState.state.players;
    const guestPlayers = guestState.state.players;

    assert.ok(hostPlayers.find((player) => player.id === hostSeat.playerId)?.dice.length);
    assert.equal(hostPlayers.find((player) => player.id === guestSeat.playerId)?.dice.length, 0);
    assert.ok(guestPlayers.find((player) => player.id === guestSeat.playerId)?.dice.length);
    assert.equal(guestPlayers.find((player) => player.id === hostSeat.playerId)?.dice.length, 0);
  });

  it('room updates expose public seat ids but never reconnect tokens', async () => {
    const harness = await createHarness();
    harnesses.push(harness);

    const host = createClient(harness.baseUrl);
    const guest = createClient(harness.baseUrl);
    clients.push(host, guest);

    await Promise.all([waitForEvent(host, 'connect'), waitForEvent(guest, 'connect')]);

    const hostSeatPromise = waitForEvent<SessionBound>(host, 'session_bound');
    const createdPromise = waitForEvent<{ roomCode: string }>(host, 'room_created');
    const initialRoomPromise = waitForEvent<{ players: Array<Record<string, unknown>> }>(host, 'room_update');
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

    const [hostSeat, created, initialRoom] = await Promise.all([hostSeatPromise, createdPromise, initialRoomPromise]);
    assert.equal(typeof initialRoom.players[0].id, 'string');
    assert.equal('reconnectToken' in initialRoom.players[0], false);
    assert.equal(initialRoom.players[0].id, hostSeat.playerId);

    const guestSeatPromise = waitForEvent<SessionBound>(guest, 'session_bound');
    const hostJoinUpdate = waitForEvent<{ players: Array<Record<string, unknown>> }>(host, 'room_update');
    const guestJoinUpdate = waitForEvent<{ players: Array<Record<string, unknown>> }>(guest, 'room_update');
    guest.emit('join_room', {
      code: created.roomCode,
      playerName: 'Bob',
    });

    await guestSeatPromise;
    const [updatedForHost, updatedForGuest] = await Promise.all([hostJoinUpdate, guestJoinUpdate]);
    assert.equal(updatedForHost.players.every((player) => !('reconnectToken' in player)), true);
    assert.equal(updatedForGuest.players.every((player) => !('reconnectToken' in player)), true);
  });

  it('rejects seat hijacking attempts that only know another player public id', async () => {
    const harness = await createHarness();
    harnesses.push(harness);

    const host = createClient(harness.baseUrl);
    const guest = createClient(harness.baseUrl);
    const attacker = createClient(harness.baseUrl);
    clients.push(host, guest, attacker);

    await Promise.all([
      waitForEvent(host, 'connect'),
      waitForEvent(guest, 'connect'),
      waitForEvent(attacker, 'connect'),
    ]);

    const createdPromise = waitForEvent<{ roomCode: string }>(host, 'room_created');
    const hostSeatPromise = waitForEvent<SessionBound>(host, 'session_bound');
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
    const created = await createdPromise;
    await hostSeatPromise;

    const guestSeatPromise = waitForEvent<SessionBound>(guest, 'session_bound');
    const hostJoinUpdate = waitForEvent<{ players: Array<{ id: string; name: string }> }>(host, 'room_update');
    const guestJoinUpdate = waitForEvent(guest, 'room_update');
    guest.emit('join_room', {
      code: created.roomCode,
      playerName: 'Bob',
    });
    const guestSeat = await guestSeatPromise;
    await Promise.all([hostJoinUpdate, guestJoinUpdate]);

    const attackerError = waitForEvent<{ message: string }>(attacker, 'error');
    const attackerNoState = waitForNoEvent(attacker, 'game_state');
    attacker.emit('register_session', { reconnectToken: guestSeat.playerId });

    assert.match((await attackerError).message, /Reconnect failed/i);
    await attackerNoState;
  });
});
