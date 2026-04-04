/**
 * In-memory store for ranked Elo ratings.
 * Keyed by persistent player ID (UUID stored in client localStorage or Supabase user ID).
 * For logged-in users, ratings are loaded from Supabase on join and persisted after matches.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

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

  /**
   * Load a rating from Supabase into the in-memory store.
   * No-op if supabase is null or persistentId doesn't exist in the DB.
   */
  async loadFromSupabase(persistentId: string, supabase: SupabaseClient | null): Promise<void> {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('player_ratings')
        .select('*')
        .eq('id', persistentId)
        .single();
      if (error || !data) return;
      this.ratings.set(persistentId, {
        rating: data.rating ?? DEFAULT_RATING,
        gamesPlayed: data.games_played ?? 0,
        wins: data.wins ?? 0,
        losses: data.losses ?? 0,
        forfeits: data.forfeits ?? 0,
        provisional: data.provisional ?? true,
        lastDelta: data.last_delta ?? 0,
      });
    } catch {
      // Non-critical — fall back to default
    }
  }

  /**
   * Persist a rating to Supabase after a match.
   * Only called for logged-in users (when supabase is non-null).
   */
  async persistToSupabase(persistentId: string, supabase: SupabaseClient | null): Promise<void> {
    if (!supabase) return;
    const entry = this.ratings.get(persistentId);
    if (!entry) return;
    try {
      await supabase.from('player_ratings').upsert({
        id: persistentId,
        rating: entry.rating,
        games_played: entry.gamesPlayed,
        wins: entry.wins,
        losses: entry.losses,
        forfeits: entry.forfeits,
        provisional: entry.provisional,
        last_delta: entry.lastDelta,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('RatingStore.persistToSupabase error:', err);
    }
  }
}
