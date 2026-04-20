import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfileStorage } from '../utils/profileStorage';
import { useAuth } from '../context/AuthContext';
import RulesModal from './RulesModal';
import type { useMultiplayerConnection, PublicRoom } from '../hooks/useMultiplayerConnection';
import { useLanguage } from '../i18n/LanguageContext';
import BackIcon from './BackIcon';

interface LobbyScreenProps {
  mp: ReturnType<typeof useMultiplayerConnection>;
}

type Tab = 'join' | 'create' | 'browse';

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

export default function LobbyScreen({ mp }: LobbyScreenProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const profile = ProfileStorage.getProfile();
  const profileName = profile.username
    ? `@${profile.username}`
    : (profile.name && profile.name !== 'You' ? profile.name : null);
  useEffect(() => {
    document.title = "Play Liar's Dice Online Multiplayer — Dudo Dice";
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', 'https://dudodice.com/online');
    document.querySelector('meta[name="description"]')?.setAttribute('content', "Play Perudo (Liar's Dice) online with friends in real-time. Create private rooms, share a code, and challenge players across any device. Free to play.");
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', 'https://dudodice.com/online');
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', "Play Liar's Dice Online Multiplayer — Dudo Dice");
    return () => {
      document.title = "Dudo Dice - Play Liar's Dice Online Free";
      document.querySelector('link[rel="canonical"]')?.setAttribute('href', 'https://dudodice.com/');
      document.querySelector('meta[name="description"]')?.setAttribute('content', "Free online Liar's Dice game. Bid, bluff, and challenge — play against AI or in real-time multiplayer. Also known as Perudo. No download required.");
      document.querySelector('meta[property="og:url"]')?.setAttribute('content', 'https://dudodice.com/');
      document.querySelector('meta[property="og:title"]')?.setAttribute('content', "Dudo Dice - Play Liar's Dice Online Free");
    };
  }, []);
  const { isConnected, publicRooms, error, connect, createRoom, joinRoom, quickMatch, listRooms } = mp;

  const [activeTab, setActiveTab] = useState<Tab>('create');
  const [roomCode, setRoomCode] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Create room settings
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [startingDice, setStartingDice] = useState(5);
  const [palificoEnabled, setPalificoEnabled] = useState(false);
  const [calzaEnabled, setCalzaEnabled] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (!isConnected) connect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'browse') {
      listRooms();
    }
  }, [activeTab, listRooms]);

  const getName = () => {
    const profile = ProfileStorage.getProfile();
    if (profile.username) return profile.username;
    return profile.name === 'You' ? 'Player' : profile.name;
  };

  const handleJoin = () => {
    if (!roomCode.trim()) return;
    joinRoom(roomCode.trim().toUpperCase(), getName());
  };

  const handleQuickMatch = () => {
    quickMatch(getName());
  };

  const handleCreate = () => {
    createRoom(
      { maxPlayers, startingDice, palificoEnabled, calzaEnabled, difficulty: 'medium' },
      isPublic,
      getName()
    );
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 sm:p-8" style={{ overflowY: 'auto' }}>
      {/* Back button - fixed top left */}
      <button
        onClick={() => { mp.disconnect(); navigate('/'); }}
        className="fixed h-10 sm:h-8 text-white text-xs sm:text-sm font-semibold z-50 rounded-xl px-2 shadow-md bg-gradient-to-br from-indigo-700 to-purple-900 flex items-center"
        style={{ left: '0.75rem', top: '0.75rem' }}
      >
        <BackIcon />{t('common.back')}
      </button>
      <div className="max-w-lg sm:max-w-3xl w-full pt-12 sm:pt-0">
        {/* Header */}
        <div className="flex items-center justify-center gap-4 mb-5">
          <picture><source srcSet="/Logo.webp" type="image/webp" /><img src="/Logo.png" alt="Dudo Dice Logo" className="flex-shrink-0" style={{ width: '72px', height: '72px' }} /></picture>
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold text-white">{t('lobby.title')}</h1>
            <p className="text-sm text-white/70">
              {isConnected ? t('lobby.connected') : t('lobby.connecting')}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(['join', 'create', 'browse'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl font-bold text-sm transition-colors ${
                activeTab === tab ? 'text-white btn-3d-accent' : 'btn-glass'
              }`}
            >
              {tab === 'join' ? t('lobby.tabJoin') : tab === 'create' ? t('lobby.tabCreate') : t('lobby.tabBrowse')}
            </button>
          ))}
        </div>

        <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl p-5 overflow-hidden animate-fade-slide-up">
          {/* Join tab */}
          {activeTab === 'join' && (
            <div className="space-y-4">
              <div>
                <label className="block text-base font-bold text-white mb-2">{t('lobby.roomCode')}</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder={t('lobby.roomCodePlaceholder')}
                  maxLength={4}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
              <button
                onClick={handleJoin}
                disabled={!isConnected || !roomCode.trim()}
                className="w-full py-4 text-white font-extrabold text-lg rounded-xl btn-3d-accent disabled:opacity-50"
              >
                {t('lobby.joinRoom')}
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/20" />
                <span className="text-sm text-white/50">{t('common.or')}</span>
                <div className="flex-1 h-px bg-white/20" />
              </div>

              <button
                onClick={handleQuickMatch}
                disabled={!isConnected}
                className="w-full py-3 text-white font-bold rounded-xl btn-glass disabled:opacity-50"
              >
                {t('lobby.quickMatch')}
              </button>
            </div>
          )}

          {/* Create tab */}
          {activeTab === 'create' && (
            <div className="-m-5 overflow-hidden rounded-2xl">
              {/* Header */}
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
                {/* Players & Dice */}
                <div className="py-4">
                  <div className="flex gap-6">
                    {/* Max Players */}
                    <div className="flex-1 flex flex-col items-center gap-2">
                      <label className="text-base font-bold text-white">{t('lobby.maxPlayers')}</label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setMaxPlayers(Math.max(2, maxPlayers - 1))}
                          disabled={maxPlayers <= 2}
                          className="text-xl font-bold text-white disabled:opacity-25 disabled:cursor-not-allowed w-8 text-center"
                        >−</button>
                        <DiceFace value={maxPlayers} />
                        <button
                          onClick={() => setMaxPlayers(Math.min(6, maxPlayers + 1))}
                          disabled={maxPlayers >= 6}
                          className="text-xl font-bold text-white disabled:opacity-25 disabled:cursor-not-allowed w-8 text-center"
                        >+</button>
                      </div>
                      <span className="text-white/60 text-xs">{maxPlayers} {t('common.players').toLowerCase()}</span>
                    </div>

                    {/* Starting Dice */}
                    <div className="flex-1 flex flex-col items-center gap-2">
                      <label className="text-base font-bold text-white">{t('lobby.startingDice')}</label>
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

                {/* Visibility */}
                <div className="py-4">
                  <label className="block text-base font-bold text-white mb-2">{t('lobby.visibility')}</label>
                  <div className="flex justify-center gap-2">
                    {([true, false] as const).map((val) => (
                      <button
                        key={String(val)}
                        onClick={() => setIsPublic(val)}
                        style={{ width: 'calc((100% - 1rem) / 3)' }}
                        className={`py-2 rounded-xl font-bold text-sm ${
                          isPublic === val ? 'text-white btn-3d-accent' : 'btn-glass'
                        }`}
                      >
                        {val ? t('lobby.public') : t('lobby.private')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advanced Rules — collapsible */}
                <div className="py-1">
                  <button
                    onClick={() => setShowAdvanced(v => !v)}
                    className={`w-full flex items-center justify-between py-3 text-base transition-colors ${showAdvanced ? 'font-semibold text-white' : 'font-bold text-white/70 hover:text-white'}`}
                  >
                    <span>{t('home.advancedRules')}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className={`w-4 h-4 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showAdvanced ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="pb-4 space-y-4">
                      {/* Palifico */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="text-base font-bold text-white">{t('home.palifico')}</label>
                          <div className="relative group">
                            <div className="w-5 h-5 rounded-full bg-white/20 group-hover:bg-white/30 text-white text-xs font-bold flex items-center justify-center transition-colors cursor-help">
                              i
                            </div>
                            <div className="absolute left-0 top-7 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                              <p className="text-xs text-white/90 bg-indigo-900 border border-white/20 rounded-lg p-2 shadow-lg">
                                {t('home.palificoTooltip')}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-center gap-2">
                          {(['off', 'on'] as const).map((val) => (
                            <button
                              key={val}
                              onClick={() => setPalificoEnabled(val === 'on')}
                              style={{ width: 'calc((100% - 1rem) / 3)' }}
                              className={`py-2 rounded-xl font-bold text-sm ${
                                palificoEnabled === (val === 'on') ? 'text-white btn-3d-accent' : 'btn-glass'
                              }`}
                            >
                              {val === 'on' ? t('common.on') : t('common.off')}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="h-px bg-white/20" />

                      {/* Calza */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="text-base font-bold text-white">{t('home.calza')}</label>
                          <div className="relative group">
                            <div className="w-5 h-5 rounded-full bg-white/20 group-hover:bg-white/30 text-white text-xs font-bold flex items-center justify-center transition-colors cursor-help">
                              i
                            </div>
                            <div className="absolute left-0 top-7 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                              <p className="text-xs text-white/90 bg-indigo-900 border border-white/20 rounded-lg p-2 shadow-lg">
                                {t('home.calzaTooltip')}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-center gap-2">
                          {(['off', 'on'] as const).map((val) => (
                            <button
                              key={val}
                              onClick={() => setCalzaEnabled(val === 'on')}
                              style={{ width: 'calc((100% - 1rem) / 3)' }}
                              className={`py-2 rounded-xl font-bold text-sm ${
                                calzaEnabled === (val === 'on') ? 'text-white btn-3d-accent' : 'btn-glass'
                              }`}
                            >
                              {val === 'on' ? t('common.on') : t('common.off')}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Create Room */}
                <div className="py-4">
                  <button
                    onClick={handleCreate}
                    disabled={!isConnected}
                    className="w-full py-4 text-white font-extrabold text-lg rounded-xl btn-3d-accent disabled:opacity-50"
                  >
                    {t('lobby.createRoom')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Browse tab */}
          {activeTab === 'browse' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/70">{t('lobby.roomsAvailable', { n: publicRooms.length })}</span>
                <button onClick={listRooms} className="text-sm btn-glass px-3 py-1 rounded-lg font-bold">
                  {t('lobby.refresh')}
                </button>
              </div>

              {publicRooms.length === 0 ? (
                <p className="text-center text-white/50 py-6 text-sm">
                  {t('lobby.noRooms')}
                </p>
              ) : (
                (publicRooms as PublicRoom[]).map((room) => (
                  <div key={room.code} className="flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/20">
                    <div>
                      <span className="font-bold text-white text-sm">{room.code}</span>
                      <span className="text-white/50 text-xs ml-2">
                        {t('lobby.by')} {room.hostName}
                        {room.hostRating != null && (
                          <span className="ml-1 text-white/40 font-mono">
                            ({room.hostRating}{room.hostProvisional ? t('lobby.ratingProvisional').replace('(rating provisionally)', '?') : ''})
                          </span>
                        )}
                      </span>
                      <div className="text-xs text-white/40 mt-0.5">
                        {room.playerCount}/{room.maxPlayers} {t('common.players').toLowerCase()} · {room.settings.startingDice} {t('common.dice')}
                        {room.settings.palificoEnabled && ' · Palifico'}
                        {room.settings.calzaEnabled && ' · Calza'}
                      </div>
                    </div>
                    <button
                      onClick={() => joinRoom(room.code, getName())}
                      disabled={!isConnected}
                      className="px-4 py-1.5 text-sm font-bold rounded-xl btn-3d-accent disabled:opacity-50"
                    >
                      {t('lobby.join')}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>

      {showRules && (
        <RulesModal onClose={() => setShowRules(false)} />
      )}
    </div>
  );
}
