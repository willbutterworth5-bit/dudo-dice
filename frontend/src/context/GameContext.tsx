import { useState, useCallback, ReactNode } from 'react';
import { GameEngine } from '../game/GameEngine';
import { Bid, GameSettings } from '../game/GameState';
import { GameContext } from './GameContextDef';

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null);
  const [gameState, setGameState] = useState(gameEngine?.getState() ?? null);

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

  const challengeBid = useCallback((playerId: string) => {
    if (!gameEngine) {
      return null;
    }

    const result = gameEngine.challengeBid(playerId);
    setGameState(gameEngine.getState());
    return result;
  }, [gameEngine]);

  const callCalza = useCallback((playerId: string) => {
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
