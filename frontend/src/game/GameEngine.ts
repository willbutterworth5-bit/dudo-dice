import { GameEngine as SharedGameEngine, GameSettings } from '@dudo-dice/shared';
import { ProfileStorage } from '../utils/profileStorage';

export type { PlayerConfig } from '@dudo-dice/shared';

const BOT_NAMES = [
  'DudoBot', 'DiceAI', 'RollX9', 'CupUnit', 'SpotXAI', 'DudoX1', 'DiceRX',
  'RollBot', 'Cup9000', 'SpotCore', 'DudoAI', 'DiceQ7', 'RollXAI', 'CupX22',
  'SpotBot', 'DudoRX', 'DiceN1', 'Roll900', 'CupAI', 'SpotX9', 'DudoX9',
  'DiceFX', 'RollX5', 'CupRobo', 'SpotAI', 'Dudo7', 'DiceX2', 'RollN3',
  'CupXAI', 'SpotR1', 'DudoCore', 'DiceZ9',
];

function pickUniqueNames(count: number): string[] {
  const shuffled = [...BOT_NAMES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
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
