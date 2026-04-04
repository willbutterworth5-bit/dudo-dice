/**
 * In-memory store for ranked Elo ratings.
 * Keyed by persistent player ID (UUID stored in client localStorage).
 * Ratings reset on server restart — persistence can be added later.
 */

export interface PlayerRating {
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  forfeits: number;
  provisional: boolean;
  lastDelta: number;
}

const DEFAULT_RATING = 1500;
const PROVISIONAL_THRESHOLD = 10;

function createDefault(): PlayerRating {
  return {
    rating: DEFAULT_RATING,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    forfeits: 0,
    provisional: true,
    lastDelta: 0,
  };
}

export class RatingStore {
  private ratings = new Map<string, PlayerRating>();

  getOrCreate(persistentId: string): PlayerRating {
    let entry = this.ratings.get(persistentId);
    if (!entry) {
      entry = createDefault();
      this.ratings.set(persistentId, entry);
    }
    return { ...entry };
  }

  /**
   * Apply a rating update after a ranked match.
   * Returns the updated rating snapshot.
   */
  update(
    persistentId: string,
    delta: number,
    won: boolean,
    forfeited: boolean,
  ): PlayerRating {
    let entry = this.ratings.get(persistentId);
    if (!entry) {
      entry = createDefault();
    }

    entry.rating = Math.max(100, entry.rating + delta);
    entry.gamesPlayed++;
    entry.lastDelta = delta;
    entry.provisional = entry.gamesPlayed < PROVISIONAL_THRESHOLD;

    if (won) {
      entry.wins++;
    } else {
      entry.losses++;
    }

    if (forfeited) {
      entry.forfeits++;
    }

    this.ratings.set(persistentId, entry);
    return { ...entry };
  }
}
