import { Server, Socket } from 'socket.io';
import { RoomManager } from './RoomManager.js';
import { RoomSettings } from './Room.js';
import type { RoundResult } from '@dudo-dice/shared';



export function setupSocketHandlers(io: Server, roomManager: RoomManager): void {
  io.on('connection', (socket: Socket) => {
    let sessionId: string | null = null;

    // ── Session registration ──────────────────────────────────────────────
    socket.on('register_session', (data: { sessionId: string }) => {
      sessionId = data.sessionId;

      // Check for reconnection to an existing room
      const existingRoom = roomManager.getRoomByPlayer(sessionId);
      if (existingRoom && existingRoom.phase === 'playing') {
        existingRoom.reconnectPlayer(sessionId, socket.id);
        socket.join(existingRoom.code);

        const sanitised = existingRoom.getSanitisedStateForPlayer(sessionId);
        socket.emit('game_state', {
          state: sanitised,
          turnTimeRemaining: existingRoom.getTurnTimeRemaining(),
        });
        socket.emit('room_update', {
          roomCode: existingRoom.code,
          players: existingRoom.players.map(p => ({
            id: p.id,
            name: p.name,
            isConnected: p.isConnected,
            isAI: p.isAI,
          })),
          hostId: existingRoom.hostId,
          settings: existingRoom.settings,
          phase: existingRoom.phase,
        });
      }
    });

    // ── Room creation ─────────────────────────────────────────────────────
    socket.on('create_room', (data: {
      settings: RoomSettings;
      isPublic: boolean;
      playerName: string;
      sessionId: string;
    }) => {
      sessionId = data.sessionId;
      const room = roomManager.createRoom(data.sessionId, data.settings, data.isPublic);
      room.addPlayer(data.sessionId, socket.id, data.playerName);
      socket.join(room.code);

      // Wire up room callbacks
      wireRoomCallbacks(io, room, roomManager);

      socket.emit('room_created', { roomCode: room.code });
      emitRoomUpdate(io, room);
    });

    // ── Join room ─────────────────────────────────────────────────────────
    socket.on('join_room', (data: {
      code: string;
      playerName: string;
      sessionId: string;
    }) => {
      sessionId = data.sessionId;
      const room = roomManager.getRoom(data.code);

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.phase !== 'waiting') {
        // Try reconnection
        if (room.reconnectPlayer(data.sessionId, socket.id)) {
          socket.join(room.code);
          const sanitised = room.getSanitisedStateForPlayer(data.sessionId);
          socket.emit('game_state', {
            state: sanitised,
            turnTimeRemaining: room.getTurnTimeRemaining(),
          });
          emitRoomUpdate(io, room);
          return;
        }
        socket.emit('error', { message: 'Game already in progress' });
        return;
      }

      const added = room.addPlayer(data.sessionId, socket.id, data.playerName);
      if (!added) {
        socket.emit('error', { message: 'Room is full' });
        return;
      }

      socket.join(room.code);
      emitRoomUpdate(io, room);
    });

    // ── Quick match ───────────────────────────────────────────────────────
    socket.on('quick_match', (data: {
      playerName: string;
      sessionId: string;
    }) => {
      sessionId = data.sessionId;

      let room = roomManager.findQuickMatchRoom();

      if (!room) {
        // Create a new public room with default settings
        const defaultSettings: RoomSettings = {
          maxPlayers: 6,
          startingDice: 5,
          palificoEnabled: true,
          calzaEnabled: false,
          difficulty: 'medium',
        };
        room = roomManager.createRoom(data.sessionId, defaultSettings, true);
        wireRoomCallbacks(io, room, roomManager);
      }

      const added = room.addPlayer(data.sessionId, socket.id, data.playerName);
      if (!added) {
        socket.emit('error', { message: 'Could not join room' });
        return;
      }

      socket.join(room.code);
      socket.emit('room_created', { roomCode: room.code });
      emitRoomUpdate(io, room);
    });

    // ── List rooms ────────────────────────────────────────────────────────
    socket.on('list_rooms', () => {
      const rooms = roomManager.getPublicRooms();
      socket.emit('room_list', { rooms });
    });

    // ── Start game ────────────────────────────────────────────────────────
    socket.on('start_game', () => {
      if (!sessionId) return;
      const room = roomManager.getRoomByPlayer(sessionId);
      if (!room) return;

      if (room.hostId !== sessionId) {
        socket.emit('error', { message: 'Only the host can start the game' });
        return;
      }

      const started = room.startGame();
      if (!started) {
        socket.emit('error', { message: 'Cannot start game (need at least 2 players)' });
        return;
      }

      // Send sanitised state to each player
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

    // ── Make bid ──────────────────────────────────────────────────────────
    socket.on('make_bid', (data: { quantity: number; faceValue: number }) => {
      if (!sessionId) return;
      const room = roomManager.getRoomByPlayer(sessionId);
      if (!room) return;

      const result = room.makeBid(sessionId, data.quantity, data.faceValue);
      if (!result.success) {
        socket.emit('error', { message: result.reason || 'Invalid bid' });
      }
    });

    // ── Challenge (Dudo) ──────────────────────────────────────────────────
    socket.on('challenge', () => {
      if (!sessionId) return;
      const room = roomManager.getRoomByPlayer(sessionId);
      if (!room) return;

      room.challenge(sessionId);
    });

    // ── Calza ─────────────────────────────────────────────────────────────
    socket.on('calza', () => {
      if (!sessionId) return;
      const room = roomManager.getRoomByPlayer(sessionId);
      if (!room) return;

      room.calza(sessionId);
    });

    // ── Leave room ────────────────────────────────────────────────────────
    socket.on('leave_room', () => {
      if (!sessionId) return;
      const room = roomManager.getRoomByPlayer(sessionId);
      if (!room) return;

      socket.leave(room.code);

      if (room.phase === 'waiting') {
        room.removePlayer(sessionId);
        emitRoomUpdate(io, room);

        // Clean up empty rooms
        if (room.players.length === 0) {
          roomManager.removeRoom(room.code);
        }
      } else {
        room.handleDisconnect(sessionId);
      }
    });

    // ── Disconnect ────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      if (!sessionId) return;
      const room = roomManager.getRoomByPlayer(sessionId);
      if (!room) return;

      room.handleDisconnect(sessionId);
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
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      isConnected: p.isConnected,
      isAI: p.isAI,
    })),
    hostId: room.hostId,
    settings: room.settings,
    phase: room.phase,
  });
}
