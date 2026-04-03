import type { RoomSettings } from '../Room.js';
import type { SocketContext } from './types.js';
import { getBoundRoom, bindPlayer, emitRoomUpdate, wireRoomCallbacks } from './utils.js';

export function registerLobbyHandlers(ctx: SocketContext): void {
  const { io, socket, roomManager } = ctx;

  socket.on('create_room', async (data: {
    settings: RoomSettings;
    isPublic: boolean;
    playerName: string;
  }) => {
    if (ctx.rejectRateLimited('create_room')) return;
    if (await getBoundRoom(ctx)) {
      socket.emit('error', { message: 'Leave your current room before creating another one' });
      return;
    }

    const room = await roomManager.createRoom(data.settings, data.isPublic);
    const player = room.addPlayer(socket.id, data.playerName);
    if (!player) {
      socket.emit('error', { message: 'Could not create room' });
      return;
    }

    socket.join(room.code);
    bindPlayer(ctx, room.code, player);
    wireRoomCallbacks(io, room, roomManager);

    socket.emit('room_created', { roomCode: room.code });
    emitRoomUpdate(io, room);
  });

  socket.on('join_room', async (data: {
    code: string;
    playerName: string;
  }) => {
    if (ctx.rejectRateLimited('join_room')) return;
    if (await getBoundRoom(ctx)) {
      socket.emit('error', { message: 'Leave your current room before joining another one' });
      return;
    }

    const room = await roomManager.getRoom(data.code);

    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    if (room.phase !== 'waiting') {
      socket.emit('error', { message: 'Game already in progress' });
      return;
    }

    const player = room.addPlayer(socket.id, data.playerName);
    if (!player) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }

    socket.join(room.code);
    bindPlayer(ctx, room.code, player);
    emitRoomUpdate(io, room);
  });

  socket.on('quick_match', async (data: { playerName: string }) => {
    if (ctx.rejectRateLimited('quick_match')) return;
    if (await getBoundRoom(ctx)) {
      socket.emit('error', { message: 'Leave your current room before joining another one' });
      return;
    }

    let room = await roomManager.findQuickMatchRoom();

    if (!room) {
      const defaultSettings: RoomSettings = {
        maxPlayers: 6,
        startingDice: 5,
        palificoEnabled: true,
        calzaEnabled: false,
        difficulty: 'medium',
      };
      room = await roomManager.createRoom(defaultSettings, true);
      wireRoomCallbacks(io, room, roomManager);
    }

    const player = room.addPlayer(socket.id, data.playerName);
    if (!player) {
      socket.emit('error', { message: 'Could not join room' });
      return;
    }

    socket.join(room.code);
    bindPlayer(ctx, room.code, player);
    socket.emit('room_created', { roomCode: room.code });
    emitRoomUpdate(io, room);
  });

  socket.on('list_rooms', async () => {
    const rooms = await roomManager.getPublicRooms();
    socket.emit('room_list', { rooms });
  });

  socket.on('leave_room', async () => {
    const room = await getBoundRoom(ctx);
    if (!room || !ctx.boundPlayerId.value) return;

    socket.leave(room.code);

    if (room.phase === 'waiting') {
      room.removePlayer(ctx.boundPlayerId.value);
      emitRoomUpdate(io, room);

      if (room.players.length === 0) {
        await roomManager.removeRoom(room.code);
      }
    } else {
      room.handleDisconnect(ctx.boundPlayerId.value);
    }

    ctx.boundPlayerId.value = null;
  });
}
