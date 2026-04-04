import type { Server } from 'socket.io';
import type { RoomManager } from '../RoomManager.js';
import type { RoomPlayer, Room } from '../Room.js';
import type { RoundResult } from '@dudo-dice/shared';
import type { RatingStore } from '../RatingStore.js';
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
    persistentId: player.persistentId,
  });
}

export function emitRoomUpdate(io: Server, room: Room, ratingStore?: RatingStore): void {
  io.to(room.code).emit('room_update', {
    roomCode: room.code,
    players: room.players.map((player) => {
      const rating = (!player.isAI && player.persistentId && ratingStore)
        ? ratingStore.getOrCreate(player.persistentId)
        : null;
      return {
        id: player.id,
        name: player.name,
        isConnected: player.isConnected,
        isAI: player.isAI,
        rating: rating?.rating ?? null,
        provisional: rating?.provisional ?? null,
      };
    }),
    hostId: room.hostId,
    settings: room.settings,
    phase: room.phase,
    startWithBotsVotes: room.getStartWithBotsVotes(),
    isRanked: room.isRanked,
  });
}

/** Send initial game_state to all connected human players after game start. */
export function broadcastGameStart(io: Server, room: Room): void {
  for (const player of room.players) {
    if (player.isAI || !player.socketId) continue;
    const playerSocket = io.sockets.sockets.get(player.socketId);
    if (playerSocket) {
      const sanitised = room.getSanitisedStateForPlayer(player.id);
      playerSocket.emit('game_state', {
        state: sanitised,
        turnTimeRemaining: room.getTurnTimeRemaining(),
        isRanked: room.isRanked,
      });
    }
  }
  emitRoomUpdate(io, room);
}

export function wireRoomCallbacks(io: Server, room: Room, _roomManager: RoomManager, ratingStore: RatingStore): void {
  room.onBroadcastState = () => {
    for (const player of room.players) {
      const playerSocket = io.sockets.sockets.get(player.socketId);
      if (playerSocket && player.isConnected) {
        const sanitised = room.getSanitisedStateForPlayer(player.id);
        playerSocket.emit('game_state', {
          state: sanitised,
          turnTimeRemaining: room.getTurnTimeRemaining(),
          isRanked: room.isRanked,
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
    // Finalize match and compute Elo ratings
    room.finalizeMatch(ratingStore);

    io.to(room.code).emit('game_over', { winnerId });
    emitRoomUpdate(io, room, ratingStore);
  };

  room.onRatingUpdate = (results, placements) => {
    // Send individual rating updates to each connected player
    for (const result of results) {
      const roomPlayer = room.players.find(rp => rp.id === result.playerId);
      if (!roomPlayer || !roomPlayer.socketId) continue;
      const playerSocket = io.sockets.sockets.get(roomPlayer.socketId);
      if (playerSocket) {
        playerSocket.emit('rating_update', {
          playerId: result.playerId,
          oldRating: result.oldRating,
          newRating: result.newRating,
          delta: result.delta,
          placement: placements.get(result.playerId) ?? 0,
          isRanked: room.isRanked,
        });
      }
    }
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
