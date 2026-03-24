import { GameEngine as SharedGameEngine, GameSettings } from '@dudo-dice/shared';
import { ProfileStorage } from '../utils/profileStorage';

export type { PlayerConfig } from '@dudo-dice/shared';

/**
 * Local game engine that wraps the shared GameEngine
 * and adds ProfileStorage integration for the human player name.
 */
export class GameEngine extends SharedGameEngine {
  constructor(settings: GameSettings) {
    // Get human player name from local profile storage
    let humanPlayerName = 'You';
    try {
      const profile = ProfileStorage.getProfile();
      if (profile && profile.name && profile.name.trim()) {
        humanPlayerName = profile.name.trim();
      }
      if (!humanPlayerName || humanPlayerName.trim() === '') {
        humanPlayerName = 'You';
      }
    } catch (e) {
      console.error('Error loading profile name:', e);
      humanPlayerName = 'You';
    }

    // Build player configs matching original layout:
    // First 3 AI at 12, 2, 4 o'clock; human at 6; remaining AI at 8, 10
    const playerConfigs = [];

    for (let i = 0; i < Math.min(3, settings.playerCount - 1); i++) {
      playerConfigs.push({
        id: `player-${i + 1}`,
        name: `Computer ${i + 1}`,
        isHuman: false,
      });
    }

    playerConfigs.push({
      id: 'player-0',
      name: humanPlayerName,
      isHuman: true,
    });

    for (let i = 3; i < settings.playerCount - 1; i++) {
      playerConfigs.push({
        id: `player-${i + 1}`,
        name: `Computer ${i + 1}`,
        isHuman: false,
      });
    }

    super(settings, playerConfigs);
  }
}
