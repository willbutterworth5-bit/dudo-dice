import { GameState, Bid, BidRecord, Player, RoundResult, GameSettings, PLAYER_COLORS } from './GameState.js';
import { BidValidator } from './BidValidator.js';
import { DiceCounter } from './DiceCounter.js';
import { AIPlayer } from './AIPlayer.js';

export interface PlayerConfig {
  id: string;
  name: string;
  isHuman: boolean;
}

export class GameEngine {
  private state: GameState;

  constructor(settings: GameSettings, playerConfigs?: PlayerConfig[]) {
    this.state = this.initializeGame(settings, playerConfigs);
  }

  private initializeGame(settings: GameSettings, playerConfigs?: PlayerConfig[]): GameState {
    const players: Player[] = [];

    if (playerConfigs) {
      // Multiplayer or custom config: use provided player configs
      for (let i = 0; i < playerConfigs.length; i++) {
        const config = playerConfigs[i];
        players.push({
          id: config.id,
          name: config.name,
          dice: this.rollDice(settings.startingDice),
          diceCount: settings.startingDice,
          isHuman: config.isHuman,
          color: PLAYER_COLORS[i % PLAYER_COLORS.length],
        });
      }
    } else {
      // Default single-player layout (local mode):
      // First 3 AI players, then human, then remaining AI
      for (let i = 0; i < Math.min(3, settings.playerCount - 1); i++) {
        players.push({
          id: `player-${i + 1}`,
          name: `Computer ${i + 1}`,
          dice: this.rollDice(settings.startingDice),
          diceCount: settings.startingDice,
          isHuman: false,
          color: PLAYER_COLORS[i + 1],
        });
      }

      players.push({
        id: 'player-0',
        name: 'You',
        dice: this.rollDice(settings.startingDice),
        diceCount: settings.startingDice,
        isHuman: true,
        color: PLAYER_COLORS[0],
      });

      for (let i = 3; i < settings.playerCount - 1; i++) {
        players.push({
          id: `player-${i + 1}`,
          name: `Computer ${i + 1}`,
          dice: this.rollDice(settings.startingDice),
          diceCount: settings.startingDice,
          isHuman: false,
          color: PLAYER_COLORS[i + 1],
        });
      }
    }

    const startingPlayerIndex = Math.floor(Math.random() * players.length);

    return {
      players,
      currentPlayerIndex: startingPlayerIndex,
      currentBid: null,
      bidSequence: [],
      currentRoundBids: [],
      gamePhase: 'bidding',
      roundHistory: [],
      settings,
      palificoMode: {
        active: false,
        lockedFaceValue: null,
      },
      turnDelay: 3000,
      roundNumber: 1,
    };
  }

  private rollDice(count: number): number[] {
    const dice: number[] = [];
    for (let i = 0; i < count; i++) {
      dice.push(Math.floor(Math.random() * 6) + 1);
    }
    return dice;
  }

  getState(): GameState {
    return {
      ...this.state,
      players: this.state.players.map(p => ({ ...p, dice: [...p.dice] })),
      bidSequence: [...this.state.bidSequence],
      currentRoundBids: [...this.state.currentRoundBids],
      roundHistory: [...this.state.roundHistory],
      palificoMode: { ...this.state.palificoMode },
    };
  }

  makeBid(bid: Bid): { success: boolean; reason?: string } {
    if (this.state.gamePhase !== 'bidding') {
      return { success: false, reason: 'Not in bidding phase' };
    }

    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    if (currentPlayer.id !== bid.playerId) {
      return { success: false, reason: 'Not your turn' };
    }

    const validation = BidValidator.validateBid(
      bid,
      this.state.currentBid,
      this.state.palificoMode
    );

    if (!validation.valid) {
      return { success: false, reason: validation.reason };
    }

    if (this.state.settings.palificoEnabled && !this.state.palificoMode.active && BidValidator.checkPalificoStart(bid, currentPlayer.diceCount)) {
      this.state.palificoMode = {
        active: true,
        lockedFaceValue: bid.faceValue,
      };
    }

    this.state.currentBid = bid;
    this.state.bidSequence.push({ ...bid });

    const humanPlayer = this.state.players.find(p => p.isHuman);
    const record: BidRecord = {
      playerId: bid.playerId,
      bid: { quantity: bid.quantity, faceValue: bid.faceValue },
      humanDice: humanPlayer ? [...humanPlayer.dice] : [],
      totalDiceOnBoard: this.state.players.reduce((sum, p) => sum + p.diceCount, 0),
      palificoMode: this.state.palificoMode.active,
    };
    this.state.currentRoundBids.push(record);

    this.nextPlayer();

    return { success: true };
  }

  challengeBid(challengerId: string): RoundResult {
    if (!this.state.currentBid) {
      throw new Error('No bid to challenge');
    }

    const challengedBid = this.state.currentBid;
    const actualCount = DiceCounter.countDice(
      this.state.players,
      challengedBid.faceValue,
      this.state.palificoMode
    );

    const bidderWon = actualCount >= challengedBid.quantity;
    const winnerId = bidderWon ? challengedBid.playerId : challengerId;
    const loserId = bidderWon ? challengerId : challengedBid.playerId;

    const allDice = this.state.players.map(p => ({
      playerId: p.id,
      dice: [...p.dice],
    }));

    const roundResult: RoundResult = {
      round: this.state.roundNumber,
      challengeType: 'dudo',
      challengedBid,
      actualCount,
      challengerId,
      bidderId: challengedBid.playerId,
      winnerId,
      loserId,
      allDice,
      bids: [...this.state.currentRoundBids],
    };

    const loser = this.state.players.find(p => p.id === loserId);
    if (loser && loser.diceCount > 0) {
      loser.diceCount--;
      if (loser.diceCount > 0) {
        loser.dice = this.rollDice(loser.diceCount);
      } else {
        loser.dice = [];
      }
    }

    const playersWithDice = this.state.players.filter(p => p.diceCount > 0);
    if (playersWithDice.length === 1) {
      this.state.gamePhase = 'gameOver';
    } else {
      const nextRoundStarterId = (loser && loser.diceCount > 0) ? loserId : winnerId;
      this.startNewRound(nextRoundStarterId);
    }

    this.state.roundHistory.push(roundResult);
    return roundResult;
  }

  callCalza(challengerId: string): RoundResult {
    if (!this.state.currentBid) {
      throw new Error('No bid to calza');
    }

    const challengedBid = this.state.currentBid;
    const actualCount = DiceCounter.countDice(
      this.state.players,
      challengedBid.faceValue,
      this.state.palificoMode
    );
    const isExact = actualCount === challengedBid.quantity;

    const allDice = this.state.players.map(p => ({
      playerId: p.id,
      dice: [...p.dice],
    }));

    const caller = this.state.players.find(p => p.id === challengerId)!;

    if (isExact) {
      if (caller.diceCount < this.state.settings.startingDice) {
        caller.diceCount++;
        caller.dice = this.rollDice(caller.diceCount);
      }
    } else {
      caller.diceCount--;
      caller.dice = caller.diceCount > 0 ? this.rollDice(caller.diceCount) : [];
    }

    const roundResult: RoundResult = {
      round: this.state.roundNumber,
      challengeType: 'calza',
      calzaSuccess: isExact,
      challengedBid,
      actualCount,
      challengerId,
      bidderId: challengedBid.playerId,
      winnerId: isExact ? challengerId : challengedBid.playerId,
      loserId: isExact ? '' : challengerId,
      allDice,
      bids: [...this.state.currentRoundBids],
    };

    const playersWithDice = this.state.players.filter(p => p.diceCount > 0);
    if (playersWithDice.length === 1) {
      this.state.gamePhase = 'gameOver';
    } else {
      const callerEliminated = !isExact && caller.diceCount === 0;
      const nextStarterId = callerEliminated ? challengedBid.playerId : challengerId;
      this.startNewRound(nextStarterId);
    }

    this.state.roundHistory.push(roundResult);
    return roundResult;
  }

  private startNewRound(startingPlayerId: string) {
    const startingPlayerIndex = this.state.players.findIndex(p => p.id === startingPlayerId);
    this.state.currentPlayerIndex = startingPlayerIndex;
    this.state.currentBid = null;
    this.state.bidSequence = [];
    this.state.currentRoundBids = [];
    this.state.palificoMode = {
      active: false,
      lockedFaceValue: null,
    };
    this.state.roundNumber++;
    this.state.gamePhase = 'bidding';

    for (const player of this.state.players) {
      if (player.diceCount > 0) {
        player.dice = this.rollDice(player.diceCount);
      }
    }
  }

  private nextPlayer() {
    this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;

    let attempts = 0;
    while (
      this.state.players[this.state.currentPlayerIndex].diceCount === 0 &&
      attempts < this.state.players.length
    ) {
      this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
      attempts++;
    }
  }

  getCurrentPlayer(): Player {
    return this.state.players[this.state.currentPlayerIndex];
  }

  isGameOver(): boolean {
    return this.state.gamePhase === 'gameOver';
  }

  getWinner(): Player | null {
    if (!this.isGameOver()) {
      return null;
    }
    return this.state.players.find(p => p.diceCount > 0) || null;
  }

  /**
   * Auto-play all remaining rounds using AI logic until a winner is decided.
   * Intended to be called after the human player has been eliminated so the
   * remaining AI players finish the game instantly.
   */
  simulateToEnd(difficulty: 'easy' | 'medium' | 'hard' = 'medium'): void {
    const ai = new AIPlayer(difficulty);
    const MAX_TURNS = 5000; // safety limit
    let turns = 0;

    while (!this.isGameOver() && turns < MAX_TURNS) {
      turns++;
      const player = this.getCurrentPlayer();

      const decision = ai.makeDecision(this.state, player);

      if (decision === 'challenge') {
        this.challengeBid(player.id);
      } else if (decision === 'calza') {
        this.callCalza(player.id);
      } else {
        const bid = ai.generateBid(this.state, player);
        if (bid) {
          this.makeBid(bid);
        } else {
          // Fallback: challenge if no valid bid can be generated
          this.challengeBid(player.id);
        }
      }
    }
  }
}
