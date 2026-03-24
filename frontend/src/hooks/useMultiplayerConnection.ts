import { useState, useCallback, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState, RoundResult } from '@dudo-dice/shared';

export interface RoomPlayerInfo {
  id: string;
  name: string;
  isConnected: boolean;
  isAI: boolean;
}

export interface RoomUpdate {
  roomCode: string;
  players: RoomPlayerInfo[];
  hostId: string;
  settings: {
    maxPlayers: number;
    startingDice: number;
    palificoEnabled: boolean;
    calzaEnabled: boolean;
    difficulty: string;
  };
  phase: 'waiting' | 'playing' | 'finished';
}

export interface PublicRoom {
  code: string;
  playerCount: number;
  maxPlayers: number;
  settings: {
    maxPlayers: number;
    startingDice: number;
    palificoEnabled: boolean;
    calzaEnabled: boolean;
  };
  hostName: string;
}

const SESSION_ID_KEY = 'dudo-session-id';

function getOrCreateSessionId(): string {
  let id = localStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

export function useMultiplayerConnection() {
  const socketRef = useRef<Socket | null>(null);
  const sessionId = useRef(getOrCreateSessionId());

  const [isConnected, setIsConnected] = useState(false);
  const [roomUpdate, setRoomUpdate] = useState<RoomUpdate | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [turnTimeRemaining, setTurnTimeRemaining] = useState<number>(20000);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Turn timer countdown
  const turnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTurnCountdown = useCallback((remaining: number) => {
    if (turnTimerRef.current) clearInterval(turnTimerRef.current);
    setTurnTimeRemaining(remaining);

    const startTime = Date.now();
    turnTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const left = Math.max(0, remaining - elapsed);
      setTurnTimeRemaining(left);
      if (left <= 0 && turnTimerRef.current) {
        clearInterval(turnTimerRef.current);
      }
    }, 100);
  }, []);

  // Connect to server
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const serverUrl = import.meta.env.PROD
      ? window.location.origin
      : 'http://localhost:3001';

    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setIsConnected(true);
      setIsReconnecting(false);
      socket.emit('register_session', { sessionId: sessionId.current });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsReconnecting(true);
    });

    socket.on('room_created', (_data: { roomCode: string }) => {
      // Room code is included in room_update
    });

    socket.on('room_update', (data: RoomUpdate) => {
      setRoomUpdate(data);
    });

    socket.on('game_state', (data: { state: GameState; turnTimeRemaining: number }) => {
      setGameState(data.state);
      setRoundResult(null); // Clear previous round result
      startTurnCountdown(data.turnTimeRemaining);
    });

    socket.on('round_result', (data: { result: RoundResult }) => {
      setRoundResult(data.result);
      if (turnTimerRef.current) clearInterval(turnTimerRef.current);
    });

    socket.on('new_round', () => {
      setRoundResult(null);
    });

    socket.on('turn_timeout', (_data: { playerId: string }) => {
      // Could show a notification
    });

    socket.on('game_over', (data: { winnerId: string }) => {
      setWinnerId(data.winnerId);
    });

    socket.on('player_disconnected', (_data: { playerId: string; graceSeconds: number }) => {
      // Update handled via room_update
    });

    socket.on('player_reconnected', (_data: { playerId: string }) => {
      // Update handled via room_update
    });

    socket.on('ai_takeover', (_data: { playerId: string; playerName: string }) => {
      // Could show notification
    });

    socket.on('room_list', (data: { rooms: PublicRoom[] }) => {
      setPublicRooms(data.rooms);
    });

    socket.on('error', (data: { message: string }) => {
      setError(data.message);
      setTimeout(() => setError(null), 3000);
    });

    socketRef.current = socket;
  }, [startTurnCountdown]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('leave_room');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setRoomUpdate(null);
    setGameState(null);
    setRoundResult(null);
    setWinnerId(null);
    if (turnTimerRef.current) clearInterval(turnTimerRef.current);
  }, []);

  // Actions
  const createRoom = useCallback((settings: {
    maxPlayers: number;
    startingDice: number;
    palificoEnabled: boolean;
    calzaEnabled: boolean;
    difficulty: string;
  }, isPublic: boolean, playerName: string) => {
    socketRef.current?.emit('create_room', {
      settings,
      isPublic,
      playerName,
      sessionId: sessionId.current,
    });
  }, []);

  const joinRoom = useCallback((code: string, playerName: string) => {
    socketRef.current?.emit('join_room', {
      code,
      playerName,
      sessionId: sessionId.current,
    });
  }, []);

  const quickMatch = useCallback((playerName: string) => {
    socketRef.current?.emit('quick_match', {
      playerName,
      sessionId: sessionId.current,
    });
  }, []);

  const listRooms = useCallback(() => {
    socketRef.current?.emit('list_rooms');
  }, []);

  const startGame = useCallback(() => {
    socketRef.current?.emit('start_game');
  }, []);

  const makeBid = useCallback((quantity: number, faceValue: number) => {
    socketRef.current?.emit('make_bid', { quantity, faceValue });
  }, []);

  const challenge = useCallback(() => {
    socketRef.current?.emit('challenge');
  }, []);

  const calza = useCallback(() => {
    socketRef.current?.emit('calza');
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('leave_room');
    setRoomUpdate(null);
    setGameState(null);
    setRoundResult(null);
    setWinnerId(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (turnTimerRef.current) clearInterval(turnTimerRef.current);
      socketRef.current?.disconnect();
    };
  }, []);

  return {
    sessionId: sessionId.current,
    isConnected,
    isReconnecting,
    roomUpdate,
    gameState,
    turnTimeRemaining,
    roundResult,
    error,
    publicRooms,
    winnerId,
    connect,
    disconnect,
    createRoom,
    joinRoom,
    quickMatch,
    listRooms,
    startGame,
    makeBid,
    challenge,
    calza,
    leaveRoom,
  };
}
