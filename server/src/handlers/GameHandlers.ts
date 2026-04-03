import type { SocketContext } from './types.js';
import { getBoundRoom, emitRoomUpdate } from './utils.js';

export function registerGameHandlers(ctx: SocketContext): void {
  const { io, socket } = ctx;

  socket.on('start_game', async () => {
    const room = await getBoundRoom(ctx);
    if (!room) return;

    const started = room.startGame();
    if (!started) {
      socket.emit('error', { message: 'Cannot start game (need at least 2 players)' });
      return;
    }

    for (const player of room.players) {
      const playerSocket = io.sockets.sockets.get(player.socketId);
      if (playerSocket) {
        const sanitised = room.getSanitisedStateForPlayer(player.id);
        playerSocket.emit('game_state', {
          state: sanitised,
          turnTimeRemaining: room.getTurnTimeRemaining(),
        });
      }
    }

    emitRoomUpdate(io, room);
  });

  socket.on('make_bid', async (data: { quantity: number; faceValue: number }) => {
    const room = await getBoundRoom(ctx);
    if (!room || !ctx.boundPlayerId.value) return;

    const result = room.makeBid(ctx.boundPlayerId.value, data.quantity, data.faceValue);
    if (!result.success) {
      socket.emit('error', { message: result.reason || 'Invalid bid' });
    }
  });

  socket.on('challenge', async () => {
    const room = await getBoundRoom(ctx);
    if (!room || !ctx.boundPlayerId.value) return;
    room.challenge(ctx.boundPlayerId.value);
  });

  socket.on('calza', async () => {
    const room = await getBoundRoom(ctx);
    if (!room || !ctx.boundPlayerId.value) return;
    room.calza(ctx.boundPlayerId.value);
  });
}
