// Lazy imports to avoid circular deps — only called when user is logged in
let _syncProfile: ((userId: string, profile: PlayerProfile) => Promise<void>) | null = null;
let _syncAchievement: ((userId: string, id: string) => Promise<void>) | null = null;
let _getSupabaseUserId: (() => string | null) | null = null;

/** Called once by AuthContext to wire up Supabase sync. */
export function initSupabaseSync(
  syncProfile: (userId: string, profile: PlayerProfile) => Promise<void>,
  syncAchievement: (userId: string, id: string) => Promise<void>,
  getSupabaseUserId: () => string | null,
): void {
  _syncProfile = syncProfile;
  _syncAchievement = syncAchievement;
  _getSupabaseUserId = getSupabaseUserId;
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  dudoCalls: number;
  successfulDudoCalls: number;
  timesCalledAgainst: number;
  successfulCallsAgainst: number;
}

const EMPTY_STATS: PlayerStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  dudoCalls: 0,
  successfulDudoCalls: 0,
  timesCalledAgainst: 0,
  successfulCallsAgainst: 0,
};

export interface PlayerProfile {
  name: string;
  photo: string | null; // Base64 encoded image or URL
  country: string | null; // ISO 3166-1 alpha-2 code, e.g. "GB"
  stats: PlayerStats;           // mirrors vsComputerStats for backward compat
  vsComputerStats: PlayerStats;
  onlineStats: PlayerStats;
  achievements: string[];       // array of unlocked achievement IDs
  consecutiveWins: number;      // persistent streak for Hot Streak / Unstoppable
  uniquePlayerIds: string[];    // unique online opponent IDs for Friendly Face / Social Butterfly
  // Ranked Elo rating (synced from server, display-only on client)
  persistentPlayerId: string;   // stable UUID for rating identity
  rankedRating: number;         // default 1500
  rankedGamesPlayed: number;
  rankedWins: number;
  rankedLosses: number;
  rankedForfeits: number;
  lastRatingChange: number;     // last delta (e.g. +24 or -18)
}

const PROFILE_STORAGE_KEY = 'dudo-player-profile';

export const ProfileStorage = {
  getProfile(): PlayerProfile {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Validate name
        if (!parsed.name || !parsed.name.trim()) {
          parsed.name = 'You';
        } else {
          parsed.name = parsed.name.trim();
        }
        // Ensure stats exist (legacy)
        if (!parsed.stats) {
          parsed.stats = { ...EMPTY_STATS };
        } else {
          parsed.stats.timesCalledAgainst = parsed.stats.timesCalledAgainst ?? 0;
          parsed.stats.successfulCallsAgainst = parsed.stats.successfulCallsAgainst ?? 0;
        }
        // Migrate: split stats into vsComputerStats / onlineStats
        if (!parsed.vsComputerStats) {
          parsed.vsComputerStats = { ...parsed.stats };
        } else {
          parsed.vsComputerStats.timesCalledAgainst = parsed.vsComputerStats.timesCalledAgainst ?? 0;
          parsed.vsComputerStats.successfulCallsAgainst = parsed.vsComputerStats.successfulCallsAgainst ?? 0;
        }
        if (!parsed.onlineStats) {
          parsed.onlineStats = { ...EMPTY_STATS };
        }
        // Migrate achievements and streak
        if (!parsed.achievements) parsed.achievements = [];
        if (parsed.consecutiveWins === undefined) parsed.consecutiveWins = 0;
        if (!parsed.uniquePlayerIds) parsed.uniquePlayerIds = [];
        // Migrate country
        if (parsed.country === undefined) parsed.country = null;
        // Migrate ranked rating fields
        if (!parsed.persistentPlayerId) parsed.persistentPlayerId = crypto.randomUUID();
        if (parsed.rankedRating === undefined) parsed.rankedRating = 1500;
        if (parsed.rankedGamesPlayed === undefined) parsed.rankedGamesPlayed = 0;
        if (parsed.rankedWins === undefined) parsed.rankedWins = 0;
        if (parsed.rankedLosses === undefined) parsed.rankedLosses = 0;
        if (parsed.rankedForfeits === undefined) parsed.rankedForfeits = 0;
        if (parsed.lastRatingChange === undefined) parsed.lastRatingChange = 0;
        return parsed as PlayerProfile;
      } catch (e) {
        console.error('Error parsing profile from storage:', e);
      }
    }

    const defaultStats = { ...EMPTY_STATS };
    return {
      name: 'You',
      photo: null,
      country: null,
      stats: defaultStats,
      vsComputerStats: { ...defaultStats },
      onlineStats: { ...EMPTY_STATS },
      achievements: [],
      consecutiveWins: 0,
      uniquePlayerIds: [],
      persistentPlayerId: crypto.randomUUID(),
      rankedRating: 1500,
      rankedGamesPlayed: 0,
      rankedWins: 0,
      rankedLosses: 0,
      rankedForfeits: 0,
      lastRatingChange: 0,
    };
  },

  saveProfile(profile: PlayerProfile): void {
    // Keep stats in sync with vsComputerStats for any legacy readers
    profile.stats = profile.vsComputerStats;
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error('Error saving profile to storage:', e);
    }
    // Sync to Supabase if user is logged in
    const userId = _getSupabaseUserId?.();
    if (userId && _syncProfile) {
      _syncProfile(userId, profile).catch(() => {});
    }
  },

  updateName(name: string): void {
    const profile = this.getProfile();
    profile.name = name;
    this.saveProfile(profile);
  },

  updatePhoto(photo: string | null): void {
    const profile = this.getProfile();
    profile.photo = photo;
    this.saveProfile(profile);
  },

  updateCountry(code: string | null): void {
    const profile = this.getProfile();
    profile.country = code;
    this.saveProfile(profile);
  },

  recordGame(won: boolean): void {
    const profile = this.getProfile();
    profile.vsComputerStats.gamesPlayed++;
    if (won) profile.vsComputerStats.gamesWon++;
    this.saveProfile(profile);
  },

  recordDudoCall(successful: boolean): void {
    const profile = this.getProfile();
    profile.vsComputerStats.dudoCalls++;
    if (successful) profile.vsComputerStats.successfulDudoCalls++;
    this.saveProfile(profile);
  },

  recordCalledAgainst(successfulAgainstYou: boolean): void {
    const profile = this.getProfile();
    profile.vsComputerStats.timesCalledAgainst++;
    if (successfulAgainstYou) profile.vsComputerStats.successfulCallsAgainst++;
    this.saveProfile(profile);
  },

  /** Record unique online opponent IDs (for Friendly Face / Social Butterfly). Returns new total unique count. */
  recordOnlinePlayers(playerIds: string[]): number {
    const profile = this.getProfile();
    let changed = false;
    for (const id of playerIds) {
      if (!profile.uniquePlayerIds.includes(id)) {
        profile.uniquePlayerIds.push(id);
        changed = true;
      }
    }
    if (changed) this.saveProfile(profile);
    return profile.uniquePlayerIds.length;
  },

  /** Unlock an achievement. Returns true if it was newly unlocked. */
  unlockAchievement(id: string): boolean {
    const profile = this.getProfile();
    if (profile.achievements.includes(id)) return false;
    profile.achievements.push(id);
    this.saveProfile(profile);
    // Sync individual achievement to Supabase
    const userId = _getSupabaseUserId?.();
    if (userId && _syncAchievement) {
      _syncAchievement(userId, id).catch(() => {});
    }
    return true;
  },

  getUnlockedAchievements(): string[] {
    return this.getProfile().achievements;
  },

  getWinRate(): number {
    const profile = this.getProfile();
    if (profile.vsComputerStats.gamesPlayed === 0) return 0;
    return Math.round((profile.vsComputerStats.gamesWon / profile.vsComputerStats.gamesPlayed) * 100);
  },

  getDudoSuccessRate(): number {
    const profile = this.getProfile();
    if (profile.vsComputerStats.dudoCalls === 0) return 0;
    return Math.round((profile.vsComputerStats.successfulDudoCalls / profile.vsComputerStats.dudoCalls) * 100);
  },

  getCalledAgainstSuccessRate(): number {
    const profile = this.getProfile();
    if (profile.vsComputerStats.timesCalledAgainst === 0) return 0;
    return Math.round((profile.vsComputerStats.successfulCallsAgainst / profile.vsComputerStats.timesCalledAgainst) * 100);
  },

  getPersistentPlayerId(): string {
    const profile = this.getProfile();
    return profile.persistentPlayerId;
  },

  /** Called when a rating_update event arrives from the server. */
  updateRankedRating(rating: number, delta: number, won: boolean, forfeited: boolean): void {
    const profile = this.getProfile();
    profile.rankedRating = rating;
    profile.lastRatingChange = delta;
    profile.rankedGamesPlayed++;
    if (won) profile.rankedWins++;
    else profile.rankedLosses++;
    if (forfeited) profile.rankedForfeits++;
    this.saveProfile(profile);
  },
};

export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image file'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
