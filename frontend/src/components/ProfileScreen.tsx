import { useState, useEffect, useRef } from 'react';
import { ProfileStorage, imageToBase64, PlayerProfile } from '../utils/profileStorage';
import { COUNTRIES } from '../utils/countries';

interface ProfileScreenProps {
  onBack: () => void;
}

export default function ProfileScreen({ onBack }: ProfileScreenProps) {
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
    onBack();
  };

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const selectedCountryName = country
    ? COUNTRIES.find(c => c.code === country)?.name
    : null;

  const winRate = ProfileStorage.getWinRate();
  const dudoSuccessRate = ProfileStorage.getDudoSuccessRate();
  const calledAgainstSuccessRate = ProfileStorage.getCalledAgainstSuccessRate();

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
            <h1 className="text-4xl font-bold text-white">Player Profile</h1>
          </div>
        </div>

        {/* Profile Settings Card */}
        <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-xl shadow-2xl p-8 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-6">Profile Settings</h2>

          <div className="mb-6">
            <div className="flex flex-row items-start gap-6">
              {/* Photo Upload */}
              <div className="flex flex-col">
                <label className="block text-base font-medium text-white mb-2">
                  Profile Photo:
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {photo ? (
                      <>
                        <img
                          src={photo}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover border-2 border-border-light shadow-sm"
                        />
                        <button
                          onClick={handleRemovePhoto}
                          className="absolute -top-2 -right-2 bg-accent-danger hover:bg-accent-danger-hover text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-sm"
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center">
                        <span className="text-white/70 text-3xl">👤</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="cursor-pointer inline-block px-4 py-2 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-colors text-sm btn-3d-accent"
                    >
                      {photo ? 'Change' : 'Upload'}
                    </label>
                    <p className="text-xs text-white/65 mt-1">Max 2MB</p>
                  </div>
                </div>
              </div>

              {/* Name + Country inputs */}
              <div className="flex-1 flex flex-col gap-3">
                {/* Name Input */}
                <div>
                  <label className="block text-base font-medium text-white mb-2">
                    Player Name:
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
                    Country:
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

        {/* Statistics Card */}
        <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-xl shadow-2xl p-8 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-6">Statistics</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <div className="text-white/65 text-sm mb-1">Games Played</div>
              <div className="text-3xl font-bold text-white">{profile.stats.gamesPlayed}</div>
            </div>

            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <div className="text-white/65 text-sm mb-1">Games Won</div>
              <div className="text-3xl font-bold text-white">{profile.stats.gamesWon}</div>
            </div>

            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <div className="text-white/65 text-sm mb-1">Win Rate</div>
              <div className="text-3xl font-bold text-white">{winRate}%</div>
            </div>

            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <div className="text-white/65 text-sm mb-1">Dudo Calls</div>
              <div className="text-3xl font-bold text-white">{profile.stats.dudoCalls}</div>
            </div>

            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <div className="text-white/65 text-sm mb-1">Dudo Success Rate</div>
              <div className="text-3xl font-bold text-white">{dudoSuccessRate}%</div>
              <div className="text-xs text-white/50 mt-1">
                {profile.stats.successfulDudoCalls} / {profile.stats.dudoCalls} calls
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <div className="text-white/65 text-sm mb-1">Called Against Rate</div>
              <div className="text-3xl font-bold text-white">{calledAgainstSuccessRate}%</div>
              <div className="text-xs text-white/50 mt-1">
                {profile.stats.successfulCallsAgainst} / {profile.stats.timesCalledAgainst} times
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
