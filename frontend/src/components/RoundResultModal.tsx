import { useEffect } from 'react';
import { RoundResult } from '../game/GameState';
import DiceFace from './DiceFace';

interface RoundResultModalProps {
  result: RoundResult;
  onClose: () => void;
  onViewAnalysis?: () => void;
  analysisEnabled?: boolean;
  revealComplete?: boolean;
  closing?: boolean;
  autoClose?: boolean;
  players?: Array<{ id: string; name: string; isHuman?: boolean }>;
  /** Human just lost their last die — offer to skip to the end (vs AI) */
  onSkipToEnd?: () => void;
  /** Human just lost their last die in multiplayer — offer to leave */
  onLeaveGame?: () => void;
}

export default function RoundResultModal({
  result,
  onClose,
  onViewAnalysis,
  analysisEnabled = false,
  revealComplete = false,
  closing = false,
  autoClose = false,
  players = [],
  onSkipToEnd,
  onLeaveGame,
}: RoundResultModalProps) {
  // In multiplayer, auto-close after 3 seconds once reveal is complete
  useEffect(() => {
    if (autoClose && revealComplete) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [autoClose, revealComplete, onClose]);
  const loser = players.find(p => p.id === result.loserId);
  const winner = players.find(p => p.id === result.winnerId);
  const isHumanLoser = loser?.isHuman || false;
  const isHumanWinner = winner?.isHuman || false;
  const loserName = loser ? loser.name : 'Unknown Player';
  const winnerName = winner ? winner.name : 'Unknown Player';
  const isCalza = result.challengeType === 'calza';
  const calzaSuccess = result.calzaSuccess ?? false;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 pointer-events-none">
      <div
        className={`bg-gradient-to-br from-indigo-700 to-purple-900 rounded-xl shadow-2xl p-4 max-w-xs w-full mx-4 pointer-events-auto ${closing ? 'animate-modal-exit' : 'animate-modal-enter'}`}
      >
        <div className="text-center">
          <h2 className="text-xl font-bold mb-3 text-white">Round Result</h2>

          <div className="mb-3 space-y-2">
            <div className="bg-white/10 rounded-lg p-2">
              <p className="text-xs text-white/65 mb-1 font-semibold">{isCalza ? 'Calza Claimed' : 'Bid Made'}</p>
              <div className="flex items-center justify-center gap-1.5">
                <p className="text-lg font-bold text-white">
                  {result.challengedBid.quantity}x
                </p>
                <div className="w-6 h-6 bg-white rounded flex items-center justify-center shadow-sm">
                  <DiceFace value={result.challengedBid.faceValue} size="sm" />
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-2">
              <p className="text-xs text-white/65 mb-1 font-semibold">Actual Count</p>
              {revealComplete ? (
                <div className="flex items-center justify-center gap-1.5">
                  <p className="text-xl font-bold text-white">{result.actualCount}×</p>
                  <div className="w-6 h-6 bg-white rounded flex items-center justify-center shadow-sm">
                    <DiceFace value={result.challengedBid.faceValue} size="sm" />
                  </div>
                </div>
              ) : (
                <p className="text-xl font-bold text-white/50">---</p>
              )}
            </div>

            {isCalza ? (
              <div className={`${calzaSuccess ? 'bg-yellow-500/30' : 'bg-red-500/30'} rounded-lg p-2`}>
                <p className={`text-xs font-semibold mb-0.5 ${calzaSuccess ? 'text-yellow-200' : 'text-red-200'}`}>Result</p>
                <p className={`text-sm font-bold ${calzaSuccess ? 'text-yellow-100' : 'text-red-100'}`}>
                  {calzaSuccess
                    ? (isHumanWinner ? '🎯 Exact! You gain a die' : `🎯 Exact! ${winnerName} gains a die`)
                    : (isHumanLoser ? 'Wrong count — you lose a die' : `Wrong count — ${loserName} loses a die`)}
                </p>
              </div>
            ) : (
              <div className="bg-red-500/30 rounded-lg p-2">
                <p className="text-xs font-semibold text-red-200 mb-0.5">Result</p>
                <p className="text-sm font-bold text-red-100">
                  {isHumanLoser ? 'You lose a die' : `${loserName} loses a die`}
                </p>
              </div>
            )}
          </div>

          <div className={`flex gap-2 ${analysisEnabled ? 'justify-between' : 'justify-center'}`}>
            {analysisEnabled && revealComplete && (
              <button
                onClick={onViewAnalysis}
                className="flex-1 px-3 py-2 btn-glass text-white font-bold rounded-xl text-sm"
              >
                Analysis
              </button>
            )}
            <button
              onClick={onClose}
              className={`px-4 py-2 text-white font-bold rounded-xl transition-colors text-sm btn-3d-accent ${analysisEnabled ? 'flex-1' : 'w-full'}`}
            >
              Continue
            </button>
          </div>

          {/* Human eliminated — offer skip/leave actions */}
          {(onSkipToEnd || onLeaveGame) && (
            <div className="mt-2 pt-2 border-t border-white/15">
              <p className="text-xs text-white/60 mb-2 text-center">You&apos;ve been eliminated</p>
              {onSkipToEnd && (
                <button
                  onClick={onSkipToEnd}
                  className="w-full px-4 py-2 text-white font-bold rounded-xl text-sm btn-3d-accent mb-1.5"
                >
                  Skip to End
                </button>
              )}
              {onLeaveGame && (
                <button
                  onClick={onLeaveGame}
                  className="w-full px-4 py-2 btn-glass text-white font-bold rounded-xl text-sm"
                >
                  Leave Game
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
