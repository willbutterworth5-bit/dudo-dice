import { Server, Socket } from 'socket.io';
import { RoomManager } from './RoomManager.js';
import { RoomSettings, RoomPlayer } from './Room.js';
import type { RoundResult } from '@dudo-dice/shared';

const SECURITY_WINDOW_MS = 10_000;
const MAX_SECURITY_ATTEMPTS = 12;

function createRateLimiter() {
  const attempts = new Map<string, number[]>();

  return (key: string): boolean => {
    const now = Date.now();
    const recent = (attempts.get(key) ?? []).filter((timestamp) => now - timestamp < SECURITY_WINDOW_MS);
    recent.push(now);
    attempts.set(key, recent);
    return recent.length <= MAX_SECURITY_ATTEMPTS;
  };
}

export function setupSocketHandlers(io: Server, roomManager: RoomManager): void {
  io.on('connection', (socket: Socket) => {
    let boundPlayerId: string | null = null;
    const allowAttempt = createRateLimiter();

    const rejectRateLimitedAttempt = (bucket: string): boolean => {
      if (allowAttempt(bucket)) {
        return false;
      }
      socket.emit('error', { message: 'Too many multiplayer attempts. Please wait a moment.' });
      return true;
    };

    const getBoundRoom = () => {
      if (!boundPlayerId) return undefined;
      return roomManager.getRoomByPlayer(boundPlayerId);
    };

    const bindPlayer = (roomCode: string, player: RoomPlayer) => {
      boundPlayerId = player.id;
      socket.join(roomCode);
      socket.emit('session_bound', {
        playerId: player.id,
        reconnectToken: player.reconnectToken,
        roomCode,
      });
    };

    socket.on('register_session', (data: { reconnectToken?: string }) => {
      if (rejectRateLimitedAttempt('register_session')) return;
      if (!data?.reconnectToken) return;

      const reconnectTarget = roomManager.findRoomByReconnectToken(data.reconnectToken);
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

      bindPlayer(room.code, reconnectedPlayer);

      const sanitised = room.getSanitisedStateForPlayer(reconnectedPlayer.id);
      socket.emit('game_state', {
        state: sanitised,
        turnTimeRemaining: room.getTurnTimeRemaining(),
      });
      emitRoomUpdate(io, room);
    });

    socket.on('create_room', (data: {
      settings: RoomSettings;
      isPublic: boolean;
      playerName: string;
    }) => {
      if (rejectRateLimitedAttempt('create_room')) return;
      if (getBoundRoom()) {
        socket.emit('error', { message: 'Leave your current room before creating another one' });
        return;
      }

      const room = roomManager.createRoom(data.settings, data.isPublic);
      const player = room.addPlayer(socket.id, data.playerName);
      if (!player) {
        socket.emit('error', { message: 'Could not create room' });
        return;
      }

      socket.join(room.code);
      bindPlayer(room.code, player);

      wireRoomCallbacks(io, room, roomManager);

      socket.emit('room_created', { roomCode: room.code });
      emitRoomUpdate(io, room);
    });

    socket.on('join_room', (data: {
      code: string;
      playerName: string;
    }) => {
      if (rejectRateLimitedAttempt('join_room')) return;
      if (getBoundRoom()) {
        socket.emit('error', { message: 'Leave your current room before joining another one' });
        return;
      }

      const room = roomManager.getRoom(data.code);

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
      bindPlayer(room.code, player);
      emitRoomUpdate(io, room);
    });

    socket.on('quick_match', (data: { playerName: string }) => {
      if (rejectRateLimitedAttempt('quick_match')) return;
      if (getBoundRoom()) {
        socket.emit('error', { message: 'Leave your current room before joining another one' });
        return;
      }

      let room = roomManager.findQuickMatchRoom();

      if (!room) {
        const defaultSettings: RoomSettings = {
          maxPlayers: 6,
          startingDice: 5,
          palificoEnabled: true,
          calzaEnabled: false,
          difficulty: 'medium',
        };
        room = roomManager.createRoom(defaultSettings, true);
        wireRoomCallbacks(io, room, roomManager);
      }

      const player = room.addPlayer(socket.id, data.playerName);
      if (!player) {
        socket.emit('error', { message: 'Could not join room' });
        return;
      }

      socket.join(room.code);
      bindPlayer(room.code, player);
      socket.emit('room_created', { roomCode: room.code });
      emitRoomUpdate(io, room);
    });

    socket.on('list_rooms', () => {
      const rooms = roomManager.getPublicRooms();
      socket.emit('room_list', { rooms });
    });

    socket.on('start_game', () => {
      const room = getBoundRoom();
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

    socket.on('make_bid', (data: { quantity: number; faceValue: number }) => {
      const room = getBoundRoom();
      if (!room || !boundPlayerId) return;

      const result = room.makeBid(boundPlayerId, data.quantity, data.faceValue);
      if (!result.success) {
        socket.emit('error', { message: result.reason || 'Invalid bid' });
      }
    });

    socket.on('challenge', () => {
      const room = getBoundRoom();
      if (!room || !boundPlayerId) return;
      room.challenge(boundPlayerId);
    });

    socket.on('calza', () => {
      const room = getBoundRoom();
      if (!room || !boundPlayerId) return;
      room.calza(boundPlayerId);
    });

    socket.on('leave_room', () => {
      const room = getBoundRoom();
      if (!room || !boundPlayerId) return;

      socket.leave(room.code);

      if (room.phase === 'waiting') {
        room.removePlayer(boundPlayerId);
        emitRoomUpdate(io, room);

        if (room.players.length === 0) {
          roomManager.removeRoom(room.code);
        }
      } else {
        room.handleDisconnect(boundPlayerId);
      }

      boundPlayerId = null;
    });

    socket.on('disconnect', () => {
      const room = getBoundRoom();
      if (!room || !boundPlayerId) return;

      room.handleDisconnect(boundPlayerId);
      emitRoomUpdate(io, room);
    });
  });
}

function wireRoomCallbacks(io: Server, room: ReturnType<RoomManager['createRoom']>, _roomManager: RoomManager): void {
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

function emitRoomUpdate(io: Server, room: ReturnType<RoomManager['createRoom']>): void {
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
