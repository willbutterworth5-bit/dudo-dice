import { randomUUID } from 'node:crypto';
import { GameEngine, GameState, Bid, RoundResult, AIPlayer, PlayerConfig, Difficulty } from '@dudo-dice/shared';

export interface RoomSettings {
  maxPlayers: number;
  startingDice: number;
  palificoEnabled: boolean;
  calzaEnabled: boolean;
  difficulty: Difficulty;
}

export interface RoomPlayer {
  id: string;
  reconnectToken: string;
  socketId: string;
  name: string;
  isConnected: boolean;
  isAI: boolean;
  disconnectedAt: number | null;
}

export type RoomPhase = 'waiting' | 'playing' | 'finished';

const TURN_TIMEOUT_MS = 20_000;
const RECONNECT_GRACE_MS = 120_000;
const ROUND_ADVANCE_DELAY_MS = 3_000;

export class Room {
  readonly code: string;
  readonly isPublic: boolean;
  hostId: string | null = null;
  settings: RoomSettings;
  players: RoomPlayer[] = [];
  phase: RoomPhase = 'waiting';

  private engine: GameEngine | null = null;
  private aiPlayer: AIPlayer | null = null;
  private turnTimer: ReturnType<typeof setTimeout> | null = null;
  private roundAdvanceTimer: ReturnType<typeof setTimeout> | null = null;
  private turnStartTime = 0;

  onBroadcastState: ((excludePlayerId?: string) => void) | null = null;
  onBroadcastRoundResult: ((result: RoundResult) => void) | null = null;
  onBroadcastNewRound: (() => void) | null = null;
  onTurnTimeout: ((playerId: string) => void) | null = null;
  onGameOver: ((winnerId: string) => void) | null = null;
  onPlayerDisconnected: ((playerId: string, graceSeconds: number) => void) | null = null;
  onPlayerReconnected: ((playerId: string) => void) | null = null;
  onAITakeover: ((playerId: string, playerName: string) => void) | null = null;

  constructor(code: string, settings: RoomSettings, isPublic: boolean) {
    this.code = code;
    this.settings = settings;
    this.isPublic = isPublic;
    this.aiPlayer = new AIPlayer(settings.difficulty);
  }

  addPlayer(socketId: string, name: string): RoomPlayer | null {
    if (this.phase !== 'waiting') return null;
    if (this.players.length >= this.settings.maxPlayers) return null;

    const player: RoomPlayer = {
      id: randomUUID(),
      reconnectToken: randomUUID(),
      socketId,
      name,
      isConnected: true,
      isAI: false,
      disconnectedAt: null,
    };

    this.players.push(player);
    if (!this.hostId) {
      this.hostId = player.id;
    }

    return player;
  }

  removePlayer(playerId: string): void {
    this.players = this.players.filter((player) => player.id !== playerId);
    if (this.hostId === playerId) {
      this.hostId = this.players[0]?.id ?? null;
    }
  }

  getPlayer(playerId: string): RoomPlayer | undefined {
    return this.players.find((player) => player.id === playerId);
  }

  getPlayerByReconnectToken(reconnectToken: string): RoomPlayer | undefined {
    return this.players.find((player) => player.reconnectToken === reconnectToken);
  }

  reconnectPlayer(playerId: string, socketId: string): RoomPlayer | null {
    const player = this.players.find((candidate) => candidate.id === playerId);
    if (!player) return null;
    if (player.isConnected) return null;

    player.socketId = socketId;
    player.isConnected = true;
    player.isAI = false;
    player.disconnectedAt = null;
    player.reconnectToken = randomUUID();

    this.onPlayerReconnected?.(playerId);
    return player;
  }

  handleDisconnect(playerId: string): void {
    const player = this.players.find((candidate) => candidate.id === playerId);
    if (!player) return;

    if (this.phase === 'waiting') {
      this.removePlayer(playerId);
      return;
    }

    player.isConnected = false;
    player.disconnectedAt = Date.now();

    const graceSeconds = Math.round(RECONNECT_GRACE_MS / 1000);
    this.onPlayerDisconnected?.(playerId, graceSeconds);

    setTimeout(() => {
      if (!player.isConnected && this.phase === 'playing') {
        player.isAI = true;
        this.onAITakeover?.(playerId, player.name);
        this.checkAITurn();
      }
    }, RECONNECT_GRACE_MS);
  }

  startGame(): boolean {
    if (this.phase !== 'waiting') return false;
    if (this.players.length < 2) return false;

    const playerConfigs: PlayerConfig[] = this.players.map((player) => ({
      id: player.id,
      name: player.name,
      isHuman: true,
    }));

    this.engine = new GameEngine(
      {
        playerCount: this.players.length,
        startingDice: this.settings.startingDice,
        analysisEnabled: false,
        palificoEnabled: this.settings.palificoEnabled,
        calzaEnabled: this.settings.calzaEnabled,
      },
      playerConfigs
    );

    this.phase = 'playing';
    this.startTurnTimer();
    return true;
  }

  getState(): GameState | null {
    return this.engine?.getState() ?? null;
  }

  getSanitisedStateForPlayer(playerId: string): GameState | null {
    const state = this.engine?.getState();
    if (!state) return null;

    return {
      ...state,
      players: state.players.map((player) => ({
        ...player,
        dice: player.id === playerId ? player.dice : [],
      })),
    };
  }

  makeBid(playerId: string, quantity: number, faceValue: number): { success: boolean; reason?: string } {
    if (!this.engine || this.phase !== 'playing') {
      return { success: false, reason: 'Game not in progress' };
    }

    const state = this.engine.getState();
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      return { success: false, reason: 'Not your turn' };
    }

    const bid: Bid = { quantity, faceValue, playerId };
    const result = this.engine.makeBid(bid);

    if (result.success) {
      this.clearTurnTimer();
      this.onBroadcastState?.();
      this.startTurnTimer();
      this.checkAITurn();
    }

    return result;
  }

  challenge(playerId: string): RoundResult | null {
    if (!this.engine || this.phase !== 'playing') return null;

    const state = this.engine.getState();
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return null;
    if (!state.currentBid) return null;

    this.clearTurnTimer();
    const result = this.engine.challengeBid(playerId);

    this.onBroadcastRoundResult?.(result);
    this.handlePostRound();
    return result;
  }

  calza(playerId: string): RoundResult | null {
    if (!this.engine || this.phase !== 'playing') return null;

    const state = this.engine.getState();
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return null;
    if (!state.currentBid) return null;

    this.clearTurnTimer();
    const result = this.engine.callCalza(playerId);

    this.onBroadcastRoundResult?.(result);
    this.handlePostRound();
    return result;
  }

  private handlePostRound(): void {
    const state = this.engine!.getState();

    if (state.gamePhase === 'gameOver') {
      this.phase = 'finished';
      const winner = state.players.find((player) => player.diceCount > 0);
      if (winner) {
        this.onGameOver?.(winner.id);
      }
      return;
    }

    this.roundAdvanceTimer = setTimeout(() => {
      this.onBroadcastNewRound?.();
      this.onBroadcastState?.();
      this.startTurnTimer();
      this.checkAITurn();
    }, ROUND_ADVANCE_DELAY_MS);
  }

  private startTurnTimer(): void {
    if (!this.engine) return;

    this.turnStartTime = Date.now();
    this.turnTimer = setTimeout(() => {
      this.handleTurnTimeout();
    }, TURN_TIMEOUT_MS);
  }

  private clearTurnTimer(): void {
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }
  }

  getTurnTimeRemaining(): number {
    if (!this.turnStartTime) return TURN_TIMEOUT_MS;
    const elapsed = Date.now() - this.turnStartTime;
    return Math.max(0, TURN_TIMEOUT_MS - elapsed);
  }

  private handleTurnTimeout(): void {
    if (!this.engine || this.phase !== 'playing') return;

    const state = this.engine.getState();
    const currentPlayer = state.players[state.currentPlayerIndex];

    this.onTurnTimeout?.(currentPlayer.id);

    if (state.currentBid) {
      this.challenge(currentPlayer.id);
    } else {
      this.makeBid(currentPlayer.id, 1, 2);
    }
  }

  private checkAITurn(): void {
    if (!this.engine || this.phase !== 'playing') return;

    const state = this.engine.getState();
    const currentPlayer = state.players[state.currentPlayerIndex];
    const roomPlayer = this.players.find((player) => player.id === currentPlayer.id);

    if (!roomPlayer?.isAI) return;

    setTimeout(() => {
      if (!this.engine || this.phase !== 'playing') return;

      const freshState = this.engine.getState();
      const aiState = freshState.players[freshState.currentPlayerIndex];
      if (aiState.id !== currentPlayer.id) return;

      const decision = this.aiPlayer!.makeDecision(freshState, aiState);

      if (decision === 'challenge') {
        this.challenge(currentPlayer.id);
      } else if (decision === 'calza') {
        this.calza(currentPlayer.id);
      } else {
        const bid = this.aiPlayer!.generateBid(freshState, aiState);
        if (bid) {
          this.makeBid(currentPlayer.id, bid.quantity, bid.faceValue);
        } else {
          this.challenge(currentPlayer.id);
        }
      }
    }, 1500 + Math.random() * 1000);
  }

  cleanup(): void {
    this.clearTurnTimer();
    if (this.roundAdvanceTimer) {
      clearTimeout(this.roundAdvanceTimer);
      this.roundAdvanceTimer = null;
    }
  }
}
