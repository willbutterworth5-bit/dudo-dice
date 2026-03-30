import type { Difficulty } from '../game/AIPlayer';

export interface GameConfig {
  playerCount: number;
  difficulty: Difficulty;
  startingDice: number;
  analysisEnabled: boolean;
  palificoEnabled: boolean;
  calzaEnabled: boolean;
}
