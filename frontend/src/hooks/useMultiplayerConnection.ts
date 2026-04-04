import { useState, useCallback, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState, RoundResult } from '@dudo-dice/shared';
import { ProfileStorage } from '../utils/profileStorage';

export interface RoomPlayerInfo {
  id: string;
  name: string;
  isConnected: boolean;
  isAI: boolean;
  rating: number | null;
  provisional: boolean | null;
}

export interface RoomUpdate {
  roomCode: string;
  players: RoomPlayerInfo[];
  hostId: string | null;
  settings: {
    maxPlayers: number;
    startingDice: number;
    palificoEnabled: boolean;
    calzaEnabled: boolean;
    difficulty: string;
  };
  phase: 'waiting' | 'playing' | 'finished';
  startWithBotsVotes: string[];
  isRanked: boolean;
}

export interface RatingUpdate {
  playerId: string;
  oldRating: number;
  newRating: number;
  delta: number;
  placement: number;
  isRanked: boolean;
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
  hostRating?: number | null;
  hostProvisional?: boolean | null;
}

type StoredSeat = {
  playerId: string;
  reconnectToken: string;
  roomCode: string;
};

const MULTIPLAYER_SEAT_STORAGE_KEY = 'dudo-multiplayer-seat';

function getStoredSeat(): StoredSeat | null {
  try {
    const raw = sessionStorage.getItem(MULTIPLAYER_SEAT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredSeat>;
    if (!parsed.playerId || !parsed.reconnectToken || !parsed.roomCode) {
      return null;
    }

    return {
      playerId: parsed.playerId,
      reconnectToken: parsed.reconnectToken,
      roomCode: parsed.roomCode,
    };
  } catch {
    return null;
  }
}

function persistSeat(seat: StoredSeat | null): void {
  if (!seat) {
    sessionStorage.removeItem(MULTIPLAYER_SEAT_STORAGE_KEY);
    return;
  }

  sessionStorage.setItem(MULTIPLAYER_SEAT_STORAGE_KEY, JSON.stringify(seat));
}

export function useMultiplayerConnection() {
  const socketRef = useRef<Socket | null>(null);
  const seatRef = useRef<StoredSeat | null>(getStoredSeat());
  const pendingJoinRef = useRef<{ code: string; playerName: string } | null>(null);

  const [playerId, setPlayerId] = useState<string | null>(seatRef.current?.playerId ?? null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomUpdate, setRoomUpdate] = useState<RoomUpdate | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [turnTimeRemaining, setTurnTimeRemaining] = useState<number>(20000);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [ratingUpdate, setRatingUpdate] = useState<RatingUpdate | null>(null);
  const [isRanked, setIsRanked] = useState(false);

  const turnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearSeat = useCallback(() => {
    seatRef.current = null;
    setPlayerId(null);
    persistSeat(null);
  }, []);

  const bindSeat = useCallback((seat: StoredSeat) => {
    seatRef.current = seat;
    setPlayerId(seat.playerId);
    persistSeat(seat);
  }, []);

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

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const serverUrl = import.meta.env.VITE_SERVER_URL
      || (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001');

    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setIsConnected(true);

      if (seatRef.current?.reconnectToken) {
        setIsReconnecting(true);
        socket.emit('register_session', { reconnectToken: seatRef.current.reconnectToken });
      } else {
        setIsReconnecting(false);
      }

      // Handle deep-link join (e.g. /online/join/:roomCode)
      if (pendingJoinRef.current) {
        const { code, playerName } = pendingJoinRef.current;
        pendingJoinRef.current = null;
        socket.emit('join_room', { code, playerName, persistentId: ProfileStorage.getPersistentPlayerId() });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsReconnecting(!!seatRef.current?.reconnectToken);
    });

    socket.on('session_bound', (data: StoredSeat & { persistentId?: string }) => {
      bindSeat(data);
      setIsReconnecting(false);
      if (data.persistentId) {
        const profile = ProfileStorage.getProfile();
        if (profile.persistentPlayerId !== data.persistentId) {
          profile.persistentPlayerId = data.persistentId;
          ProfileStorage.saveProfile(profile);
        }
      }
    });

    socket.on('room_created', () => {
      // Room code is included in room_update and session_bound.
    });

    socket.on('room_update', (data: RoomUpdate) => {
      setRoomUpdate(data);
    });

    socket.on('game_state', (data: { state: GameState; turnTimeRemaining: number; isRanked?: boolean }) => {
      setGameState(data.state);
      setRoundResult(null);
      startTurnCountdown(data.turnTimeRemaining);
      if (data.isRanked !== undefined) setIsRanked(data.isRanked);
    });

    socket.on('round_result', (data: { result: RoundResult }) => {
      setRoundResult(data.result);
      if (turnTimerRef.current) clearInterval(turnTimerRef.current);
    });

    socket.on('new_round', () => {
      setRoundResult(null);
    });

    socket.on('game_over', (data: { winnerId: string }) => {
      setWinnerId(data.winnerId);
    });

    socket.on('rating_update', (data: RatingUpdate) => {
      setRatingUpdate(data);
      // Sync to local profile
      const won = data.placement === 1;
      ProfileStorage.updateRankedRating(data.newRating, data.delta, won, false);
    });

    socket.on('room_list', (data: { rooms: PublicRoom[] }) => {
      setPublicRooms(data.rooms);
    });

    socket.on('error', (data: { message: string }) => {
      setError(data.message);
      if (/reconnect failed/i.test(data.message)) {
        clearSeat();
        setIsReconnecting(false);
      }
      setTimeout(() => setError(null), 3000);
    });

    socketRef.current = socket;
  }, [bindSeat, clearSeat, startTurnCountdown]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('leave_room');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    clearSeat();
    setIsConnected(false);
    setIsReconnecting(false);
    setRoomUpdate(null);
    setGameState(null);
    setRoundResult(null);
    setWinnerId(null);
    setRatingUpdate(null);
    setIsRanked(false);
    if (turnTimerRef.current) clearInterval(turnTimerRef.current);
  }, [clearSeat]);

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
      persistentId: ProfileStorage.getPersistentPlayerId(),
    });
  }, []);

  const joinRoom = useCallback((code: string, playerName: string) => {
    socketRef.current?.emit('join_room', {
      code,
      playerName,
      persistentId: ProfileStorage.getPersistentPlayerId(),
    });
  }, []);

  const quickMatch = useCallback((playerName: string) => {
    socketRef.current?.emit('quick_match', {
      playerName,
      persistentId: ProfileStorage.getPersistentPlayerId(),
    });
  }, []);

  const listRooms = useCallback(() => {
    socketRef.current?.emit('list_rooms');
  }, []);

  const startGame = useCallback(() => {
    socketRef.current?.emit('start_game');
  }, []);

  const voteStartWithBots = useCallback(() => {
    socketRef.current?.emit('vote_start_with_bots');
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

  const connectAndJoin = useCallback((code: string, playerName: string) => {
    pendingJoinRef.current = { code, playerName };
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_room', { code, playerName, persistentId: ProfileStorage.getPersistentPlayerId() });
      pendingJoinRef.current = null;
    } else {
      connect();
    }
  }, [connect]);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('leave_room');
    clearSeat();
    setRoomUpdate(null);
    setGameState(null);
    setRoundResult(null);
    setWinnerId(null);
  }, [clearSeat]);

  useEffect(() => {
    return () => {
      if (turnTimerRef.current) clearInterval(turnTimerRef.current);
      socketRef.current?.disconnect();
    };
  }, []);

  return {
    playerId,
    isConnected,
    isReconnecting,
    roomUpdate,
    gameState,
    turnTimeRemaining,
    roundResult,
    error,
    publicRooms,
    winnerId,
    ratingUpdate,
    isRanked,
    connect,
    connectAndJoin,
    disconnect,
    createRoom,
    joinRoom,
    quickMatch,
    listRooms,
    startGame,
    voteStartWithBots,
    makeBid,
    challenge,
    calza,
    leaveRoom,
  };
}
