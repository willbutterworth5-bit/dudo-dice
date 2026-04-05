import { GameEngine as SharedGameEngine, GameSettings } from '@dudo-dice/shared';
import { ProfileStorage } from '../utils/profileStorage';

export type { PlayerConfig } from '@dudo-dice/shared';

function pickUniqueNames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `DudoBot ${i + 1}`);
}

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
    const aiCount = settings.playerCount - 1;
    const botNames = pickUniqueNames(aiCount);
    const playerConfigs = [];

    for (let i = 0; i < Math.min(3, aiCount); i++) {
      playerConfigs.push({
        id: `player-${i + 1}`,
        name: botNames[i],
        isHuman: false,
      });
    }

    playerConfigs.push({
      id: 'player-0',
      name: humanPlayerName,
      isHuman: true,
    });

    for (let i = 3; i < aiCount; i++) {
      playerConfigs.push({
        id: `player-${i + 1}`,
        name: botNames[i],
        isHuman: false,
      });
    }

    super(settings, playerConfigs);
  }
}
