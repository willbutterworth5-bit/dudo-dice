import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { Socket } from 'socket.io-client';
import { createClient, createHarness, Harness, waitForEvent } from './helpers/socketHarness.ts';

type SessionBound = {
  playerId: string;
  reconnectToken: string;
  roomCode: string;
};

describe('socket integration', () => {
  const clients: Socket[] = [];
  const harnesses: Harness[] = [];

  afterEach(async () => {
    for (const client of clients.splice(0)) {
      client.disconnect();
    }

    for (const harness of harnesses.splice(0)) {
      await harness.close();
    }
  });

  it('supports health checks plus create, join, and start game flows', async () => {
    const harness = await createHarness();
    harnesses.push(harness);

    const healthResponse = await fetch(`${harness.baseUrl}/api/health`);
    const health = await healthResponse.json() as { status: string; rooms: number };
    assert.deepEqual(health, { status: 'ok', rooms: 0 });

    const host = createClient(harness.baseUrl);
    const guest = createClient(harness.baseUrl);
    clients.push(host, guest);

    await Promise.all([waitForEvent(host, 'connect'), waitForEvent(guest, 'connect')]);

    const hostSeatPromise = waitForEvent<SessionBound>(host, 'session_bound');
    const createdPromise = waitForEvent<{ roomCode: string }>(host, 'room_created');
    const hostRoomPromise = waitForEvent<{ players: Array<{ name: string }> }>(host, 'room_update');
    host.emit('create_room', {
      settings: {
        maxPlayers: 6,
        startingDice: 5,
        palificoEnabled: true,
        calzaEnabled: false,
        difficulty: 'medium',
      },
      isPublic: true,
      playerName: 'Alice',
    });

    const [hostSeat, created, initialRoom] = await Promise.all([hostSeatPromise, createdPromise, hostRoomPromise]);
    assert.equal(hostSeat.roomCode, created.roomCode);
    assert.equal(initialRoom.players.length, 1);

    const hostJoinUpdatePromise = waitForEvent<{ players: Array<{ name: string }> }>(host, 'room_update');
    const guestJoinUpdatePromise = waitForEvent<{ players: Array<{ name: string }> }>(guest, 'room_update');
    const guestSeatPromise = waitForEvent<SessionBound>(guest, 'session_bound');
    guest.emit('join_room', {
      code: created.roomCode,
      playerName: 'Bob',
    });

    const [guestSeat, hostJoinUpdate, guestJoinUpdate] = await Promise.all([
      guestSeatPromise,
      hostJoinUpdatePromise,
      guestJoinUpdatePromise,
    ]);
    assert.equal(guestSeat.roomCode, created.roomCode);
    assert.equal(hostJoinUpdate.players.length, 2);
    assert.equal(guestJoinUpdate.players.length, 2);

    const hostGamePromise = waitForEvent<{ state: { players: unknown[] } }>(host, 'game_state');
    const guestGamePromise = waitForEvent<{ state: { players: unknown[] } }>(guest, 'game_state');
    const phaseUpdatePromise = waitForEvent<{ phase: string }>(host, 'room_update');
    host.emit('start_game');

    const [hostGame, guestGame, phaseUpdate] = await Promise.all([
      hostGamePromise,
      guestGamePromise,
      phaseUpdatePromise,
    ]);

    assert.equal(hostGame.state.players.length, 2);
    assert.equal(guestGame.state.players.length, 2);
    assert.equal(phaseUpdate.phase, 'playing');
  });

  it('lists public rooms and lets quick-match players share the same room', async () => {
    const harness = await createHarness();
    harnesses.push(harness);

    const host = createClient(harness.baseUrl);
    const matcherA = createClient(harness.baseUrl);
    const matcherB = createClient(harness.baseUrl);
    clients.push(host, matcherA, matcherB);

    await Promise.all([
      waitForEvent(host, 'connect'),
      waitForEvent(matcherA, 'connect'),
      waitForEvent(matcherB, 'connect'),
    ]);

    const createdPromise = waitForEvent<{ roomCode: string }>(host, 'room_created');
    const hostSeatPromise = waitForEvent<SessionBound>(host, 'session_bound');
    host.emit('create_room', {
      settings: {
        maxPlayers: 6,
        startingDice: 5,
        palificoEnabled: true,
        calzaEnabled: false,
        difficulty: 'medium',
      },
      isPublic: true,
      playerName: 'Alice',
    });
    const created = await createdPromise;
    await hostSeatPromise;

    const roomListPromise = waitForEvent<{ rooms: Array<{ code: string }> }>(matcherA, 'room_list');
    matcherA.emit('list_rooms');
    const roomList = await roomListPromise;
    assert.ok(roomList.rooms.some((room) => room.code === created.roomCode));

    const quickRoomAPromise = waitForEvent<{ roomCode: string }>(matcherA, 'room_created');
    const quickASession = waitForEvent<SessionBound>(matcherA, 'session_bound');
    matcherA.emit('quick_match', {
      playerName: 'Quick A',
    });
    const [quickRoomA] = await Promise.all([quickRoomAPromise, quickASession]);

    const quickRoomBPromise = waitForEvent<{ roomCode: string }>(matcherB, 'room_created');
    const quickBSession = waitForEvent<SessionBound>(matcherB, 'session_bound');
    matcherB.emit('quick_match', {
      playerName: 'Quick B',
    });
    const [quickRoomB] = await Promise.all([quickRoomBPromise, quickBSession]);

    assert.equal(quickRoomA.roomCode, quickRoomB.roomCode);
  });
});
