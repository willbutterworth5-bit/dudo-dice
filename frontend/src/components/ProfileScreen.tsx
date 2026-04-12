import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfileStorage, imageToBase64, PlayerProfile, PlayerStats } from '../utils/profileStorage';
import { supabase } from '../lib/supabase';
import { ACHIEVEMENTS } from '../utils/achievements';
import { COUNTRIES } from '../utils/countries';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import { useLanguage } from '../i18n/LanguageContext';
import BackIcon from './BackIcon';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { user, session, signOut } = useAuth();
  const { t, language } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'error'>('idle');
  const [profile, setProfile] = useState<PlayerProfile>(ProfileStorage.getProfile());
  const [name, setName] = useState(profile.name);
  const [photo, setPhoto] = useState<string | null>(profile.photo);
  const [country, setCountry] = useState<string | null>(profile.country ?? null);
  const [countrySearch, setCountrySearch] = useState('');
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [username, setUsername] = useState(profile.username ?? '');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'saved'>('idle');
  const usernameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;

  useEffect(() => {
    const currentProfile = ProfileStorage.getProfile();
    setProfile(currentProfile);
    setName(currentProfile.name && currentProfile.name.trim() ? currentProfile.name : 'You');
    setPhoto(currentProfile.photo);
    setCountry(currentProfile.country ?? null);
    setUsername(currentProfile.username ?? '');
    if (currentProfile.username) setUsernameStatus('saved');
  }, []);

  // Real-time username availability check for profile screen
  useEffect(() => {
    if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);

    const savedUsername = ProfileStorage.getProfile().username ?? '';
    if (!username || username === savedUsername) {
      setUsernameStatus(username === savedUsername && username ? 'saved' : 'idle');
      return;
    }
    if (!USERNAME_REGEX.test(username)) {
      setUsernameStatus('invalid');
      return;
    }
    setUsernameStatus('checking');
    usernameDebounceRef.current = setTimeout(async () => {
      if (!supabase) { setUsernameStatus('idle'); return; }
      const { data } = await supabase.rpc('is_username_available', { p_username: username });
      setUsernameStatus(data ? 'available' : 'taken');
    }, 400);

    return () => { if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current); };
  }, [username]);

  // Focus search when picker opens
  useEffect(() => {
    if (countryPickerOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [countryPickerOpen]);

  const handlePhotoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    try {
      const base64 = await imageToBase64(file);
      setPhoto(base64);
      ProfileStorage.updatePhoto(base64);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try again.');
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    ProfileStorage.updatePhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectCountry = (code: string) => {
    setCountry(code);
    ProfileStorage.updateCountry(code);
    setCountryPickerOpen(false);
    setCountrySearch('');
  };

  const handleClearCountry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCountry(null);
    ProfileStorage.updateCountry(null);
    setCountrySearch('');
  };

  const handleSaveUsername = () => {
    if (usernameStatus !== 'available') return;
    const storedProfile = ProfileStorage.getProfile();
    const trimmed = username.trim();
    ProfileStorage.saveProfile({ ...storedProfile, name: trimmed, username: trimmed });
    setUsernameStatus('saved');
  };

  const handleBack = () => {
    const storedProfile = ProfileStorage.getProfile();
    const updatedProfile: PlayerProfile = {
      ...storedProfile,
      name: name.trim() || 'You',
      photo: photo,
      country: country,
    };
    ProfileStorage.saveProfile(updatedProfile);
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const selectedCountryName = country
    ? COUNTRIES.find(c => c.code === country)?.name
    : null;

  const [activeTab, setActiveTab] = useState<'vs-computer' | 'online' | 'achievements'>('online');

  const winRate = ProfileStorage.getWinRate();
  const dudoSuccessRate = ProfileStorage.getDudoSuccessRate();
  const calledAgainstSuccessRate = ProfileStorage.getCalledAgainstSuccessRate();

  const unlockedIds = profile.achievements ?? [];
  const unlockedCount = unlockedIds.length;

  function statsWinRate(s: PlayerStats) {
    if (s.gamesPlayed === 0) return 0;
    return Math.round((s.gamesWon / s.gamesPlayed) * 100);
  }
  function statsDudoRate(s: PlayerStats) {
    if (s.dudoCalls === 0) return 0;
    return Math.round((s.successfulDudoCalls / s.dudoCalls) * 100);
  }
  function statsCalledAgainstRate(s: PlayerStats) {
    if (s.timesCalledAgainst === 0) return 0;
    return Math.round((s.successfulCallsAgainst / s.timesCalledAgainst) * 100);
  }

  const handleExportData = () => {
    const p = ProfileStorage.getProfile();
    const exportData = {
      exportDate: new Date().toISOString(),
      name: p.name,
      country: p.country,
      vsComputerStats: p.vsComputerStats,
      onlineStats: p.onlineStats,
      achievements: p.achievements,
      rankedRating: p.rankedRating,
      rankedGamesPlayed: p.rankedGamesPlayed,
      rankedWins: p.rankedWins,
      rankedLosses: p.rankedLosses,
      consecutiveWins: p.consecutiveWins,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dudo-dice-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    setDeleteStatus('deleting');
    try {
      if (user && session) {
        const res = await fetch('/api/account', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) throw new Error('Server error');
        await signOut();
      }
      // Clear all local data
      localStorage.clear();
      navigate('/');
    } catch {
      setDeleteStatus('error');
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 sm:p-8 relative" style={{ overflowY: 'auto' }}>
      {/* Back button - fixed top left */}
      <button
        onClick={handleBack}
        className="fixed h-10 sm:h-8 text-white text-xs sm:text-sm font-semibold z-50 rounded-xl px-2 shadow-md bg-gradient-to-br from-indigo-700 to-purple-900 flex items-center"
        style={{ left: '0.75rem', top: '0.75rem' }}
      >
        <BackIcon />{t('common.back')}
      </button>

      <div className="max-w-2xl sm:max-w-4xl w-full pt-12 sm:pt-0">
        {/* Logo and title */}
        <div className="flex items-center justify-center gap-4 mb-5 pl-16 sm:pl-0">
          <img
            src="/Logo.webp"
            alt="Dudo Dice Logo"
            className="flex-shrink-0"
            style={{ width: '60px', height: '60px' }}
          />
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-4xl font-bold text-white">{t('profile.title')}</h1>
          </div>
        </div>

        {/* Profile Settings Card */}
        <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-xl shadow-2xl p-4 sm:p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white">{t('profile.settings')}</h2>
            {user ? (
              <div className="flex items-center gap-2 text-right">
                <div>
                  <p className="text-white/60 text-xs truncate max-w-[160px]">{user.email}</p>
                  <button onClick={signOut} className="text-white/40 hover:text-white/70 text-xs underline transition-colors">{t('profile.signOut')}</button>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" title={t('profile.synced')} />
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="btn-3d-accent text-white text-xs font-bold px-3 py-1.5 rounded-lg"
              >
                {t('profile.signIn')}
              </button>
            )}
          </div>

          <div className="mb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              {/* Photo Upload */}
              <div className="flex flex-col items-center">
                <label className="block text-base font-medium text-white mb-1 self-start">
                  {t('profile.photo')}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  id="photo-upload"
                />
                {/* Clickable photo circle */}
                {photo ? (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="cursor-pointer block relative group"
                    title="Click to remove photo"
                  >
                    <img
                      src={photo}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-2 border-white/30 shadow-md"
                    />
                    <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                      <span className="text-white text-xl">✕</span>
                      <span className="text-white text-xs font-semibold">Remove</span>
                    </div>
                  </button>
                ) : (
                  <label htmlFor="photo-upload" className="cursor-pointer block relative group">
                    <div className="w-32 h-32 rounded-full bg-white/15 border-2 border-dashed border-white/40 flex flex-col items-center justify-center gap-1 group-hover:bg-white/20 transition-colors">
                      <span className="text-white/60 text-3xl">📷</span>
                      <span className="text-white/50 text-xs font-medium">Upload</span>
                    </div>
                  </label>
                )}
                {/* Elo rating below photo */}
                <div className="flex items-center justify-center mt-2">
                  <span className="text-white/40 text-sm">{t('profile.ranking')}</span>
                  <span className="text-white font-bold text-base ml-1">{profile.rankedRating ?? 1500}</span>
                  {user && <span className="w-1.5 h-1.5 rounded-full bg-green-400 ml-1.5" title={t('profile.synced')} />}
                  <span className="relative group inline-flex items-center ml-1">
                    <span className="w-3.5 h-3.5 rounded-full bg-white/20 text-white/60 text-[9px] font-bold flex items-center justify-center cursor-help">i</span>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                      <span className="block text-xs text-white/90 bg-indigo-900 border border-white/20 rounded-lg p-2 shadow-lg text-left">
                        {t('profile.rankingTooltip')}
                      </span>
                    </span>
                  </span>
                  {(profile.lastRatingChange ?? 0) !== 0 && (
                    <span className={`text-sm font-semibold ml-1 ${(profile.lastRatingChange ?? 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {(profile.lastRatingChange ?? 0) > 0 ? '+' : ''}{profile.lastRatingChange}
                    </span>
                  )}
                </div>

                {/* Daily play streak */}
                <div className="flex flex-col items-center mt-3">
                  <div className={`flex items-center gap-1 ${(profile.playStreak ?? 0) === 0 ? 'opacity-35' : ''}`}>
                    <span className="text-xl">🔥</span>
                    <span className="text-white font-bold text-base">{profile.playStreak ?? 0}</span>
                    <span className="text-white/50 text-sm">{(profile.playStreak ?? 0) === 1 ? 'day' : 'days'}</span>
                  </div>
                  <span className="text-white/35 text-xs">Best streak: {profile.longestPlayStreak ?? 0}</span>
                </div>
              </div>

              {/* Name + Country inputs */}
              <div className="flex-1 flex flex-col gap-1">
                {/* Name Input */}
                <div>
                  <label className="block text-base font-medium text-white mb-1">
                    {t('profile.playerName')}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      const nextName = e.target.value;
                      setName(nextName);
                      ProfileStorage.updateName(nextName);
                    }}
                    placeholder={t('profile.playerNamePlaceholder')}
                    maxLength={20}
                    className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/40 border border-white/30 focus:border-white/60 focus:outline-none text-base"
                  />
                  <div className="h-3" />
                </div>

                {/* Username Input */}
                <div>
                  <label className="block text-base font-medium text-white mb-1">
                    {t('auth.username')}
                  </label>
                  {profile.username ? (
                    <div className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-base">
                      @{profile.username}
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
                            placeholder={t('auth.usernamePlaceholder')}
                            maxLength={20}
                            autoCapitalize="none"
                            className={`w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/40 border focus:outline-none text-base ${
                              usernameStatus === 'taken' || usernameStatus === 'invalid'
                                ? 'border-red-400 focus:border-red-400'
                                : usernameStatus === 'available'
                                ? 'border-green-400 focus:border-green-400'
                                : 'border-white/30 focus:border-white/60'
                            }`}
                          />
                        </div>
                        {usernameStatus === 'available' && (
                          <button
                            onClick={handleSaveUsername}
                            className="px-4 py-2 rounded-lg btn-3d-accent text-white font-bold text-sm flex-shrink-0"
                          >
                            {t('common.done')}
                          </button>
                        )}
                      </div>
                      <p className={`text-xs leading-3 h-3 overflow-hidden ${
                        usernameStatus === 'available' ? 'text-green-400'
                        : usernameStatus === 'taken' ? 'text-red-400'
                        : usernameStatus === 'invalid' && username.length > 0 ? 'text-yellow-400'
                        : usernameStatus === 'checking' ? 'text-white/50'
                        : 'text-transparent'
                      }`}>
                        {usernameStatus === 'available' ? t('auth.usernameAvailable')
                        : usernameStatus === 'taken' ? t('auth.errorUsernameTaken')
                        : usernameStatus === 'invalid' && username.length > 0 ? t('auth.errorUsernameInvalid')
                        : usernameStatus === 'checking' ? t('auth.usernameChecking')
                        : '.'}
                      </p>
                    </>
                  )}
                </div>

                {/* Country Picker */}
                <div>
                  <label className="block text-base font-medium text-white mb-1">
                    {t('profile.country')}
                  </label>
                  <div className="relative">
                    {/* Trigger button */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCountryPickerOpen(o => !o)}
                        className="flex-1 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 border border-white/30 hover:border-white/60 focus:outline-none text-base text-left transition-colors"
                      >
                        {country ? (
                          <>
                            <img
                              src={`https://flagcdn.com/${country.toLowerCase()}.svg`}
                              alt={selectedCountryName ?? ''}
                              className="flex-shrink-0 rounded-sm shadow-sm"
                              style={{ width: 24, height: 18 }}
                            />
                            <span className="text-white font-medium truncate">{selectedCountryName}</span>
                          </>
                        ) : (
                          <span className="text-white/50">{t('profile.countryPlaceholder')}</span>
                        )}
                        <span className="ml-auto text-white/40 text-xs">{countryPickerOpen ? '▲' : '▼'}</span>
                      </button>
                      {country && (
                        <button
                          onClick={handleClearCountry}
                          className="w-10 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white font-bold transition-colors text-sm"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* Picker dropdown */}
                    {countryPickerOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-indigo-900/95 border border-white/20 rounded-xl shadow-2xl overflow-hidden">
                        <div className="p-2 border-b border-white/10">
                          <input
                            ref={searchRef}
                            type="text"
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            placeholder={t('profile.countrySearch')}
                            className="w-full px-3 py-1.5 rounded-lg bg-white/15 text-white placeholder-white/40 border border-white/20 focus:border-white/50 focus:outline-none text-sm"
                          />
                        </div>
                        <ul className="max-h-48 overflow-y-auto scrollbar-indigo">
                          {filteredCountries.length > 0 ? filteredCountries.map(c => (
                            <li key={c.code}>
                              <button
                                onClick={() => handleSelectCountry(c.code)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-white/10 transition-colors ${country === c.code ? 'bg-white/15 text-white font-semibold' : 'text-white/80'}`}
                              >
                                <img
                                  src={`https://flagcdn.com/${c.code.toLowerCase()}.svg`}
                                  alt={c.name}
                                  className="flex-shrink-0 rounded-sm"
                                  style={{ width: 20, height: 15 }}
                                />
                                <span className="truncate">{c.name}</span>
                              </button>
                            </li>
                          )) : (
                            <li className="px-3 py-3 text-sm text-white/40 italic text-center">{t('profile.countryNone')}</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats / Achievements Card */}
        <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-xl shadow-2xl overflow-hidden mb-6">
          {/* Tab bar */}
          <div className="flex gap-2 p-3 border-b border-white/20">
            {(['online', 'vs-computer', 'achievements'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-xl font-bold text-sm transition-colors ${
                  activeTab === tab ? 'text-white btn-3d-accent' : 'btn-glass'
                }`}
              >
                {tab === 'vs-computer' ? t('profile.tabVsComputer') : tab === 'online' ? t('profile.tabOnline') : t('profile.tabAchievements')}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-6">
            {/* VS Computer tab */}
            {activeTab === 'vs-computer' && (() => {
              const s = profile.vsComputerStats;
              return (
                <>
                  <p className="text-white font-bold text-sm mb-3">{t('profile.vsComputerStats')}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="text-white/65 text-sm mb-1">{t('profile.gamesPlayed')}</div>
                    <div className="text-3xl font-bold text-white">{s.gamesPlayed}</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="text-white/65 text-sm mb-1">{t('profile.gamesWon')}</div>
                    <div className="text-3xl font-bold text-white">{s.gamesWon}</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="text-white/65 text-sm mb-1">{t('profile.winRate')}</div>
                    <div className="text-3xl font-bold text-white">{winRate}%</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="text-white/65 text-sm mb-1">{t('profile.dudoCalls')}</div>
                    <div className="text-3xl font-bold text-white">{s.dudoCalls}</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="text-white/65 text-sm mb-1">{t('profile.dudoSuccessRate')}</div>
                    <div className="text-3xl font-bold text-white">{dudoSuccessRate}%</div>
                    <div className="text-xs text-white/50 mt-1">
                      {s.successfulDudoCalls} / {s.dudoCalls} calls
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="text-white/65 text-sm mb-1">{t('profile.calledAgainstRate')}</div>
                    <div className="text-3xl font-bold text-white">{calledAgainstSuccessRate}%</div>
                    <div className="text-xs text-white/50 mt-1">
                      {s.successfulCallsAgainst} / {s.timesCalledAgainst} times
                    </div>
                  </div>
                </div>
                </>
              );
            })()}

            {/* Online tab */}
            {activeTab === 'online' && (() => {
              const s = profile.onlineStats;
              const wr = statsWinRate(s);
              const dr = statsDudoRate(s);
              const cr = statsCalledAgainstRate(s);
              return (
                <>
                  <p className="text-white font-bold text-sm mb-3">{t('profile.onlineStats')}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                      <div className="text-white/65 text-sm mb-1">{t('profile.ranking')}</div>
                      <div className="text-3xl font-bold text-white">{profile.rankedRating ?? 1500}</div>
                      {(profile.lastRatingChange ?? 0) !== 0 && (
                        <div className={`text-xs font-semibold mt-1 ${(profile.lastRatingChange ?? 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {(profile.lastRatingChange ?? 0) > 0 ? '+' : ''}{profile.lastRatingChange} last game
                        </div>
                      )}
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                      <div className="text-white/65 text-sm mb-1">{t('profile.gamesPlayed')}</div>
                      <div className="text-3xl font-bold text-white">{s.gamesPlayed}</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                      <div className="text-white/65 text-sm mb-1">{t('profile.gamesWon')}</div>
                      <div className="text-3xl font-bold text-white">{s.gamesWon}</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                      <div className="text-white/65 text-sm mb-1">{t('profile.winRate')}</div>
                      <div className="text-3xl font-bold text-white">{wr}%</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                      <div className="text-white/65 text-sm mb-1">{t('profile.dudoCalls')}</div>
                      <div className="text-3xl font-bold text-white">{s.dudoCalls}</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                      <div className="text-white/65 text-sm mb-1">{t('profile.dudoSuccessRate')}</div>
                      <div className="text-3xl font-bold text-white">{dr}%</div>
                      <div className="text-xs text-white/50 mt-1">
                        {s.successfulDudoCalls} / {s.dudoCalls} calls
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                      <div className="text-white/65 text-sm mb-1">{t('profile.calledAgainstRate')}</div>
                      <div className="text-3xl font-bold text-white">{cr}%</div>
                      <div className="text-xs text-white/50 mt-1">
                        {s.successfulCallsAgainst} / {s.timesCalledAgainst} times
                      </div>
                    </div>
                  </div>
                  <p className="text-white/40 text-xs text-center mt-4">{t('profile.onlineStatsNote')}</p>
                </>
              );
            })()}

            {/* Achievements tab */}
            {activeTab === 'achievements' && (
              <>
                <p className="text-white/60 text-sm text-center mb-4 font-medium">
                  {t('profile.achievementsUnlocked', { unlocked: unlockedCount, total: ACHIEVEMENTS.length })}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {ACHIEVEMENTS.map((a) => {
                    const unlocked = unlockedIds.includes(a.id);
                    const displayName = language === 'es' ? a.nameEs : a.name;
                    const displayDesc = language === 'es' ? a.descriptionEs : a.description;
                    return (
                      <div
                        key={a.id}
                        className={`rounded-xl p-3 flex flex-col items-center gap-1.5 text-center border ${
                          unlocked
                            ? 'bg-white/15 border-yellow-400/40'
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <span
                          className="text-3xl leading-none"
                          style={unlocked ? {} : { filter: 'grayscale(1)', opacity: 0.3 }}
                        >
                          {a.icon}
                        </span>
                        <span className={`text-xs font-bold leading-tight ${unlocked ? 'text-white' : 'text-white/30'}`}>
                          {displayName}
                        </span>
                        <span className={`text-xs leading-tight ${unlocked ? 'text-white/60' : 'text-white/20'}`}>
                          {displayDesc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Data & Privacy footer */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-2 text-xs text-white/30">
        <button onClick={handleExportData} className="hover:text-white/60 transition-colors">
          {t('profile.exportData')}
        </button>
        <span>·</span>
        <button onClick={() => setShowPrivacy(true)} className="hover:text-white/60 transition-colors">
          {t('landing.privacyPolicy')}
        </button>
        <span>·</span>
        <button onClick={() => setShowDeleteConfirm(true)} className="hover:text-red-400 transition-colors">
          {t('profile.deleteAccount')}
        </button>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showPrivacy && <PrivacyPolicyModal onClose={() => setShowPrivacy(false)} />}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => { if (deleteStatus !== 'deleting') setShowDeleteConfirm(false); }}>
          <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl w-full max-w-sm p-5 animate-modal-enter" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-2">{t('profile.deleteTitle')}</h2>
            <p className="text-sm text-white/70 mb-4">
              {t('profile.deleteConfirm')}
            </p>
            {deleteStatus === 'error' && (
              <p className="text-red-300 text-sm mb-3">{t('common.error')}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteStatus === 'deleting'}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm btn-glass"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteStatus === 'deleting'}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
              >
                {deleteStatus === 'deleting' ? t('profile.deleting') : t('profile.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
