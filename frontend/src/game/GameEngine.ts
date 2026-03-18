import { GameState, Bid, BidRecord, Player, RoundResult, GameSettings, PLAYER_COLORS } from './GameState';
import { BidValidator } from './BidValidator';
import { DiceCounter } from './DiceCounter';
import { ProfileStorage } from '../utils/profileStorage';

export class GameEngine {
  private state: GameState;

  constructor(settings: GameSettings) {
    this.state = this.initializeGame(settings);
  }

  private initializeGame(settings: GameSettings): GameState {
    const players: Player[] = [];
    
    // Create players in order: first 3 AI players, then human player, then remaining AI players
    // This places human player between 4 o'clock and 8 o'clock positions
    
    // First 3 AI players (will be at 12, 2, 4 o'clock)
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
    
    // Human player (will be at 6 o'clock, rendered separately at bottom)
    // Get player name from profile storage
    let humanPlayerName = 'You';
    try {
      const profile = ProfileStorage.getProfile();
      if (profile && profile.name && profile.name.trim()) {
        humanPlayerName = profile.name.trim();
      }
      // Extra safety: if name is empty after trimming, use 'You'
      if (!humanPlayerName || humanPlayerName.trim() === '') {
        humanPlayerName = 'You';
      }
    } catch (e) {
      console.error('Error loading profile name:', e);
      // On error, ensure we still use 'You'
      humanPlayerName = 'You';
    }
    
    players.push({
      id: 'player-0',
      name: humanPlayerName,
      dice: this.rollDice(settings.startingDice),
      diceCount: settings.startingDice,
      isHuman: true,
      color: PLAYER_COLORS[0],
    });
    
    // Remaining AI players (will be at 8, 10 o'clock, etc.)
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

    // Randomize starting player
    const startingPlayerIndex = Math.floor(Math.random() * settings.playerCount);

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

  /**
   * Make a bid
   */
  makeBid(bid: Bid): { success: boolean; reason?: string } {
    if (this.state.gamePhase !== 'bidding') {
      return { success: false, reason: 'Not in bidding phase' };
    }

    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    if (currentPlayer.id !== bid.playerId) {
      return { success: false, reason: 'Not your turn' };
    }

    // Validate bid
    const validation = BidValidator.validateBid(
      bid,
      this.state.currentBid,
      this.state.palificoMode
    );

    if (!validation.valid) {
      return { success: false, reason: validation.reason };
    }

    // Check if this starts palifico mode (only if enabled and player has one die)
    if (this.state.settings.palificoEnabled && !this.state.palificoMode.active && BidValidator.checkPalificoStart(bid, currentPlayer.diceCount)) {
      this.state.palificoMode = {
        active: true,
        lockedFaceValue: bid.faceValue,
      };
    }

    this.state.currentBid = bid;
    this.state.bidSequence.push({ ...bid });

    // Capture a rich bid record for analysis
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

  /**
   * Challenge the current bid
   */
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

    // Collect all dice for the round result
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

    // Loser loses a die
    const loser = this.state.players.find(p => p.id === loserId);
    if (loser && loser.diceCount > 0) {
      loser.diceCount--;
      if (loser.diceCount > 0) {
        loser.dice = this.rollDice(loser.diceCount);
      } else {
        loser.dice = [];
      }
    }

    // Check for game over
    const playersWithDice = this.state.players.filter(p => p.diceCount > 0);
    if (playersWithDice.length === 1) {
      this.state.gamePhase = 'gameOver';
    } else {
      // Loser starts next round; if eliminated, winner starts instead
      const nextRoundStarterId = (loser && loser.diceCount > 0) ? loserId : winnerId;
      this.startNewRound(nextRoundStarterId);
    }

    this.state.roundHistory.push(roundResult);
    return roundResult;
  }

  /**
   * Call Calza — claim the current bid is exactly correct.
   * Correct: caller gains a die (up to startingDice max).
   * Wrong: caller loses a die.
   * Caller always starts next round, unless eliminated — then bidder starts.
   */
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

    // Collect all dice before modifying
    const allDice = this.state.players.map(p => ({
      playerId: p.id,
      dice: [...p.dice],
    }));

    const caller = this.state.players.find(p => p.id === challengerId)!;

    if (isExact) {
      // Caller gains a die, capped at startingDice
      if (caller.diceCount < this.state.settings.startingDice) {
        caller.diceCount++;
        caller.dice = this.rollDice(caller.diceCount);
      }
    } else {
      // Caller loses a die
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

    // Check for game over (caller eliminated on wrong calza)
    const playersWithDice = this.state.players.filter(p => p.diceCount > 0);
    if (playersWithDice.length === 1) {
      this.state.gamePhase = 'gameOver';
    } else {
      // Caller always starts next round unless eliminated — then bidder starts
      const callerEliminated = !isExact && caller.diceCount === 0;
      const nextStarterId = callerEliminated ? challengedBid.playerId : challengerId;
      this.startNewRound(nextStarterId);
    }

    this.state.roundHistory.push(roundResult);
    return roundResult;
  }

  private startNewRound(startingPlayerId: string) {
    // Find starting player index
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

    // Re-roll dice for all players who still have dice
    for (const player of this.state.players) {
      if (player.diceCount > 0) {
        player.dice = this.rollDice(player.diceCount);
      }
    }
  }

  private nextPlayer() {
    this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
    
    // Skip players with no dice
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
}
