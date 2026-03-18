import { useState } from 'react';
import RulesModal from './RulesModal';
import { Difficulty } from '../game/AIPlayer';

interface HomeScreenProps {
  onStartGame: (playerCount: number, difficulty: Difficulty, startingDice: number, analysisEnabled: boolean, palificoEnabled: boolean, calzaEnabled: boolean) => void;
  onShowProfile: () => void;
}

export default function HomeScreen({ onStartGame, onShowProfile }: HomeScreenProps) {
  const [playerCount, setPlayerCount] = useState(6);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [startingDice, setStartingDice] = useState(5);
  const [analysisEnabled, setAnalysisEnabled] = useState(false);
  const [palificoEnabled, setPalificoEnabled] = useState(true);
  const [calzaEnabled, setCalzaEnabled] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const handleStart = () => {
    onStartGame(playerCount, difficulty, startingDice, analysisEnabled, palificoEnabled, calzaEnabled);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
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

        <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl p-5 mb-6 relative">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-white">
              Game Setup
            </h2>
            <div className="flex gap-2 items-center">
              <button
                onClick={onShowProfile}
                className="px-3 py-1.5 text-sm font-semibold rounded-xl transition-colors btn-glass"
              >
                Profile
              </button>
              <button
                onClick={() => setShowRules(true)}
                className="px-3 py-1.5 text-sm font-semibold rounded-xl transition-colors btn-glass"
              >
                View Rules
              </button>
              <button
                onClick={() => setShowAdvancedSettings(true)}
                title="Advanced Settings"
                className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors btn-glass text-base"
              >
                ⚙
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-white mb-2">
              Number of Players: <span className="font-extrabold text-white">{playerCount}</span>
            </label>
            <input
              type="range"
              min="2"
              max="6"
              value={playerCount}
              onChange={(e) => setPlayerCount(Number(e.target.value))}
              className="w-full h-3 bg-white/20 rounded-xl appearance-none cursor-pointer accent-white"
            />
            <div className="flex justify-between text-xs text-white/70 mt-1">
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
              <span>6</span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-white mb-2">
              Starting Dice: <span className="font-extrabold text-white">{startingDice}</span>
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={startingDice}
              onChange={(e) => setStartingDice(Number(e.target.value))}
              className="w-full h-3 bg-white/20 rounded-xl appearance-none cursor-pointer accent-white"
            />
            <div className="flex justify-between text-xs text-white/70 mt-1">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>

          <div className="mb-4 flex gap-4">
            {/* Difficulty */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-white mb-2">
                Difficulty:
              </label>
              <div className="flex gap-2 justify-center">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => {
                  const isSelected = difficulty === diff;
                  return (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      className={`flex-1 py-2 rounded-xl font-bold transition-colors text-sm ${isSelected ? 'text-white btn-3d-accent' : 'btn-glass'}`}
                    >
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-white/65 mt-1 text-center">
                {difficulty === 'easy' && 'Balanced strategy'}
                {difficulty === 'medium' && 'Improved probability analysis'}
                {difficulty === 'hard' && 'Advanced bluffing'}
              </p>
            </div>

            {/* Divider */}
            <div className="w-px bg-white/20 self-stretch" />

            {/* Round Analysis */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-white mb-2">
                Round Analysis:
              </label>
              <div className="flex gap-2 justify-center">
                {(['off', 'on'] as const).map((val) => {
                  const isSelected = analysisEnabled === (val === 'on');
                  return (
                    <button
                      key={val}
                      onClick={() => setAnalysisEnabled(val === 'on')}
                      className={`flex-1 py-2 rounded-xl font-bold transition-colors text-sm ${isSelected ? 'text-white btn-3d-accent' : 'btn-glass'}`}
                    >
                      {val.charAt(0).toUpperCase() + val.slice(1)}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-white/65 mt-1 text-center">
                {analysisEnabled ? 'Insights after each round' : 'Just play'}
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleStart}
              className="px-6 py-2.5 text-white font-extrabold text-base rounded-xl transition-colors btn-3d-accent"
            >
              Start Game
            </button>
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
                  <label className="block text-sm font-semibold text-white mb-2">
                    Palifico:
                  </label>
                  <div className="flex gap-2">
                    {(['off', 'on'] as const).map((val) => {
                      const isSelected = palificoEnabled === (val === 'on');
                      return (
                        <button
                          key={val}
                          onClick={() => setPalificoEnabled(val === 'on')}
                          className={`flex-1 py-2 rounded-xl font-bold transition-colors text-sm ${isSelected ? 'text-white btn-3d-accent' : 'btn-glass'}`}
                        >
                          {val.charAt(0).toUpperCase() + val.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-white/65 mt-1">
                    {palificoEnabled ? 'One-die player locks the face value for the round' : 'Disabled — no face value lock'}
                  </p>
                </div>

                <div className="h-px bg-white/20" />

                {/* Calza */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Calza:
                  </label>
                  <div className="flex gap-2">
                    {(['off', 'on'] as const).map((val) => {
                      const isSelected = calzaEnabled === (val === 'on');
                      return (
                        <button
                          key={val}
                          onClick={() => setCalzaEnabled(val === 'on')}
                          className={`flex-1 py-2 rounded-xl font-bold transition-colors text-sm ${isSelected ? 'text-white btn-3d-accent' : 'btn-glass'}`}
                        >
                          {val.charAt(0).toUpperCase() + val.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-white/65 mt-1">
                    {calzaEnabled ? 'Call exact count to gain a die back' : 'Disabled — challenge only with Dudo'}
                  </p>
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
