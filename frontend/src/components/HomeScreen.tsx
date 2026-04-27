import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RulesModal from './RulesModal';
import { Difficulty } from '../game/AIPlayer';
import type { GameConfig } from '../types/routes';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ProfileStorage } from '../utils/profileStorage';
import BackIcon from './BackIcon';

// Dice face: 6 pip positions in a 2×3 grid, filled left-to-right top-to-bottom
function DiceFace({ value }: { value: number }) {
  return (
    <div className="w-10 h-14 bg-white/20 border border-white/30 rounded-xl grid grid-cols-2 gap-1.5 p-2">
      {[0, 1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className={`rounded-full ${i < value ? 'bg-white' : 'bg-white/15'}`}
        />
      ))}
    </div>
  );
}

const DIFFICULTY_CONFIG = {
  easy:   { sub: 'Relaxed AI', bg: 'rgba(34,197,94,0.3)',  border: 'rgba(34,197,94,0.7)'  },
  medium: { sub: 'Balanced',   bg: 'rgba(251,191,36,0.3)', border: 'rgba(251,191,36,0.7)' },
  hard:   { sub: 'Expert AI',  bg: 'rgba(239,68,68,0.3)',  border: 'rgba(239,68,68,0.7)'  },
} as const;

export default function HomeScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const profile = ProfileStorage.getProfile();
  const profileName = profile.username
    ? `@${profile.username}`
    : (profile.name && profile.name !== 'You' ? profile.name : null);

  useEffect(() => {
    document.title = "Play Liar's Dice vs Computer — Dudo Dice";
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', 'https://dudodice.com/play');
    document.querySelector('meta[name="description"]')?.setAttribute('content', "Play Liar's Dice against computer AI for free. Single-player Perudo with bidding, bluffing and challenges. Pick your difficulty and start in seconds.");
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', 'https://dudodice.com/play');
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', "Play Liar's Dice vs Computer — Dudo Dice");
    return () => {
      document.title = "Dudo Dice - Play Liar's Dice Online Free";
      document.querySelector('link[rel="canonical"]')?.setAttribute('href', 'https://dudodice.com/');
      document.querySelector('meta[name="description"]')?.setAttribute('content', "Play Liar's Dice online free — bid, bluff and challenge in real-time multiplayer or solo vs AI. Also known as Perudo or Dudo. No download required.");
      document.querySelector('meta[property="og:url"]')?.setAttribute('content', 'https://dudodice.com/');
      document.querySelector('meta[property="og:title"]')?.setAttribute('content', "Dudo Dice - Play Liar's Dice Online Free");
    };
  }, []);

  const [playerCount, setPlayerCount] = useState(6);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [startingDice, setStartingDice] = useState(5);
  const [analysisEnabled, setAnalysisEnabled] = useState(true);
  const [palificoEnabled, setPalificoEnabled] = useState(false);
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
        className="fixed h-10 sm:h-8 text-white text-xs sm:text-sm font-semibold z-50 rounded-xl px-2 shadow-md bg-gradient-to-br from-indigo-700 to-purple-900 flex items-center"
        style={{ left: '0.75rem', top: '0.75rem' }}
      >
        <BackIcon />{t('common.back')}
      </button>

      <div className="max-w-2xl sm:max-w-3xl w-full pt-12 sm:pt-0">
        {/* Logo and title */}
        <div className="flex items-center justify-center gap-4 mb-5">
          <picture>
            <source srcSet="/Logo.webp" type="image/webp" />
            <img src="/Logo.png" alt="Dudo Dice Logo" className="flex-shrink-0" style={{ width: '72px', height: '72px' }} />
          </picture>
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold text-white">Dudo Dice</h1>
            <p className="text-sm text-white mt-1">{t('landing.tagline')}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl overflow-hidden mb-4 animate-fade-slide-up">
          {/* Tertiary header row — Profile & Rules as text links */}
          <div className="bg-white/10 border-b border-white/20 flex gap-3 px-2 rounded-t-2xl">
            <button
              onClick={() => navigate('/profile')}
              className="flex-1 py-2.5 text-white hover:text-white/80 text-sm font-semibold transition-colors text-center flex items-center justify-center gap-1.5"
            >
              {user && <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />}
              👤 {profileName ?? t('home.profile')}
            </button>
            <button
              onClick={() => setShowRules(true)}
              className="flex-1 py-2.5 text-white hover:text-white/80 text-sm font-semibold transition-colors text-center"
            >
              📖 Rules & FAQ
            </button>
          </div>

          {/* Body */}
          <div className="px-5 divide-y divide-white/20">

            {/* Players & Starting Dice */}
            <div className="py-4">
              <div className="flex gap-6">
                {/* Players */}
                <div className="flex-1 flex flex-col items-center gap-2">
                  <label className="text-base font-bold text-white">{t('common.players')}</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPlayerCount(Math.max(2, playerCount - 1))}
                      disabled={playerCount <= 2}
                      className="text-xl font-bold text-white disabled:opacity-25 disabled:cursor-not-allowed w-8 text-center"
                    >−</button>
                    <DiceFace value={playerCount} />
                    <button
                      onClick={() => setPlayerCount(Math.min(6, playerCount + 1))}
                      disabled={playerCount >= 6}
                      className="text-xl font-bold text-white disabled:opacity-25 disabled:cursor-not-allowed w-8 text-center"
                    >+</button>
                  </div>
                  <span className="text-white/60 text-xs">{playerCount} players</span>
                </div>

                {/* Starting Dice */}
                <div className="flex-1 flex flex-col items-center gap-2">
                  <label className="text-base font-bold text-white">{t('home.startingDice')}</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setStartingDice(Math.max(1, startingDice - 1))}
                      disabled={startingDice <= 1}
                      className="text-xl font-bold text-white disabled:opacity-25 disabled:cursor-not-allowed w-8 text-center"
                    >−</button>
                    <DiceFace value={startingDice} />
                    <button
                      onClick={() => setStartingDice(Math.min(5, startingDice + 1))}
                      disabled={startingDice >= 5}
                      className="text-xl font-bold text-white disabled:opacity-25 disabled:cursor-not-allowed w-8 text-center"
                    >+</button>
                  </div>
                  <span className="text-white/60 text-xs">{startingDice} dice each</span>
                </div>
              </div>
            </div>

            {/* Difficulty */}
            <div className="py-4">
              <label className="block text-base font-bold text-white mb-2">{t('home.difficulty')}</label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => {
                  const isSelected = difficulty === diff;
                  const cfg = DIFFICULTY_CONFIG[diff];
                  return (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      className="py-3 rounded-xl font-bold transition-colors text-sm flex flex-col items-center gap-0.5 btn-glass"
                      style={isSelected ? { background: cfg.bg, borderColor: cfg.border, borderWidth: '1.5px', borderStyle: 'solid' } : {}}
                    >
                      <span className="text-white font-bold">
                        {diff === 'easy' ? t('home.easy') : diff === 'medium' ? t('home.medium') : t('home.hard')}
                      </span>
                      <span className="text-white/55 text-xs font-normal">{cfg.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Round Analysis */}
            <div className="py-4">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-base font-bold text-white">{t('home.roundAnalysis')}</label>
                <div className="relative group">
                  <div className="w-5 h-5 rounded-full bg-white/20 group-hover:bg-white/30 text-white text-xs font-bold flex items-center justify-center transition-colors cursor-help">
                    i
                  </div>
                  <div className="absolute left-0 bottom-7 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <p className="text-xs text-white/90 bg-indigo-900 border border-white/20 rounded-lg p-2 shadow-lg">
                      {t('home.roundAnalysisTooltip')}
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
                      {val === 'on' ? t('common.on') : t('common.off')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Advanced Rules — collapsible */}
            <div className="py-1">
              <button
                onClick={() => setShowAdvancedSettings(v => !v)}
                className={`w-full flex items-center justify-between py-3 text-base transition-colors ${showAdvancedSettings ? 'font-semibold text-white' : 'font-bold text-white/70 hover:text-white'}`}
              >
                <span>{t('home.advancedRules')}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className={`w-4 h-4 transition-transform duration-200 ${showAdvancedSettings ? 'rotate-180' : ''}`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showAdvancedSettings ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="pb-4 space-y-4">

                  {/* Palifico */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-base font-bold text-white">{t('home.palifico')}</label>
                      <div className="relative group">
                        <div className="w-5 h-5 rounded-full bg-white/20 group-hover:bg-white/30 text-white text-xs font-bold flex items-center justify-center transition-colors cursor-help">i</div>
                        <div className="absolute left-0 top-7 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                          <p className="text-xs text-white/90 bg-indigo-900 border border-white/20 rounded-lg p-2 shadow-lg">{t('home.palificoTooltip')}</p>
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
                            {val === 'on' ? t('common.on') : t('common.off')}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="h-px bg-white/20" />

                  {/* Calza */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-base font-bold text-white">{t('home.calza')}</label>
                      <div className="relative group">
                        <div className="w-5 h-5 rounded-full bg-white/20 group-hover:bg-white/30 text-white text-xs font-bold flex items-center justify-center transition-colors cursor-help">i</div>
                        <div className="absolute left-0 top-7 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                          <p className="text-xs text-white/90 bg-indigo-900 border border-white/20 rounded-lg p-2 shadow-lg">{t('home.calzaTooltip')}</p>
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
                            {val === 'on' ? t('common.on') : t('common.off')}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Start Game */}
            <div className="py-4 flex justify-center">
              <button
                onClick={handleStart}
                className="w-full py-4 text-white font-extrabold text-lg rounded-xl transition-colors btn-3d-accent flex items-center justify-center gap-3"
              >
                🎲 {t('home.startGame')}
              </button>
            </div>

          </div>
        </div>
      </div>

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
}
