import { Player } from '../game/GameState';
import type { RatingUpdate } from '../hooks/useMultiplayerConnection';
import { useLanguage } from '../i18n/LanguageContext';

interface GameOverModalProps {
  winner: Player;
  onNewGame?: (() => void) | undefined;
  onQuit: () => void;
  onViewGameAnalysis?: () => void;
  analysisEnabled?: boolean;
  ratingUpdate?: RatingUpdate | null;
  isRanked?: boolean;
}

const PLACEMENT_LABELS_EN = ['', '1st', '2nd', '3rd', '4th', '5th', '6th'];
const PLACEMENT_LABELS_ES = ['', '1.°', '2.°', '3.°', '4.°', '5.°', '6.°'];

export default function GameOverModal({
  winner,
  onNewGame: _onNewGame,
  onQuit,
  onViewGameAnalysis,
  analysisEnabled = false,
  ratingUpdate,
  isRanked,
}: GameOverModalProps) {
  const { t, language } = useLanguage();
  const placementLabels = language === 'es' ? PLACEMENT_LABELS_ES : PLACEMENT_LABELS_EN;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div
            className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-bold shadow-lg bg-white/15 border border-white/20"
          >
            🎉
          </div>
          <h2 className="text-3xl font-bold mb-2 text-white">{t('gameOver.title')}</h2>
          <p className="text-xl text-white mb-1">
            {t('gameOver.winnerIs', { name: winner.name })}
          </p>
          <p className="text-sm text-white/70 mb-4">
            {winner.isHuman ? t('gameOver.congratulations') : t('gameOver.betterLuck')}
          </p>

          {/* Ranked rating change */}
          {isRanked && ratingUpdate && (
            <div className="bg-white/10 rounded-xl p-3 mb-4 border border-white/20">
              <p className="text-xs text-white/60 mb-1">
                {t('gameOver.placed', { ordinal: placementLabels[ratingUpdate.placement] ?? `#${ratingUpdate.placement}` })}
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-white/60 text-sm">{ratingUpdate.oldRating}</span>
                <span className="text-white/40">→</span>
                <span className="text-white font-bold text-lg">{ratingUpdate.newRating}</span>
                <span className={`text-sm font-bold ${ratingUpdate.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {ratingUpdate.delta >= 0 ? '+' : ''}{ratingUpdate.delta}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={onQuit}
              className="px-6 py-3 text-white font-bold rounded-xl transition-colors text-sm btn-3d-accent"
            >
              {t('gameOver.newGame')}
            </button>
            {analysisEnabled && (
              <button
                onClick={onViewGameAnalysis}
                className="px-6 py-3 btn-glass text-white font-bold rounded-xl transition-colors text-sm"
              >
                {t('gameOver.gameAnalysis')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
