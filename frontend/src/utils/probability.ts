import { BidRecord } from '../game/GameState';

/** P(X >= k) where X ~ Binomial(n, p) */
export function binomialSurvival(n: number, p: number, k: number): number {
  if (k <= 0) return 1.0;
  if (k > n) return 0.0;
  let prob = 0;
  for (let i = k; i <= n; i++) {
    prob += binomialPMF(n, p, i);
  }
  return Math.min(1, Math.max(0, prob));
}

function binomialPMF(n: number, p: number, k: number): number {
  return binomialCoeff(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

function binomialCoeff(n: number, k: number): number {
  if (k === 0 || k === n) return 1;
  if (k > n - k) k = n - k;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return result;
}

/**
 * Probability a bid is true, from the human player's perspective.
 * Human knows their own dice; all other dice are treated as unknown.
 */
export function bidProbabilityFromHuman(
  quantity: number,
  faceValue: number,
  humanDice: number[],
  totalDiceOnBoard: number,
  palificoMode: boolean
): number {
  // How many of the human's dice match?
  const humanMatches = humanDice.filter(d => {
    if (palificoMode) return d === faceValue;
    if (faceValue === 1) return d === 1;
    return d === faceValue || d === 1; // 1s are wild in normal mode
  }).length;

  const unknownDice = totalDiceOnBoard - humanDice.length;
  const needed = Math.max(0, quantity - humanMatches);

  if (needed === 0) return 1.0;
  if (needed > unknownDice) return 0.01;

  // p = probability each unknown die matches
  const p = palificoMode ? 1 / 6 : faceValue === 1 ? 1 / 6 : 2 / 6;

  return binomialSurvival(unknownDice, p, needed);
}

/** Compute probability for a BidRecord using the stored humanDice snapshot. */
export function probabilityFromRecord(record: BidRecord): number {
  return bidProbabilityFromHuman(
    record.bid.quantity,
    record.bid.faceValue,
    record.humanDice,
    record.totalDiceOnBoard,
    record.palificoMode
  );
}

/**
 * After a round: find bids the human could have made instead of challenging,
 * based on the actual dice on the board. Returns the highest valid bid per
 * face value where the actual count would have made the bid true.
 * Returns at most 3 results sorted by actual count descending.
 */
export function alternativeBids(
  allDice: { playerId: string; dice: number[] }[],
  challengedBid: { quantity: number; faceValue: number },
  palificoMode: boolean
): { quantity: number; faceValue: number; actualCount: number }[] {
  const flatDice = allDice.flatMap(p => p.dice);
  const faceValues = palificoMode ? [challengedBid.faceValue] : [1, 2, 3, 4, 5, 6];
  const candidates: { quantity: number; faceValue: number; actualCount: number }[] = [];

  for (const fv of faceValues) {
    // Count actual matching dice on the board
    const count = flatDice.filter(d => {
      if (palificoMode) return d === fv;
      if (fv === 1) return d === 1;
      return d === fv || d === 1; // 1s are wild in normal mode
    }).length;

    // Minimum valid bid quantity for this face value (must raise the current bid)
    const minQty = fv === challengedBid.faceValue
      ? challengedBid.quantity + 1
      : fv > challengedBid.faceValue
        ? challengedBid.quantity
        : challengedBid.quantity + 1;

    // The bid is only "true" if actual count >= bid quantity
    // The highest true bid is count itself (bidding more than count would be false)
    if (count >= minQty) {
      candidates.push({ quantity: count, faceValue: fv, actualCount: count });
    }
  }

  // Sort by actual count descending, return top 3
  return candidates.sort((a, b) => b.actualCount - a.actualCount).slice(0, 3);
}

/** Probability colour class based on bid likelihood. */
export function probColour(prob: number): { text: string; bg: string } {
  if (prob >= 0.65) return { text: 'text-green-300', bg: 'bg-green-500/20' };
  if (prob >= 0.35) return { text: 'text-amber-300', bg: 'bg-amber-500/20' };
  return { text: 'text-red-300', bg: 'bg-red-500/20' };
}
