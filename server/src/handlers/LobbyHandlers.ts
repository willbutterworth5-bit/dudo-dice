import type { RoomSettings } from '../Room.js';
import type { SocketContext } from './types.js';
import { getBoundRoom, bindPlayer, emitRoomUpdate, wireRoomCallbacks, broadcastGameStart } from './utils.js';

/** Returns the verified Supabase user ID for this socket (if logged in), else falls back to the client-provided persistentId. */
function resolvedPersistentId(ctx: SocketContext, clientPersistentId?: string): string {
  return (ctx.socket.data?.supabaseUserId as string | undefined) ?? clientPersistentId ?? crypto.randomUUID();
}

export function registerLobbyHandlers(ctx: SocketContext): void {
  const { io, socket, roomManager, ratingStore } = ctx;

  socket.on('create_room', async (data: {
    settings: RoomSettings;
    isPublic: boolean;
    playerName: string;
    persistentId?: string;
  }) => {
    if (ctx.rejectRateLimited('create_room')) return;
    if (await getBoundRoom(ctx)) {
      socket.emit('error', { message: 'Leave your current room before creating another one' });
      return;
    }

    const room = await roomManager.createRoom(data.settings, data.isPublic);
    const pid = resolvedPersistentId(ctx, data.persistentId);
    await ratingStore.loadFromSupabase(pid, ctx.supabase);
    const player = room.addPlayer(socket.id, data.playerName, pid);
    if (!player) {
      socket.emit('error', { message: 'Could not create room' });
      return;
    }

    socket.join(room.code);
    bindPlayer(ctx, room.code, player);
    wireRoomCallbacks(io, room, roomManager, ratingStore, ctx.supabase);

    socket.emit('room_created', { roomCode: room.code });
    emitRoomUpdate(io, room, ratingStore);
  });

  socket.on('join_room', async (data: {
    code: string;
    playerName: string;
    persistentId?: string;
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

    const pid = resolvedPersistentId(ctx, data.persistentId);
    await ratingStore.loadFromSupabase(pid, ctx.supabase);
    const player = room.addPlayer(socket.id, data.playerName, pid);
    if (!player) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }

    socket.join(room.code);
    bindPlayer(ctx, room.code, player);
    emitRoomUpdate(io, room, ratingStore);
  });

  socket.on('quick_match', async (data: { playerName: string; persistentId?: string }) => {
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
      wireRoomCallbacks(io, room, roomManager, ratingStore, ctx.supabase);
    }

    const pid = resolvedPersistentId(ctx, data.persistentId);
    await ratingStore.loadFromSupabase(pid, ctx.supabase);
    const player = room.addPlayer(socket.id, data.playerName, pid);
    if (!player) {
      socket.emit('error', { message: 'Could not join room' });
      return;
    }

    socket.join(room.code);
    bindPlayer(ctx, room.code, player);
    socket.emit('room_created', { roomCode: room.code });
    emitRoomUpdate(io, room, ratingStore);
  });

  socket.on('vote_start_with_bots', async () => {
    if (ctx.rejectRateLimited('vote_start_with_bots')) return;
    const room = await getBoundRoom(ctx);
    if (!room || !ctx.boundPlayerId.value) return;
    if (room.phase !== 'waiting') return;

    const allVoted = room.voteStartWithBots(ctx.boundPlayerId.value);
    emitRoomUpdate(io, room, ratingStore);

    if (allVoted) {
      const started = room.startWithBots();
      if (started) {
        broadcastGameStart(io, room);
      }
    }
  });

  socket.on('list_rooms', async () => {
    const rawRooms = await roomManager.getPublicRooms();
    const rooms = rawRooms.map(r => {
      const rating = r.hostPersistentId ? ratingStore.getOrCreate(r.hostPersistentId) : null;
      return {
        code: r.code,
        playerCount: r.playerCount,
        maxPlayers: r.maxPlayers,
        settings: r.settings,
        hostName: r.hostName,
        hostRating: rating?.rating ?? null,
        hostProvisional: rating?.provisional ?? null,
      };
    });
    socket.emit('room_list', { rooms });
  });

  socket.on('leave_room', async () => {
    const room = await getBoundRoom(ctx);
    if (!room || !ctx.boundPlayerId.value) return;

    socket.leave(room.code);

    if (room.phase === 'waiting') {
      room.removePlayer(ctx.boundPlayerId.value);
      emitRoomUpdate(io, room, ratingStore);

      if (room.players.length === 0) {
        await roomManager.removeRoom(room.code);
      }
    } else {
      room.handleDisconnect(ctx.boundPlayerId.value);
    }

    ctx.boundPlayerId.value = null;
  });
}
