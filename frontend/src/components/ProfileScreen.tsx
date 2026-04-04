import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfileStorage, imageToBase64, PlayerProfile, PlayerStats } from '../utils/profileStorage';
import { ACHIEVEMENTS } from '../utils/achievements';
import { COUNTRIES } from '../utils/countries';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PlayerProfile>(ProfileStorage.getProfile());
  const [name, setName] = useState(profile.name);
  const [photo, setPhoto] = useState<string | null>(profile.photo);
  const [country, setCountry] = useState<string | null>(profile.country ?? null);
  const [countrySearch, setCountrySearch] = useState('');
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const currentProfile = ProfileStorage.getProfile();
    setProfile(currentProfile);
    setName(currentProfile.name && currentProfile.name.trim() ? currentProfile.name : 'You');
    setPhoto(currentProfile.photo);
    setCountry(currentProfile.country ?? null);
  }, []);

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
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try again.');
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectCountry = (code: string) => {
    setCountry(code);
    setCountryPickerOpen(false);
    setCountrySearch('');
  };

  const handleClearCountry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCountry(null);
    setCountrySearch('');
  };

  const handleBack = () => {
    const updatedProfile: PlayerProfile = {
      ...profile,
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

  const [activeTab, setActiveTab] = useState<'vs-computer' | 'online' | 'achievements'>('vs-computer');

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
      {/* Back button - fixed top left */}
      <button
        onClick={handleBack}
        className="fixed text-sm font-bold z-50 text-white rounded-xl px-2 py-1 shadow-md bg-gradient-to-br from-indigo-700 to-purple-900 transition-colors"
        style={{ left: '0.75rem', top: '0.75rem' }}
      >
        ← Back
      </button>

      <div className="max-w-2xl w-full">
        {/* Logo and title */}
        <div className="flex items-center justify-center gap-4 mb-5">
          <img
            src="/Logo.png"
            alt="Dudo Dice Logo"
            className="flex-shrink-0"
            style={{ width: '72px', height: '72px' }}
          />
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-4xl font-bold text-white">Player Profile</h1>
          </div>
        </div>

        {/* Profile Settings Card */}
        <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-xl shadow-2xl p-4 sm:p-8 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-6">Profile Settings</h2>

          <div className="mb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              {/* Photo Upload */}
              <div className="flex flex-col items-center">
                <label className="block text-base font-medium text-white mb-2 self-start">
                  Profile Photo
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
                <label htmlFor="photo-upload" className="cursor-pointer block relative group">
                  {photo ? (
                    <>
                      <img
                        src={photo}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover border-2 border-white/30 shadow-md"
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-2xl">📷</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); handleRemovePhoto(); }}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-white/15 border-2 border-dashed border-white/40 flex flex-col items-center justify-center gap-1 group-hover:bg-white/20 transition-colors">
                      <span className="text-white/60 text-3xl">📷</span>
                      <span className="text-white/50 text-xs font-medium">Upload</span>
                    </div>
                  )}
                </label>
                {/* Elo rating below photo */}
                <div className="flex items-center justify-center mt-2">
                  <span className="text-white font-bold text-base">{profile.rankedRating ?? 1500}</span>
                  <span className="text-white/40 text-sm ml-1">Elo</span>
                  <span className="relative group inline-flex items-center ml-1">
                    <span className="w-3.5 h-3.5 rounded-full bg-white/20 text-white/60 text-[9px] font-bold flex items-center justify-center cursor-help">i</span>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-44 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                      <span className="block text-xs text-white/90 bg-indigo-900 border border-white/20 rounded-lg p-2 shadow-lg text-left">
                        Your Elo rating from ranked online matches. Starts at 1500.
                      </span>
                    </span>
                  </span>
                  {(profile.lastRatingChange ?? 0) !== 0 && (
                    <span className={`text-sm font-semibold ml-1 ${(profile.lastRatingChange ?? 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {(profile.lastRatingChange ?? 0) > 0 ? '+' : ''}{profile.lastRatingChange}
                    </span>
                  )}
                </div>
              </div>

              {/* Name + Country inputs */}
              <div className="flex-1 flex flex-col gap-3">
                {/* Name Input */}
                <div>
                  <label className="block text-base font-medium text-white mb-2">
                    Player Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    maxLength={20}
                    className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/40 border border-white/30 focus:border-white/60 focus:outline-none text-lg"
                  />
                </div>

                {/* Country Picker */}
                <div>
                  <label className="block text-base font-medium text-white mb-2">
                    Country
                  </label>
                  <div className="relative">
                    {/* Trigger button */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCountryPickerOpen(o => !o)}
                        className="flex-1 flex items-center gap-2 px-4 py-3 rounded-lg bg-white/20 border border-white/30 hover:border-white/60 focus:outline-none text-lg text-left transition-colors"
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
                          <span className="text-white/50">🌍 Select country</span>
                        )}
                        <span className="ml-auto text-white/40 text-xs">{countryPickerOpen ? '▲' : '▼'}</span>
                      </button>
                      {country && (
                        <button
                          onClick={handleClearCountry}
                          className="w-10 h-12 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white font-bold transition-colors text-sm"
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
                            placeholder="Search countries…"
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
                            <li className="px-3 py-3 text-sm text-white/40 italic text-center">No countries found</li>
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
            {(['vs-computer', 'online', 'achievements'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-xl font-bold text-sm transition-colors ${
                  activeTab === tab ? 'text-white btn-3d-accent' : 'btn-glass'
                }`}
              >
                {tab === 'vs-computer' ? 'VS Computer' : tab === 'online' ? 'Online' : 'Achievements'}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-6">
            {/* VS Computer tab */}
            {activeTab === 'vs-computer' && (() => {
              const s = profile.vsComputerStats;
              return (
                <>
                  <p className="text-white font-bold text-sm mb-3">VS Computer Statistics</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="text-white/65 text-sm mb-1">Games Played</div>
                    <div className="text-3xl font-bold text-white">{s.gamesPlayed}</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="text-white/65 text-sm mb-1">Games Won</div>
                    <div className="text-3xl font-bold text-white">{s.gamesWon}</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="text-white/65 text-sm mb-1">Win Rate</div>
                    <div className="text-3xl font-bold text-white">{winRate}%</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="text-white/65 text-sm mb-1">Dudo Calls</div>
                    <div className="text-3xl font-bold text-white">{s.dudoCalls}</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="text-white/65 text-sm mb-1">Dudo Success Rate</div>
                    <div className="text-3xl font-bold text-white">{dudoSuccessRate}%</div>
                    <div className="text-xs text-white/50 mt-1">
                      {s.successfulDudoCalls} / {s.dudoCalls} calls
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="text-white/65 text-sm mb-1">Called Against Rate</div>
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
                  <p className="text-white font-bold text-sm mb-3">Online Statistics</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                      <div className="text-white/65 text-sm mb-1">Games Played</div>
                      <div className="text-3xl font-bold text-white">{s.gamesPlayed}</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                      <div className="text-white/65 text-sm mb-1">Games Won</div>
                      <div className="text-3xl font-bold text-white">{s.gamesWon}</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                      <div className="text-white/65 text-sm mb-1">Win Rate</div>
                      <div className="text-3xl font-bold text-white">{wr}%</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                      <div className="text-white/65 text-sm mb-1">Dudo Calls</div>
                      <div className="text-3xl font-bold text-white">{s.dudoCalls}</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                      <div className="text-white/65 text-sm mb-1">Dudo Success Rate</div>
                      <div className="text-3xl font-bold text-white">{dr}%</div>
                      <div className="text-xs text-white/50 mt-1">
                        {s.successfulDudoCalls} / {s.dudoCalls} calls
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                      <div className="text-white/65 text-sm mb-1">Called Against Rate</div>
                      <div className="text-3xl font-bold text-white">{cr}%</div>
                      <div className="text-xs text-white/50 mt-1">
                        {s.successfulCallsAgainst} / {s.timesCalledAgainst} times
                      </div>
                    </div>
                  </div>
                  <p className="text-white/40 text-xs text-center mt-4">Online stats are tracked during multiplayer games</p>
                </>
              );
            })()}

            {/* Achievements tab */}
            {activeTab === 'achievements' && (
              <>
                <p className="text-white/60 text-sm text-center mb-4 font-medium">
                  {unlockedCount} / {ACHIEVEMENTS.length} Unlocked
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {ACHIEVEMENTS.map((a) => {
                    const unlocked = unlockedIds.includes(a.id);
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
                          {a.name}
                        </span>
                        <span className={`text-xs leading-tight ${unlocked ? 'text-white/60' : 'text-white/20'}`}>
                          {a.description}
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
    </div>
  );
}
