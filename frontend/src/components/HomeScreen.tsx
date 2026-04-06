import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RulesModal from './RulesModal';
import { Difficulty } from '../game/AIPlayer';
import type { GameConfig } from '../types/routes';

export default function HomeScreen() {
  const navigate = useNavigate();
  const [playerCount, setPlayerCount] = useState(6);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [startingDice, setStartingDice] = useState(5);
  const [analysisEnabled, setAnalysisEnabled] = useState(true);
  const [palificoEnabled, setPalificoEnabled] = useState(true);
  const [calzaEnabled, setCalzaEnabled] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const handleStart = () => {
    const config: GameConfig = {
      playerCount,
      difficulty,
      startingDice,
      analysisEnabled,
      palificoEnabled,
      calzaEnabled,
    };
    navigate('/game', { state: config });
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 sm:p-8 relative" style={{ overflowY: 'auto' }}>
      {/* Back button - fixed top left */}
      <button
        onClick={() => navigate('/')}
        className="fixed text-white text-sm font-semibold z-50 rounded-xl px-2 py-1 shadow-md bg-gradient-to-br from-indigo-700 to-purple-900"
        style={{ left: '0.75rem', top: '0.75rem' }}
      >
        ← Back
      </button>
      <div className="max-w-2xl sm:max-w-5xl w-full pt-12 sm:pt-0">
        {/* Logo and title side by side */}
        <div className="flex items-center justify-center gap-4 mb-5 pl-16 sm:pl-0">
          <picture>
            <source srcSet="/Logo.webp" type="image/webp" />
            <img src="/Logo.png" alt="Dudo Dice Logo" className="flex-shrink-0" style={{ width: '72px', height: '72px' }} />
          </picture>
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold text-white">
              Dudo Dice
            </h1>
            <p className="text-sm text-white mt-1">
              The Classic Perudo Game
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl overflow-hidden mb-4 relative">
          {/* Header */}
          <div className="bg-white/10 border-b border-white/20 px-5 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Game Setup</h2>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => navigate('/profile')}
                className="h-9 px-3 text-sm font-semibold rounded-xl transition-colors btn-glass flex items-center"
              >
                Profile
              </button>
              <button
                onClick={() => setShowRules(true)}
                className="h-9 px-3 text-sm font-semibold rounded-xl transition-colors btn-glass flex items-center"
              >
                Rules
              </button>
              <button
                onClick={() => setShowAdvancedSettings(true)}
                title="Advanced Settings"
                className="h-9 w-9 flex items-center justify-center rounded-xl transition-colors btn-glass text-base text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53a7.76 7.76 0 0 0 .07-1 7.76 7.76 0 0 0-.07-.97l2.11-1.63a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1a7.15 7.15 0 0 0-1.69-.98l-.38-2.65A.49.49 0 0 0 14 2h-4a.49.49 0 0 0-.49.42l-.38 2.65a7.15 7.15 0 0 0-1.69.98l-2.49-1a.5.5 0 0 0-.61.22l-2 3.46a.49.49 0 0 0 .12.64L4.57 11a7.9 7.9 0 0 0 0 1.97l-2.11 1.66a.49.49 0 0 0-.12.64l2 3.46a.5.5 0 0 0 .61.22l2.49-1c.52.4 1.08.72 1.69.98l.38 2.65c.05.24.26.42.49.42h4c.23 0 .44-.18.49-.42l.38-2.65a7.15 7.15 0 0 0 1.69-.98l2.49 1a.5.5 0 0 0 .61-.22l2-3.46a.49.49 0 0 0-.12-.64l-2.11-1.66Z"/></svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 divide-y divide-white/20">
            {/* Players & Dice */}
            <div className="py-3">
              <div className="flex gap-4">
                <div className="flex-1 flex flex-col items-center">
                  <label className="block text-sm font-semibold text-white mb-2">Players</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPlayerCount(Math.max(2, playerCount - 1))}
                      disabled={playerCount <= 2}
                      className="w-9 h-9 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-base flex items-center justify-center btn-glass"
                    >−</button>
                    <div className="w-12 h-9 bg-white/20 border border-white/30 rounded-xl flex items-center justify-center">
                      <span className="text-lg font-bold text-white">{playerCount}</span>
                    </div>
                    <button
                      onClick={() => setPlayerCount(Math.min(6, playerCount + 1))}
                      disabled={playerCount >= 6}
                      className="w-9 h-9 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-base flex items-center justify-center btn-glass"
                    >+</button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center">
                  <label className="block text-sm font-semibold text-white mb-2">Starting Dice</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setStartingDice(Math.max(1, startingDice - 1))}
                      disabled={startingDice <= 1}
                      className="w-9 h-9 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-base flex items-center justify-center btn-glass"
                    >−</button>
                    <div className="w-12 h-9 bg-white/20 border border-white/30 rounded-xl flex items-center justify-center">
                      <span className="text-lg font-bold text-white">{startingDice}</span>
                    </div>
                    <button
                      onClick={() => setStartingDice(Math.min(5, startingDice + 1))}
                      disabled={startingDice >= 5}
                      className="w-9 h-9 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-base flex items-center justify-center btn-glass"
                    >+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Difficulty */}
            <div className="py-3">
              <label className="block text-sm font-semibold text-white mb-2">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => {
                  const isSelected = difficulty === diff;
                  return (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      className={`py-2 rounded-xl font-bold transition-colors text-sm ${isSelected ? 'text-white btn-3d-accent' : 'btn-glass'}`}
                    >
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Round Analysis */}
            <div className="py-3">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-semibold text-white">Round Analysis</label>
                <div className="relative group">
                  <div className="w-5 h-5 rounded-full bg-white/20 group-hover:bg-white/30 text-white text-xs font-bold flex items-center justify-center transition-colors cursor-help">
                    i
                  </div>
                  <div className="absolute left-0 bottom-7 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <p className="text-xs text-white/90 bg-indigo-900 border border-white/20 rounded-lg p-2 shadow-lg">
                      When enabled, you'll see insights and probability analysis after each round to help improve your strategy.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-2">
                {(['off', 'on'] as const).map((val) => {
                  const isSelected = analysisEnabled === (val === 'on');
                  return (
                    <button
                      key={val}
                      onClick={() => setAnalysisEnabled(val === 'on')}
                      style={{ width: 'calc((100% - 1rem) / 3)' }}
                      className={`py-2 rounded-xl font-bold transition-colors text-sm ${isSelected ? 'text-white btn-3d-accent' : 'btn-glass'}`}
                    >
                      {val.charAt(0).toUpperCase() + val.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Start Game */}
            <div className="py-3 flex justify-center">
              <button
                onClick={handleStart}
                className="px-6 py-2.5 text-white font-extrabold text-base rounded-xl transition-colors btn-3d-accent"
              >
                Start Game
              </button>
            </div>
          </div>
        </div>

        {showRules && (
          <RulesModal onClose={() => setShowRules(false)} />
        )}

        {showAdvancedSettings && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAdvancedSettings(false)}
          >
            <div
              className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl w-full max-w-sm p-5 animate-modal-enter overflow-visible"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-white">Advanced Rules</h2>
                <button
                  onClick={() => setShowAdvancedSettings(false)}
                  className="text-white/60 hover:text-white text-xl leading-none px-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Palifico */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-semibold text-white">
                      Palifico
                    </label>
                    <div className="relative group">
                      <div className="w-5 h-5 rounded-full bg-white/20 group-hover:bg-white/30 text-white text-xs font-bold flex items-center justify-center transition-colors cursor-help">
                        i
                      </div>
                      <div className="absolute left-0 top-7 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                        <p className="text-xs text-white/90 bg-indigo-900 border border-white/20 rounded-lg p-2 shadow-lg">
                          When a player is down to their last die, that round becomes a Palifico round. Ones are not wild and all bids must use the same face value as the first bid.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center gap-2">
                    {(['off', 'on'] as const).map((val) => {
                      const isSelected = palificoEnabled === (val === 'on');
                      return (
                        <button
                          key={val}
                          onClick={() => setPalificoEnabled(val === 'on')}
                          style={{ width: 'calc((100% - 1rem) / 3)' }}
                          className={`py-2 rounded-xl font-bold transition-colors text-sm ${isSelected ? 'text-white btn-3d-accent' : 'btn-glass'}`}
                        >
                          {val.charAt(0).toUpperCase() + val.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="h-px bg-white/20" />

                {/* Calza */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-semibold text-white">
                      Calza
                    </label>
                    <div className="relative group">
                      <div className="w-5 h-5 rounded-full bg-white/20 group-hover:bg-white/30 text-white text-xs font-bold flex items-center justify-center transition-colors cursor-help">
                        i
                      </div>
                      <div className="absolute left-0 top-7 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                        <p className="text-xs text-white/90 bg-indigo-900 border border-white/20 rounded-lg p-2 shadow-lg">
                          Instead of raising the bid or calling Dudo, call Calza to claim the bid is exactly right. If correct, gain a die back. If wrong, lose a die.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center gap-2">
                    {(['off', 'on'] as const).map((val) => {
                      const isSelected = calzaEnabled === (val === 'on');
                      return (
                        <button
                          key={val}
                          onClick={() => setCalzaEnabled(val === 'on')}
                          style={{ width: 'calc((100% - 1rem) / 3)' }}
                          className={`py-2 rounded-xl font-bold transition-colors text-sm ${isSelected ? 'text-white btn-3d-accent' : 'btn-glass'}`}
                        >
                          {val.charAt(0).toUpperCase() + val.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowAdvancedSettings(false)}
                className="mt-5 w-full py-2 text-white font-bold rounded-xl text-sm btn-3d-accent"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
