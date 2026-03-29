import { Player, PLAYER_COLOR_MAP } from '../game/GameState';

interface GameOverModalProps {
  winner: Player;
  onNewGame?: (() => void) | undefined;
  onQuit: () => void;
  onViewGameAnalysis?: () => void;
  analysisEnabled?: boolean;
}

export default function GameOverModal({
  winner,
  onNewGame,
  onQuit,
  onViewGameAnalysis,
  analysisEnabled = false,
}: GameOverModalProps) {
  const winnerColor = PLAYER_COLOR_MAP[winner.color] || '#6B7280';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-white/20">
        <div className="text-center">
          <div
            className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl font-bold shadow-lg"
            style={{ backgroundColor: winnerColor }}
          >
            🎉
          </div>
          <h2 className="text-3xl font-bold mb-2 text-white">Game Over!</h2>
          <p className="text-xl text-white mb-1">
            <span className="font-semibold">{winner.name}</span> wins!
          </p>
          <p className="text-sm text-white/70 mb-6">
            {winner.isHuman ? 'Congratulations!' : 'Better luck next time!'}
          </p>

          <div className="flex gap-3 justify-center flex-wrap">
            {onNewGame && (
              <button
                onClick={onNewGame}
                className="px-6 py-3 text-white font-bold rounded-xl transition-colors text-sm btn-3d-accent"
              >
                New Game
              </button>
            )}
            {analysisEnabled && (
              <button
                onClick={onViewGameAnalysis}
                className="px-6 py-3 btn-glass text-white font-bold rounded-xl transition-colors text-sm"
              >
                Game Analysis
              </button>
            )}
            <button
              onClick={onQuit}
              className="px-6 py-3 btn-glass text-white font-bold rounded-xl transition-colors text-sm"
            >
              Quit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
