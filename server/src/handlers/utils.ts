import type { Server } from 'socket.io';
import type { RoomManager } from '../RoomManager.js';
import type { RoomPlayer, Room } from '../Room.js';
import type { RoundResult } from '@dudo-dice/shared';
import type { SocketContext } from './types.js';

export async function getBoundRoom(ctx: SocketContext): Promise<Room | undefined> {
  if (!ctx.boundPlayerId.value) return undefined;
  return ctx.roomManager.getRoomByPlayer(ctx.boundPlayerId.value);
}

export function bindPlayer(ctx: SocketContext, roomCode: string, player: RoomPlayer): void {
  ctx.boundPlayerId.value = player.id;
  ctx.socket.join(roomCode);
  ctx.socket.emit('session_bound', {
    playerId: player.id,
    reconnectToken: player.reconnectToken,
    roomCode,
  });
}

export function emitRoomUpdate(io: Server, room: Room): void {
  io.to(room.code).emit('room_update', {
    roomCode: room.code,
    players: room.players.map((player) => ({
      id: player.id,
      name: player.name,
      isConnected: player.isConnected,
      isAI: player.isAI,
    })),
    hostId: room.hostId,
    settings: room.settings,
    phase: room.phase,
  });
}

export function wireRoomCallbacks(io: Server, room: Room, _roomManager: RoomManager): void {
  room.onBroadcastState = () => {
    for (const player of room.players) {
      const playerSocket = io.sockets.sockets.get(player.socketId);
      if (playerSocket && player.isConnected) {
        const sanitised = room.getSanitisedStateForPlayer(player.id);
        playerSocket.emit('game_state', {
          state: sanitised,
          turnTimeRemaining: room.getTurnTimeRemaining(),
        });
      }
    }
  };

  room.onBroadcastRoundResult = (result: RoundResult) => {
    io.to(room.code).emit('round_result', { result });
  };

  room.onBroadcastNewRound = () => {
    io.to(room.code).emit('new_round');
  };

  room.onTurnTimeout = (playerId: string) => {
    io.to(room.code).emit('turn_timeout', { playerId });
  };

  room.onGameOver = (winnerId: string) => {
    io.to(room.code).emit('game_over', { winnerId });
    emitRoomUpdate(io, room);
  };

  room.onPlayerDisconnected = (playerId: string, graceSeconds: number) => {
    io.to(room.code).emit('player_disconnected', { playerId, graceSeconds });
  };

  room.onPlayerReconnected = (playerId: string) => {
    io.to(room.code).emit('player_reconnected', { playerId });
  };

  room.onAITakeover = (playerId: string, playerName: string) => {
    io.to(room.code).emit('ai_takeover', { playerId, playerName });
  };
}
