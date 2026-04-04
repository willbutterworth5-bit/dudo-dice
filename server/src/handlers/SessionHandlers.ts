import type { SocketContext } from './types.js';
import { getBoundRoom, bindPlayer, emitRoomUpdate } from './utils.js';

export function registerSessionHandlers(ctx: SocketContext): void {
  const { io, socket, ratingStore } = ctx;

  socket.on('register_session', async (data: { reconnectToken?: string }) => {
    if (ctx.rejectRateLimited('register_session')) return;
    if (!data?.reconnectToken) return;

    const reconnectTarget = await ctx.roomManager.findRoomByReconnectToken(data.reconnectToken);
    if (!reconnectTarget) {
      socket.emit('error', { message: 'Reconnect failed' });
      return;
    }

    const { room, playerId } = reconnectTarget;
    if (room.phase !== 'playing') {
      socket.emit('error', { message: 'Reconnect failed' });
      return;
    }

    const reconnectedPlayer = room.reconnectPlayer(playerId, socket.id);
    if (!reconnectedPlayer) {
      socket.emit('error', { message: 'Reconnect failed' });
      return;
    }

    bindPlayer(ctx, room.code, reconnectedPlayer);

    const sanitised = room.getSanitisedStateForPlayer(reconnectedPlayer.id);
    socket.emit('game_state', {
      state: sanitised,
      turnTimeRemaining: room.getTurnTimeRemaining(),
      isRanked: room.isRanked,
    });
    emitRoomUpdate(io, room, ratingStore);
  });

  socket.on('disconnect', async () => {
    const room = await getBoundRoom(ctx);
    if (!room || !ctx.boundPlayerId.value) return;

    room.handleDisconnect(ctx.boundPlayerId.value);
    emitRoomUpdate(io, room, ratingStore);
  });
}
