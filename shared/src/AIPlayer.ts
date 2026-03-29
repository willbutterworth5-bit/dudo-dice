import { Bid, Player, GameState } from './GameState.js';
import { BidValidator } from './BidValidator.js';
import { DiceCounter } from './DiceCounter.js';

export type Difficulty = 'easy' | 'medium' | 'hard';

export class AIPlayer {
  private difficulty: Difficulty;

  constructor(difficulty: Difficulty = 'medium') {
    this.difficulty = difficulty;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Decide whether to bid or challenge.
   * Uses binomial survival probability anchored on own dice.
   */
  makeDecision(gameState: GameState, player: Player): 'bid' | 'challenge' | 'calza' {
    if (!gameState.currentBid) {
      return 'bid'; // Must make first bid
    }

    const probability = this.calculateBidProbability(gameState, player);
    const threshold = this.getChallengeThreshold();

    if (probability < threshold) {
      // Probability is low - lean toward challenge, but bluffing can override
      return Math.random() < this.getBluffChance() ? 'bid' : 'challenge';
    }

    // Consider calza when enabled — only worthwhile when P(exact) is high
    if (gameState.settings.calzaEnabled) {
      const pExact = this.calculateExactProbability(gameState, player);
      const calzaThreshold = this.getCalzaThreshold();
      if (pExact > calzaThreshold) {
        return 'calza';
      }
    }

    return 'bid';
  }

  /**
   * Generate a bid, or return null to signal a challenge instead.
   */
  generateBid(gameState: GameState, player: Player): Bid | null {
    const totalDice = gameState.players.reduce((sum, p) => sum + p.diceCount, 0);

    if (!gameState.currentBid) {
      return this.generateOpeningBid(player, totalDice, gameState.palificoMode);
    }

    return this.generateRaiseBid(gameState, player, totalDice);
  }

  // ── Opening bid ────────────────────────────────────────────────────────────

  private generateOpeningBid(
    player: Player,
    totalDice: number,
    palificoMode: { active: boolean; lockedFaceValue: number | null }
  ): Bid {
    // If a face is already locked (palifico mid-round), must use it
    if (palificoMode.active && palificoMode.lockedFaceValue !== null) {
      const face = palificoMode.lockedFaceValue;
      const estimate = this.anchoredEstimate(face, player, totalDice, palificoMode);
      const qty = Math.max(1, Math.round(estimate * this.openingAggressiveness()));
      return { quantity: qty, faceValue: face, playerId: player.id };
    }

    // Find the face value best supported by own dice
    // In palifico mode: no wilds, try faces 1-6
    // In normal mode: prefer non-ones (ones are unusual opening bids)
    const faceStart = palificoMode.active ? 1 : 2;
    let bestFace = faceStart;
    let bestEstimate = -Infinity;

    for (let face = faceStart; face <= 6; face++) {
      const estimate = this.anchoredEstimate(face, player, totalDice, palificoMode);
      if (estimate > bestEstimate) {
        bestEstimate = estimate;
        bestFace = face;
      }
    }

    const aggressiveness = this.openingAggressiveness();
    // Floor at ~20% of total dice so opening bids aren't embarrassingly low
    const minQty = Math.max(1, Math.round(totalDice * 0.20));
    const qty = Math.max(minQty, Math.round(bestEstimate * aggressiveness));

    return { quantity: qty, faceValue: bestFace, playerId: player.id };
  }

  // ── Raise bid ──────────────────────────────────────────────────────────────

  private generateRaiseBid(
    gameState: GameState,
    player: Player,
    totalDice: number
  ): Bid | null {
    const currentBid = gameState.currentBid!;
    const candidates = this.buildCandidateBids(currentBid, gameState.palificoMode, player);

    // Keep only bids the validator accepts
    const valid = candidates.filter(
      b => BidValidator.validateBid(b, currentBid, gameState.palificoMode).valid
    );

    if (valid.length === 0) return null;

    // Score each candidate and sort best-first
    const scored = valid
      .map(b => ({
        bid: b,
        score: this.scoreBid(b, player, totalDice, gameState.palificoMode, gameState.bidSequence),
      }))
      .sort((a, b) => b.score - a.score);

    // Pick from top 3 with weighted randomness so AI doesn't always play optimally
    const topN = Math.min(3, scored.length);
    const top = scored.slice(0, topN);
    // Weights: [4, 2, 1] for top-3, so best pick is 4x more likely than 3rd
    const weights = top.map((_, i) => Math.pow(2, topN - 1 - i));
    const totalWeight = weights.reduce((s, w) => s + w, 0);
    let rand = Math.random() * totalWeight;
    for (let i = 0; i < top.length; i++) {
      rand -= weights[i];
      if (rand <= 0) return top[i].bid;
    }
    return top[0].bid;
  }

  /**
   * Build the menu of candidate bids to consider from the current bid.
   */
  private buildCandidateBids(
    currentBid: Bid,
    palificoMode: { active: boolean; lockedFaceValue: number | null },
    player: Player
  ): Bid[] {
    const candidates: Bid[] = [];
    const { quantity: q, faceValue: f } = currentBid;
    const id = player.id;

    // Palifico: only one valid face, just raise quantity
    if (palificoMode.active && palificoMode.lockedFaceValue !== null) {
      const face = palificoMode.lockedFaceValue;
      candidates.push({ quantity: q + 1, faceValue: face, playerId: id });
      candidates.push({ quantity: q + 2, faceValue: face, playerId: id });
      candidates.push({ quantity: q + 3, faceValue: face, playerId: id });
      return candidates;
    }

    if (f === 1) {
      // Current bid is ones:
      // Stay on ones (raise quantity)
      candidates.push({ quantity: q + 1, faceValue: 1, playerId: id });
      // Jump back to non-ones (must at least double the quantity)
      for (let face = 2; face <= 6; face++) {
        candidates.push({ quantity: q * 2,     faceValue: face, playerId: id });
        candidates.push({ quantity: q * 2 + 1, faceValue: face, playerId: id });
      }
    } else {
      // Current bid is non-ones:
      // Same face, raise quantity by 1 or 2
      candidates.push({ quantity: q + 1, faceValue: f, playerId: id });
      candidates.push({ quantity: q + 2, faceValue: f, playerId: id });

      // Any face value (higher or lower) with a higher quantity.
      // This lets the AI pivot to a face it actually holds.
      for (let face = 2; face <= 6; face++) {
        if (face === f) continue; // already covered above
        candidates.push({ quantity: q + 1, faceValue: face, playerId: id });
        candidates.push({ quantity: q + 2, faceValue: face, playerId: id });
      }

      // Higher face value at same quantity (valid without qty raise)
      for (let face = f + 1; face <= 6; face++) {
        candidates.push({ quantity: q, faceValue: face, playerId: id });
      }

      // Bid ones (roughly half quantity, rounded up)
      const onesQty = Math.ceil(q / 2);
      candidates.push({ quantity: onesQty,     faceValue: 1, playerId: id });
      candidates.push({ quantity: onesQty + 1, faceValue: 1, playerId: id });
    }

    return candidates;
  }

  /**
   * Score a candidate bid 1-10: higher = better supported by own dice + opponent signals.
   * gap = bid.quantity - (anchoredEstimate + opponentBonus)
   *   negative gap = conservative (very safe)
   *   positive gap = bluffing (risky)
   */
  private scoreBid(
    bid: Bid,
    player: Player,
    totalDice: number,
    palificoMode: { active: boolean; lockedFaceValue: number | null },
    bidSequence: Bid[]
  ): number {
    const ownEstimate = this.anchoredEstimate(bid.faceValue, player, totalDice, palificoMode);
    const opponentBonus = this.inferFromBidSequence(bidSequence, bid.faceValue, player.id);
    const gap = bid.quantity - (ownEstimate + opponentBonus);

    if (gap <= -1) return 10; // Well below combined estimate — very safe
    if (gap <=  0) return 8;  // Right at estimate — solid
    if (gap <=  1) return 6;  // Slightly over — mild bluff
    if (gap <=  2) return 4;  // Moderate bluff
    if (gap <=  3) return 2;  // Aggressive bluff
    return 1;                 // Risky bluff
  }

  // ── Probability calculation ────────────────────────────────────────────────

  /**
   * P(bid is true) using binomial survival function anchored on own dice,
   * adjusted by what other players' bids reveal about their dice.
   * Returns probability in [0, 1].
   */
  private calculateBidProbability(gameState: GameState, player: Player): number {
    if (!gameState.currentBid) return 0.5;

    const { currentBid } = gameState;
    const totalDice = gameState.players.reduce((sum, p) => sum + p.diceCount, 0);
    const ownCount = DiceCounter.countPlayerDice(player, currentBid.faceValue, gameState.palificoMode);
    const unknownDice = totalDice - player.diceCount;
    const p = this.matchProbability(currentBid.faceValue, gameState.palificoMode);

    // Infer how many of this face value opponents probably hold based on their bids
    const opponentBonus = this.inferFromBidSequence(
      gameState.bidSequence,
      currentBid.faceValue,
      player.id
    );

    // How many matching dice do we need from the pool we can't see?
    // Reduce 'needed' by the bonus — if opponents have been vouching for this face,
    // we effectively need fewer from the unknown remainder.
    const needed = Math.max(0, currentBid.quantity - ownCount - opponentBonus);

    if (needed === 0) return 0.97; // Already covered
    if (needed > unknownDice) return 0.01; // Impossible even accounting for the bonus

    return this.binomialSurvival(unknownDice, p, needed);
  }

  /**
   * P(X >= k) where X ~ Binomial(n, p)
   */
  private binomialSurvival(n: number, p: number, k: number): number {
    if (k <= 0) return 1.0;
    if (k > n)  return 0.0;
    let prob = 0;
    for (let i = k; i <= n; i++) {
      prob += this.binomialPMF(n, p, i);
    }
    return Math.min(1, Math.max(0, prob));
  }

  private binomialPMF(n: number, p: number, k: number): number {
    return this.binomialCoeff(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
  }

  private binomialCoeff(n: number, k: number): number {
    if (k === 0 || k === n) return 1;
    if (k > n - k) k = n - k; // use smaller k for efficiency
    let result = 1;
    for (let i = 0; i < k; i++) {
      result = (result * (n - i)) / (i + 1);
    }
    return result;
  }

  // ── Bid-sequence inference ─────────────────────────────────────────────────

  /**
   * Estimate how many matching dice opponents are signalling they hold for a
   * given face value, based on bids they have made this round.
   *
   * Logic:
   *  - Every OTHER player who has bid this face at any point in the round
   *    is implicitly asserting they have some of that face. We credit them
   *    with +1.0 per player as a conservative signal.
   *  - If that player's MOST RECENT bid is still on this face (they doubled
   *    down), we add an extra +0.5 — stronger conviction.
   *  - Players who switched AWAY from this face in their latest bid are
   *    given less weight (their signal is older / possibly strategic).
   *
   * Returns a float representing the estimated bonus dice count from opponents.
   */
  private inferFromBidSequence(
    bidSequence: Bid[],
    faceValue: number,
    myPlayerId: string
  ): number {
    if (bidSequence.length === 0) return 0;

    const otherBids = bidSequence.filter(b => b.playerId !== myPlayerId);
    if (otherBids.length === 0) return 0;

    // Find the most recent bid from each other player
    const latestBidByPlayer = new Map<string, Bid>();
    for (const bid of otherBids) {
      latestBidByPlayer.set(bid.playerId, bid); // later bids overwrite earlier ones
    }

    // Players who bid this face at ANY point this round
    const playersWhoVouched = new Set<string>();
    for (const bid of otherBids) {
      if (bid.faceValue === faceValue) {
        playersWhoVouched.add(bid.playerId);
      }
    }

    let bonus = 0;
    for (const playerId of playersWhoVouched) {
      bonus += 0.5; // Base: they bet on this face at some point (reduced from 1.0)

      // Extra weight if their latest bid is still this face (doubled down)
      const latest = latestBidByPlayer.get(playerId);
      if (latest && latest.faceValue === faceValue) {
        bonus += 0.25;
      }
    }

    return bonus;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Expected count of matching dice for a given face:
   *   own matching dice + expected from unknown pool
   */
  private anchoredEstimate(
    faceValue: number,
    player: Player,
    totalDice: number,
    palificoMode: { active: boolean; lockedFaceValue: number | null }
  ): number {
    const ownCount = DiceCounter.countPlayerDice(player, faceValue, palificoMode);
    const unknownDice = totalDice - player.diceCount;
    return ownCount + unknownDice * this.matchProbability(faceValue, palificoMode);
  }

  /**
   * Probability that a single unknown die counts toward a given face:
   *   - Normal mode, non-ones: 1/3  (face value OR wild one)
   *   - Ones bid or palifico:  1/6  (exact match only)
   */
  private matchProbability(
    faceValue: number,
    palificoMode: { active: boolean; lockedFaceValue: number | null }
  ): number {
    if (palificoMode.active || faceValue === 1) return 1 / 6;
    return 1 / 3;
  }

  /**
   * Challenge threshold: challenge when P(bid true) < threshold.
   * Easy AI challenges less aggressively (misses good challenge spots).
   * Hard AI challenges more aggressively (picks up weak bids).
   */
  private getChallengeThreshold(): number {
    switch (this.difficulty) {
      case 'easy': return 0.22;
      case 'hard': return 0.42;
      default:     return 0.35;
    }
  }

  /**
   * Calza threshold: only call calza when P(exact) > threshold.
   * Exact matches are rare so thresholds are conservative.
   */
  private getCalzaThreshold(): number {
    switch (this.difficulty) {
      case 'easy': return 0.35;
      case 'hard': return 0.25;
      default:     return 0.30;
    }
  }

  /**
   * P(actual count === bid.quantity) — binomial PMF for exact match.
   */
  private calculateExactProbability(gameState: GameState, player: Player): number {
    if (!gameState.currentBid) return 0;
    const { currentBid } = gameState;
    const totalDice = gameState.players.reduce((sum, p) => sum + p.diceCount, 0);
    const ownCount = DiceCounter.countPlayerDice(player, currentBid.faceValue, gameState.palificoMode);
    const unknownDice = totalDice - player.diceCount;
    const p = this.matchProbability(currentBid.faceValue, gameState.palificoMode);
    const needed = currentBid.quantity - ownCount;

    if (needed < 0 || needed > unknownDice) return 0;
    return this.binomialPMF(unknownDice, p, needed);
  }

  /**
   * When probability is below threshold, bluff chance = probability of bidding anyway.
   * Easy AI makes more mistake-bids; hard AI rarely bids into a clear challenge.
   */
  private getBluffChance(): number {
    switch (this.difficulty) {
      case 'easy': return 0.35;
      case 'hard': return 0.12;
      default:     return 0.22;
    }
  }

  /**
   * Aggressiveness multiplier for opening bids (relative to anchored estimate).
   * Hard AI bids closer to the true expected value; easy AI bids conservatively.
   */
  private openingAggressiveness(): number {
    switch (this.difficulty) {
      case 'easy': return 0.65 + Math.random() * 0.20; // 0.65–0.85
      case 'hard': return 0.80 + Math.random() * 0.20; // 0.80–1.00
      default:     return 0.70 + Math.random() * 0.20; // 0.70–0.90
    }
  }
}
