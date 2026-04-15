import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfileStorage } from '../utils/profileStorage';
import RulesModal from './RulesModal';
import type { useMultiplayerConnection, PublicRoom } from '../hooks/useMultiplayerConnection';
import { useLanguage } from '../i18n/LanguageContext';
import BackIcon from './BackIcon';

interface LobbyScreenProps {
  mp: ReturnType<typeof useMultiplayerConnection>;
}

type Tab = 'join' | 'create' | 'browse';

export default function LobbyScreen({ mp }: LobbyScreenProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isConnected, publicRooms, error, connect, createRoom, joinRoom, quickMatch, listRooms } = mp;

  const [activeTab, setActiveTab] = useState<Tab>('create');
  const [roomCode, setRoomCode] = useState('');
  const [showRules, setShowRules] = useState(false);

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
        <div className="flex items-center justify-center gap-4 mb-5 pl-16 sm:pl-0">
          <picture><source srcSet="/Logo.webp" type="image/webp" /><img src="/Logo.png" alt="Dudo Dice Logo" className="flex-shrink-0" style={{ width: '56px', height: '56px' }} /></picture>
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-white">{t('lobby.title')}</h1>
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

        <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl p-5">
          {/* Join tab */}
          {activeTab === 'join' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">{t('lobby.roomCode')}</label>
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
                className="w-full py-2.5 text-white font-extrabold rounded-xl btn-3d-accent disabled:opacity-50"
              >
                {t('lobby.joinRoom')}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/20" /></div>
                <div className="relative flex justify-center text-sm"><span className="bg-indigo-800 px-2 text-white/60">{t('common.or')}</span></div>
              </div>

              <button
                onClick={handleQuickMatch}
                disabled={!isConnected}
                className="w-full py-2.5 text-white font-bold rounded-xl btn-glass disabled:opacity-50"
              >
                {t('lobby.quickMatch')}
              </button>
            </div>
          )}

          {/* Create tab */}
          {activeTab === 'create' && (
            <div className="-m-5 overflow-visible rounded-2xl">
              {/* Header */}
              <div className="bg-white/10 border-b border-white/20 px-5 py-4 rounded-t-2xl flex justify-between items-center">
                <h2 className="text-lg font-bold text-white">{t('lobby.createRoomHeading')}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/profile')}
                    className="h-8 px-3 text-sm font-semibold rounded-xl transition-colors btn-glass flex items-center"
                  >
                    {t('profile.settings').split(' ')[0]}
                  </button>
                  <button
                    onClick={() => setShowRules(true)}
                    className="h-8 px-3 text-sm font-semibold rounded-xl transition-colors btn-glass flex items-center"
                  >
                    {t('rules.rulesTab')}
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-5 divide-y divide-white/20">
                {/* Players & Dice */}
                <div className="py-3">
                  <div className="flex gap-4">
                    <div className="flex-1 flex flex-col items-center">
                      <label className="block text-sm font-semibold text-white mb-2">{t('lobby.maxPlayers')}</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setMaxPlayers(Math.max(2, maxPlayers - 1))}
                          disabled={maxPlayers <= 2}
                          className="w-9 h-9 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-base flex items-center justify-center btn-glass"
                        >−</button>
                        <div className="w-12 h-9 bg-white/20 border border-white/30 rounded-xl flex items-center justify-center">
                          <span className="text-lg font-bold text-white">{maxPlayers}</span>
                        </div>
                        <button
                          onClick={() => setMaxPlayers(Math.min(6, maxPlayers + 1))}
                          disabled={maxPlayers >= 6}
                          className="w-9 h-9 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-base flex items-center justify-center btn-glass"
                        >+</button>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center">
                      <label className="block text-sm font-semibold text-white mb-2">{t('lobby.startingDice')}</label>
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

                {/* Rules — Palifico + Calza together */}
                <div className="py-3 space-y-4">
                  {/* Palifico */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-semibold text-white">{t('home.palifico')}</label>
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

                  {/* Calza */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-semibold text-white">{t('home.calza')}</label>
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

                {/* Visibility */}
                <div className="py-3">
                  <label className="block text-sm font-semibold text-white mb-2">{t('lobby.visibility')}</label>
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

                {/* Create Room */}
                <div className="py-3">
                  <button
                    onClick={handleCreate}
                    disabled={!isConnected}
                    className="w-full py-2.5 text-white font-extrabold rounded-xl btn-3d-accent disabled:opacity-50"
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
                  <div key={room.code} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
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
