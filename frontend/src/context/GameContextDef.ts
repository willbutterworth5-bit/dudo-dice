import { createContext } from 'react';
import { GameEngine } from '../game/GameEngine';
import { GameState, Bid, GameSettings, RoundResult } from '../game/GameState';

export interface GameContextType {
  gameEngine: GameEngine | null;
  gameState: GameState | null;
  initializeGame: (settings: GameSettings) => void;
  makeBid: (bid: Bid) => Promise<{ success: boolean; reason?: string }>;
  challengeBid: (playerId: string) => RoundResult | null;
  callCalza: (playerId: string) => RoundResult | null;
  updateGameState: () => void;
}

export const GameContext = createContext<GameContextType | undefined>(undefined);
