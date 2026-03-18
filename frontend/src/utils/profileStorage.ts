export interface PlayerProfile {
  name: string;
  photo: string | null; // Base64 encoded image or URL
  country: string | null; // ISO 3166-1 alpha-2 code, e.g. "GB"
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    dudoCalls: number;
    successfulDudoCalls: number;
    timesCalledAgainst: number;
    successfulCallsAgainst: number;
  };
}

const PROFILE_STORAGE_KEY = 'dudo-player-profile';

export const ProfileStorage = {
  /**
   * Get the current player profile or return default
   */
  getProfile(): PlayerProfile {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Validate name - ensure it's never empty
        if (!parsed.name || !parsed.name.trim()) {
          parsed.name = 'You';
        } else {
          parsed.name = parsed.name.trim();
        }
        // Ensure stats exist
        if (!parsed.stats) {
          parsed.stats = {
            gamesPlayed: 0,
            gamesWon: 0,
            dudoCalls: 0,
            successfulDudoCalls: 0,
            timesCalledAgainst: 0,
            successfulCallsAgainst: 0,
          };
        } else {
          // Migrate older profiles that lack the new fields
          parsed.stats.timesCalledAgainst = parsed.stats.timesCalledAgainst ?? 0;
          parsed.stats.successfulCallsAgainst = parsed.stats.successfulCallsAgainst ?? 0;
        }
        // Migrate older profiles without country field
        if (parsed.country === undefined) parsed.country = null;
        return parsed;
      } catch (e) {
        console.error('Error parsing profile from storage:', e);
      }
    }
    
    // Return default profile
    return {
      name: 'You',
      photo: null,
      country: null,
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        dudoCalls: 0,
        successfulDudoCalls: 0,
        timesCalledAgainst: 0,
        successfulCallsAgainst: 0,
      },
    };
  },

  /**
   * Save the player profile to localStorage
   */
  saveProfile(profile: PlayerProfile): void {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error('Error saving profile to storage:', e);
    }
  },

  /**
   * Update profile name
   */
  updateName(name: string): void {
    const profile = this.getProfile();
    profile.name = name;
    this.saveProfile(profile);
  },

  /**
   * Update profile photo
   */
  updatePhoto(photo: string | null): void {
    const profile = this.getProfile();
    profile.photo = photo;
    this.saveProfile(profile);
  },

  /**
   * Update profile country
   */
  updateCountry(code: string | null): void {
    const profile = this.getProfile();
    profile.country = code;
    this.saveProfile(profile);
  },

  /**
   * Add a completed game to statistics
   */
  recordGame(won: boolean): void {
    const profile = this.getProfile();
    profile.stats.gamesPlayed++;
    if (won) {
      profile.stats.gamesWon++;
    }
    this.saveProfile(profile);
  },

  /**
   * Record a dudo call (challenge)
   */
  recordDudoCall(successful: boolean): void {
    const profile = this.getProfile();
    profile.stats.dudoCalls++;
    if (successful) {
      profile.stats.successfulDudoCalls++;
    }
    this.saveProfile(profile);
  },

  /**
   * Get win rate as percentage
   */
  getWinRate(): number {
    const profile = this.getProfile();
    if (profile.stats.gamesPlayed === 0) return 0;
    return Math.round((profile.stats.gamesWon / profile.stats.gamesPlayed) * 100);
  },

  /**
   * Get successful dudo call rate as percentage
   */
  getDudoSuccessRate(): number {
    const profile = this.getProfile();
    if (profile.stats.dudoCalls === 0) return 0;
    return Math.round((profile.stats.successfulDudoCalls / profile.stats.dudoCalls) * 100);
  },

  /**
   * Record when an opponent calls Dudo against the human player
   */
  recordCalledAgainst(successfulAgainstYou: boolean): void {
    const profile = this.getProfile();
    profile.stats.timesCalledAgainst++;
    if (successfulAgainstYou) {
      profile.stats.successfulCallsAgainst++;
    }
    this.saveProfile(profile);
  },

  /**
   * Get the rate at which opponents successfully called Dudo against the human
   */
  getCalledAgainstSuccessRate(): number {
    const profile = this.getProfile();
    if (profile.stats.timesCalledAgainst === 0) return 0;
    return Math.round((profile.stats.successfulCallsAgainst / profile.stats.timesCalledAgainst) * 100);
  },
};

/**
 * Convert file to base64 string for storage
 */
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
