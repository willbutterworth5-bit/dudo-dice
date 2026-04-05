import { randomUUID } from 'node:crypto';
import { GameEngine, GameState, Bid, RoundResult, AIPlayer, PlayerConfig, Difficulty } from '@dudo-dice/shared';
import type { RatingStore } from './RatingStore.js';
import { calculateElo } from './Elo.js';
import type { EloResult } from './Elo.js';

function pickBotNames(count: number, taken: string[]): string[] {
  const names: string[] = [];
  let n = 1;
  while (names.length < count) {
    const name = `DudoBot ${n++}`;
    if (!taken.includes(name)) names.push(name);
  }
  return names;
}

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
  persistentId: string;     // stable ID for rating tracking (from client localStorage)
  forfeited: boolean;       // true if disconnected and didn't return in time
}

export type RoomPhase = 'waiting' | 'playing' | 'finished';

const TURN_TIMEOUT_MS = 20_000;
const RECONNECT_GRACE_MS = 120_000;
const RANKED_FORFEIT_MS = 60_000;
const ROUND_ADVANCE_DELAY_MS = 3_000;

export class Room {
  readonly code: string;
  readonly isPublic: boolean;
  hostId: string | null = null;
  settings: RoomSettings;
  players: RoomPlayer[] = [];
  phase: RoomPhase = 'waiting';
  startWithBotsVotes: Set<string> = new Set();

  // Ranked match tracking
  eliminationOrder: string[] = [];
  humanCountAtStart = 0;
  isRanked = false;
  matchFinalized = false;

  // Callbacks for rating updates
  onRatingUpdate: ((results: EloResult[], placements: Map<string, number>) => void) | null = null;

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

  addPlayer(socketId: string, name: string, persistentId?: string): RoomPlayer | null {
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
      persistentId: persistentId || randomUUID(),
      forfeited: false,
    };

    this.players.push(player);
    if (!this.hostId) {
      this.hostId = player.id;
    }

    return player;
  }

  removePlayer(playerId: string): void {
    this.players = this.players.filter((player) => player.id !== playerId);
    this.startWithBotsVotes.delete(playerId);
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

    // Ranked matches use shorter grace period (60s vs 120s)
    const graceMs = this.isRanked ? RANKED_FORFEIT_MS : RECONNECT_GRACE_MS;
    const graceSeconds = Math.round(graceMs / 1000);
    this.onPlayerDisconnected?.(playerId, graceSeconds);

    setTimeout(() => {
      if (!player.isConnected && this.phase === 'playing') {
        player.isAI = true;
        // Mark as forfeited for ranked rating penalty
        if (this.isRanked && !player.forfeited) {
          player.forfeited = true;
        }
        this.onAITakeover?.(playerId, player.name);
        this.checkAITurn();
      }
    }, graceMs);
  }

  /** Vote to start with bots filling empty slots. Returns true if all human players have now voted. */
  voteStartWithBots(playerId: string): boolean {
    const player = this.players.find(p => p.id === playerId && !p.isAI);
    if (!player || this.phase !== 'waiting') return false;
    this.startWithBotsVotes.add(playerId);
    const humanPlayers = this.players.filter(p => !p.isAI);
    return humanPlayers.length >= 1 && humanPlayers.every(p => this.startWithBotsVotes.has(p.id));
  }

  getStartWithBotsVotes(): string[] {
    return [...this.startWithBotsVotes];
  }

  /** Fill empty slots with AI bots and start the game. */
  startWithBots(): boolean {
    if (this.phase !== 'waiting') return false;
    const humanCount = this.players.filter(p => !p.isAI).length;
    if (humanCount < 1) return false;

    const botsNeeded = this.settings.maxPlayers - this.players.length;
    const takenNames = this.players.map(p => p.name);
    const botNames = pickBotNames(botsNeeded, takenNames);
    for (let i = 0; i < botsNeeded; i++) {
      this.players.push({
        id: randomUUID(),
        reconnectToken: '',
        socketId: '',
        name: botNames[i] ?? `Bot ${i + 1}`,
        isConnected: true,
        isAI: true,
        disconnectedAt: null,
        persistentId: '',
        forfeited: false,
      });
    }

    return this.startGame();
  }

  startGame(): boolean {
    if (this.phase !== 'waiting') return false;
    if (this.players.length < 2) return false;

    const playerConfigs: PlayerConfig[] = this.players.map((player) => ({
      id: player.id,
      name: player.name,
      isHuman: !player.isAI,
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

    // Ranked match detection: 3+ human players required
    this.humanCountAtStart = this.players.filter(p => !p.isAI).length;
    this.isRanked = this.humanCountAtStart >= 3;
    this.eliminationOrder = [];
    this.matchFinalized = false;

    this.phase = 'playing';
    this.startTurnTimer();
    this.checkAITurn();
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

    // Track newly eliminated players (diceCount === 0, not yet in eliminationOrder)
    for (const player of state.players) {
      if (player.diceCount === 0 && !this.eliminationOrder.includes(player.id)) {
        this.eliminationOrder.push(player.id);
      }
    }

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
    }, 1500 + Math.floor(Math.random() * 1000));
  }

  /**
   * Compute final placements from elimination order.
   * Winner = 1st, last eliminated = 2nd, etc.
   * Forfeited players are forced to last place among humans.
   */
  computePlacements(): Map<string, number> {
    const state = this.engine?.getState();
    const placements = new Map<string, number>();
    if (!state) return placements;

    // Winner is the player still standing
    const winner = state.players.find(p => p.diceCount > 0);
    const humanPlayers = this.players.filter(p => !p.isAI || p.forfeited);

    // Build placement list: winner first, then reverse elimination order
    // Forfeited players go to last place regardless of when they were actually eliminated
    const nonForfeited: string[] = [];
    const forfeited: string[] = [];

    for (const hp of humanPlayers) {
      if (hp.forfeited) {
        forfeited.push(hp.id);
      } else {
        nonForfeited.push(hp.id);
      }
    }

    // Order non-forfeited: winner first, then reverse elimination order
    const ordered: string[] = [];
    if (winner && nonForfeited.includes(winner.id)) {
      ordered.push(winner.id);
    }
    // Reverse elimination order: last eliminated = best placement (after winner)
    const eliminatedNonForfeited = [...this.eliminationOrder]
      .reverse()
      .filter(id => nonForfeited.includes(id) && id !== winner?.id);
    ordered.push(...eliminatedNonForfeited);

    // Forfeited players go last
    ordered.push(...forfeited);

    // Assign placements (1-indexed)
    for (let i = 0; i < ordered.length; i++) {
      placements.set(ordered[i], i + 1);
    }

    return placements;
  }

  /**
   * Finalize match and compute Elo rating changes.
   * Called once when game ends. Idempotent via matchFinalized flag.
   */
  finalizeMatch(ratingStore: RatingStore): EloResult[] {
    if (this.matchFinalized) return [];
    this.matchFinalized = true;

    if (!this.isRanked) return [];

    const placements = this.computePlacements();
    if (placements.size < 2) return [];

    // Build EloPlayer array from human players only
    const eloPlayers = this.players
      .filter(p => !p.isAI || p.forfeited) // include forfeited (originally human)
      .filter(p => p.persistentId && placements.has(p.id))
      .map(p => {
        const rating = ratingStore.getOrCreate(p.persistentId);
        return {
          id: p.id,
          rating: rating.rating,
          gamesPlayed: rating.gamesPlayed,
        };
      });

    const results = calculateElo(eloPlayers, placements);

    // Apply rating updates
    const winner = [...placements.entries()].find(([, place]) => place === 1)?.[0];
    for (const result of results) {
      const roomPlayer = this.players.find(rp => rp.id === result.playerId);
      if (!roomPlayer?.persistentId) continue;
      ratingStore.update(
        roomPlayer.persistentId,
        result.delta,
        result.playerId === winner,
        roomPlayer.forfeited,
      );
    }

    // Notify via callback
    this.onRatingUpdate?.(results, placements);

    return results;
  }

  cleanup(): void {
    this.clearTurnTimer();
    if (this.roundAdvanceTimer) {
      clearTimeout(this.roundAdvanceTimer);
      this.roundAdvanceTimer = null;
    }
  }
}
