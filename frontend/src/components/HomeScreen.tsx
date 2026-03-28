import { useState } from 'react';
import RulesModal from './RulesModal';
import { Difficulty } from '../game/AIPlayer';

interface HomeScreenProps {
  onStartGame: (playerCount: number, difficulty: Difficulty, startingDice: number, analysisEnabled: boolean, palificoEnabled: boolean, calzaEnabled: boolean) => void;
  onShowProfile: () => void;
  onBack: () => void;
}

export default function HomeScreen({ onStartGame, onShowProfile, onBack }: HomeScreenProps) {
  const [playerCount, setPlayerCount] = useState(6);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [startingDice, setStartingDice] = useState(5);
  const [analysisEnabled, setAnalysisEnabled] = useState(true);
  const [palificoEnabled, setPalificoEnabled] = useState(true);
  const [calzaEnabled, setCalzaEnabled] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const handleStart = () => {
    onStartGame(playerCount, difficulty, startingDice, analysisEnabled, palificoEnabled, calzaEnabled);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
      {/* Back button - fixed top left */}
      <button
        onClick={onBack}
        className="fixed text-white text-sm font-semibold z-50 rounded-xl px-2 py-1 shadow-md bg-gradient-to-br from-indigo-700 to-purple-900"
        style={{ left: '0.75rem', top: '0.75rem' }}
      >
        ← Back
      </button>
      <div className="max-w-2xl w-full">
        {/* Logo and title side by side */}
        <div className="flex items-center justify-center gap-4 mb-5">
          <img
            src="/Logo.png"
            alt="Dudo Dice Logo"
            className="flex-shrink-0"
            style={{ width: '72px', height: '72px' }}
          />
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold text-white">
              Dudo Dice
            </h1>
            <p className="text-sm text-white mt-1">
              The Classic Perudo Game
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl overflow-hidden mb-6 relative">
          {/* Header */}
          <div className="bg-white/10 border-b border-white/20 px-5 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Game Setup</h2>
            <div className="flex gap-2 items-center">
              <button
                onClick={onShowProfile}
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
                ⚙
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
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-7 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
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
              className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl w-full max-w-sm p-5 animate-modal-enter"
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
                      <div className="absolute left-1/2 -translate-x-1/2 top-7 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
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
                      <div className="absolute left-1/2 -translate-x-1/2 top-7 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
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
