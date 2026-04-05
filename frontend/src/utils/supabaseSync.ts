import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { ProfileStorage, type PlayerProfile } from './profileStorage';

/**
 * Called on login. Fetches all data for the user from Supabase and merges it
 * into localStorage, taking the best of both worlds:
 *  - Stats: take max of each counter
 *  - Achievements: union of both sets
 *  - Rating: use Supabase value (server-authoritative)
 *  - Name: keep existing name unless it's still the default "You"
 *  - Avatar: use Google avatar_url if no custom photo is set
 */
export async function loadFromSupabase(userId: string, session: Session): Promise<void> {
  if (!supabase) return;

  try {
    const [profileRes, statsRes, achievementsRes, ratingsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('player_stats').select('*').eq('id', userId).single(),
      supabase.from('player_achievements').select('achievement_id').eq('user_id', userId),
      supabase.from('player_ratings').select('*').eq('id', userId).single(),
    ]);

    const local = ProfileStorage.getProfile();

    // --- Name ---
    if (profileRes.data?.name && local.name === 'You') {
      local.name = profileRes.data.name;
    }

    // --- Avatar ---
    const googleAvatar = session.user?.user_metadata?.avatar_url as string | undefined;
    if (!local.photo && googleAvatar) {
      local.photo = googleAvatar;
    }

    // --- Country ---
    if (!local.country && profileRes.data?.country) {
      local.country = profileRes.data.country;
    }

    // --- Stats: take max of each counter ---
    if (statsRes.data) {
      const s = statsRes.data;
      const vc = local.vsComputerStats;
      vc.gamesPlayed = Math.max(vc.gamesPlayed, s.vs_games_played ?? 0);
      vc.gamesWon = Math.max(vc.gamesWon, s.vs_games_won ?? 0);
      vc.dudoCalls = Math.max(vc.dudoCalls, s.vs_dudo_calls ?? 0);
      vc.successfulDudoCalls = Math.max(vc.successfulDudoCalls, s.vs_successful_dudo_calls ?? 0);
      vc.timesCalledAgainst = Math.max(vc.timesCalledAgainst, s.vs_times_called_against ?? 0);
      vc.successfulCallsAgainst = Math.max(vc.successfulCallsAgainst, s.vs_successful_calls_against ?? 0);

      const on = local.onlineStats;
      on.gamesPlayed = Math.max(on.gamesPlayed, s.online_games_played ?? 0);
      on.gamesWon = Math.max(on.gamesWon, s.online_games_won ?? 0);
      on.dudoCalls = Math.max(on.dudoCalls, s.online_dudo_calls ?? 0);
      on.successfulDudoCalls = Math.max(on.successfulDudoCalls, s.online_successful_dudo_calls ?? 0);
      on.timesCalledAgainst = Math.max(on.timesCalledAgainst, s.online_times_called_against ?? 0);
      on.successfulCallsAgainst = Math.max(on.successfulCallsAgainst, s.online_successful_calls_against ?? 0);
    }

    // --- Achievements: union ---
    if (achievementsRes.data) {
      const remoteIds = achievementsRes.data.map((r: { achievement_id: string }) => r.achievement_id);
      const merged = Array.from(new Set([...local.achievements, ...remoteIds]));
      local.achievements = merged;
    }

    // --- Rating: use Supabase (server-authoritative) ---
    if (ratingsRes.data) {
      const r = ratingsRes.data;
      local.rankedRating = r.rating ?? 1500;
      local.rankedGamesPlayed = r.games_played ?? 0;
      local.rankedWins = r.wins ?? 0;
      local.rankedLosses = r.losses ?? 0;
      local.rankedForfeits = r.forfeits ?? 0;
      local.lastRatingChange = r.last_delta ?? 0;
    }

    ProfileStorage.saveProfile(local);
  } catch (err) {
    console.warn('supabaseSync.loadFromSupabase error:', err);
  }
}

/**
 * Upsert the user's profile and stats to Supabase.
 * Called when the user saves their profile (name, country, photo changes).
 */
export async function syncProfileToSupabase(userId: string, profile: PlayerProfile): Promise<void> {
  if (!supabase) return;

  try {
    await Promise.all([
      supabase.from('profiles').upsert({
        id: userId,
        name: profile.name,
        country: profile.country,
        // Only store URL-style avatars in Supabase; base64 stays local
        avatar_url: profile.photo?.startsWith('http') ? profile.photo : undefined,
        updated_at: new Date().toISOString(),
      }),
      supabase.from('player_stats').upsert({
        id: userId,
        vs_games_played: profile.vsComputerStats.gamesPlayed,
        vs_games_won: profile.vsComputerStats.gamesWon,
        vs_dudo_calls: profile.vsComputerStats.dudoCalls,
        vs_successful_dudo_calls: profile.vsComputerStats.successfulDudoCalls,
        vs_times_called_against: profile.vsComputerStats.timesCalledAgainst,
        vs_successful_calls_against: profile.vsComputerStats.successfulCallsAgainst,
        online_games_played: profile.onlineStats.gamesPlayed,
        online_games_won: profile.onlineStats.gamesWon,
        online_dudo_calls: profile.onlineStats.dudoCalls,
        online_successful_dudo_calls: profile.onlineStats.successfulDudoCalls,
        online_times_called_against: profile.onlineStats.timesCalledAgainst,
        online_successful_calls_against: profile.onlineStats.successfulCallsAgainst,
        updated_at: new Date().toISOString(),
      }),
    ]);
  } catch (err) {
    console.warn('supabaseSync.syncProfileToSupabase error:', err);
  }
}

export interface GameSessionData {
  session_type: 'vs_ai' | 'online'
  difficulty?: string
  player_count: number
  human_count: number
  result: 'win' | 'loss' | 'abandoned'
  rounds_played: number
  starting_dice: number
  palifico_enabled: boolean
  calza_enabled: boolean
  duration_seconds: number
}

/**
 * Insert a game session row for analytics.
 * userId is null for guests. Never throws — silently swallows errors.
 */
export async function recordGameSession(userId: string | null, session: GameSessionData): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('game_sessions').insert({
      user_id: userId,
      ...session,
      played_at: new Date().toISOString(),
    });
  } catch {
    // never block the game
  }
}

/**
 * Update profiles.last_seen_at to now. Called on sign-in.
 */
export async function updateLastSeen(userId: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('profiles').upsert({
      id: userId,
      last_seen_at: new Date().toISOString(),
    });
  } catch {
    // silently ignore
  }
}

/**
 * Insert a single achievement unlock for the user.
 * Silently ignores duplicate inserts (primary key conflict).
 */
export async function syncAchievementToSupabase(userId: string, achievementId: string): Promise<void> {
  if (!supabase) return;

  try {
    await supabase.from('player_achievements').upsert(
      { user_id: userId, achievement_id: achievementId },
      { onConflict: 'user_id,achievement_id', ignoreDuplicates: true },
    );
  } catch (err) {
    console.warn('supabaseSync.syncAchievementToSupabase error:', err);
  }
}
