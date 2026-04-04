/**
 * Pairwise Elo rating calculation for multiplayer Perudo.
 * Only human players are included — bots are excluded from all calculations.
 */

export interface EloPlayer {
  id: string;
  rating: number;
  gamesPlayed: number;
}

export interface EloResult {
  playerId: string;
  oldRating: number;
  newRating: number;
  delta: number;
}

const RATING_FLOOR = 100;

function getKValue(gamesPlayed: number): number {
  if (gamesPlayed < 10) return 40;   // provisional
  if (gamesPlayed < 100) return 20;  // normal
  return 10;                          // veteran
}

/**
 * Calculate Elo rating changes for a multiplayer match using pairwise comparison.
 *
 * @param players  - Array of human players with their current ratings
 * @param placements - Map of playerId → placement (1 = winner, 2 = second, etc.)
 * @returns Array of rating changes for each player
 */
export function calculateElo(
  players: EloPlayer[],
  placements: Map<string, number>,
): EloResult[] {
  if (players.length < 2) return [];

  const results: EloResult[] = [];

  for (const player of players) {
    const playerPlacement = placements.get(player.id);
    if (playerPlacement === undefined) continue;

    const K = getKValue(player.gamesPlayed);
    let totalDelta = 0;
    let opponents = 0;

    for (const opponent of players) {
      if (opponent.id === player.id) continue;

      const opponentPlacement = placements.get(opponent.id);
      if (opponentPlacement === undefined) continue;

      // Actual score: 1 if placed higher (lower number), 0 if lower, 0.5 if tied
      let actualScore: number;
      if (playerPlacement < opponentPlacement) {
        actualScore = 1;
      } else if (playerPlacement > opponentPlacement) {
        actualScore = 0;
      } else {
        actualScore = 0.5;
      }

      // Expected score
      const expectedScore = 1 / (1 + Math.pow(10, (opponent.rating - player.rating) / 400));

      totalDelta += K * (actualScore - expectedScore);
      opponents++;
    }

    // Average across all pairwise comparisons
    const delta = opponents > 0 ? Math.round(totalDelta / opponents) : 0;
    const newRating = Math.max(RATING_FLOOR, player.rating + delta);

    results.push({
      playerId: player.id,
      oldRating: player.rating,
      newRating,
      delta: newRating - player.rating,
    });
  }

  return results;
}
