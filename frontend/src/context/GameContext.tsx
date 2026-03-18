import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { GameEngine } from '../game/GameEngine';
import { GameState, Bid, GameSettings, RoundResult } from '../game/GameState';

interface GameContextType {
  gameEngine: GameEngine | null;
  gameState: GameState | null;
  initializeGame: (settings: GameSettings) => void;
  makeBid: (bid: Bid) => Promise<{ success: boolean; reason?: string }>;
  challengeBid: (playerId: string) => RoundResult | null;
  callCalza: (playerId: string) => RoundResult | null;
  updateGameState: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);

  const initializeGame = useCallback((settings: GameSettings) => {
    const engine = new GameEngine(settings);
    setGameEngine(engine);
    setGameState(engine.getState());
  }, []);

  const updateGameState = useCallback(() => {
    if (gameEngine) {
      setGameState(gameEngine.getState());
    }
  }, [gameEngine]);

  const makeBid = useCallback(async (bid: Bid): Promise<{ success: boolean; reason?: string }> => {
    if (!gameEngine) {
      return { success: false, reason: 'Game not initialized' };
    }

    const result = gameEngine.makeBid(bid);
    if (result.success) {
      setGameState(gameEngine.getState());
    }
    return result;
  }, [gameEngine]);

  const challengeBid = useCallback((playerId: string): RoundResult | null => {
    if (!gameEngine) {
      return null;
    }

    const result = gameEngine.challengeBid(playerId);
    setGameState(gameEngine.getState());
    return result;
  }, [gameEngine]);

  const callCalza = useCallback((playerId: string): RoundResult | null => {
    if (!gameEngine) {
      return null;
    }

    const result = gameEngine.callCalza(playerId);
    setGameState(gameEngine.getState());
    return result;
  }, [gameEngine]);

  return (
    <GameContext.Provider
      value={{
        gameEngine,
        gameState,
        initializeGame,
        makeBid,
        challengeBid,
        callCalza,
        updateGameState,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
}
