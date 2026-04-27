import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import AuthModal from './AuthModal';
import BackIcon from './BackIcon';
import {
  getFriends,
  sendFriendRequest,
  respondToRequest,
  removeFriend,
  findPlayerByUsername,
  type FriendEntry,
  type PlayerSearchResult,
} from '../utils/friends';
import { countryCodeToFlag } from '../utils/countries';

function countryFlag(code: string | null): string {
  if (!code) return '';
  return countryCodeToFlag(code);
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initial = (name || '?')[0].toUpperCase();
  const sz = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base';
  return (
    <div className={`${sz} rounded-full bg-white/20 flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {initial}
    </div>
  );
}

export default function FriendsScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<PlayerSearchResult | null | 'not_found'>(null);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'searching' | 'done'>('idle');
  const [addStatuses, setAddStatuses] = useState<Record<string, 'sending' | 'sent' | 'error'>>({});

  useEffect(() => {
    document.title = 'Friends — Dudo Dice';
    return () => { document.title = "Dudo Dice - Play Liar's Dice Online Free"; };
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getFriends(user.id).then(f => { setFriends(f); setLoading(false); });
  }, [user]);

  const reload = () => {
    if (!user) return;
    getFriends(user.id).then(setFriends);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchStatus('searching');
    setSearchResult(null);
    const result = await findPlayerByUsername(searchQuery.trim());
    setSearchResult(result ?? 'not_found');
    setSearchStatus('done');
  };

  const handleAdd = async (addresseeId: string) => {
    if (!user) return;
    setAddStatuses(s => ({ ...s, [addresseeId]: 'sending' }));
    const res = await sendFriendRequest(user.id, addresseeId);
    if (res === 'ok' || res === 'already_sent') {
      setAddStatuses(s => ({ ...s, [addresseeId]: 'sent' }));
      reload();
    } else {
      setAddStatuses(s => ({ ...s, [addresseeId]: 'error' }));
    }
  };

  const handleRespond = async (friendshipId: number, accept: boolean) => {
    await respondToRequest(friendshipId, accept);
    reload();
  };

  const handleRemove = async (friendshipId: number) => {
    await removeFriend(friendshipId);
    reload();
  };

  const incoming = friends.filter(f => f.status === 'pending' && f.direction === 'received');
  const accepted = friends.filter(f => f.status === 'accepted');
  const outgoing = friends.filter(f => f.status === 'pending' && f.direction === 'sent');

  const existingFriendIds = new Set(friends.map(f => f.userId));

  return (
    <div className="min-h-dvh flex flex-col items-center p-4 sm:p-8 pt-16 sm:pt-20 relative" style={{ overflowY: 'auto' }}>
      <button
        onClick={() => navigate(-1)}
        className="fixed h-10 sm:h-8 text-white text-xs sm:text-sm font-semibold z-50 rounded-xl px-2 shadow-md bg-gradient-to-br from-indigo-700 to-purple-900 flex items-center"
        style={{ left: '0.75rem', top: '0.75rem' }}
      >
        <BackIcon />{t('common.back')}
      </button>

      <div className="max-w-lg w-full">
        <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl p-5 sm:p-6">
          <h1 className="text-2xl font-bold text-white mb-5">{t('friends.title')}</h1>

          {!user ? (
            <div className="text-center py-8">
              <p className="text-white/70 mb-4">{t('friends.signInPrompt')}</p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="py-2 px-5 rounded-xl btn-glass text-white font-semibold"
              >
                {t('profile.signIn')}
              </button>
            </div>
          ) : (
            <div className="space-y-6">

              {/* Search */}
              <div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setSearchResult(null); setSearchStatus('idle'); }}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder={t('friends.searchPlaceholder')}
                    className="flex-1 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searchStatus === 'searching'}
                    className="px-4 py-2 rounded-xl btn-glass text-white font-semibold text-sm disabled:opacity-50"
                  >
                    {t('friends.searchButton')}
                  </button>
                </div>

                {searchStatus === 'done' && searchResult === 'not_found' && (
                  <p className="text-white/60 text-sm mt-2">{t('friends.noPlayerFound')}</p>
                )}

                {searchStatus === 'done' && searchResult && searchResult !== 'not_found' && (
                  <div className="mt-3 flex items-center gap-3 bg-white/10 rounded-xl p-3">
                    <Avatar name={searchResult.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{searchResult.name}</p>
                      <p className="text-white/60 text-xs">@{searchResult.username} {searchResult.country ? countryFlag(searchResult.country) : ''}</p>
                    </div>
                    {searchResult.userId === user.id ? null : existingFriendIds.has(searchResult.userId) ? (
                      <span className="text-xs text-white/60 px-3 py-1">{t('friends.alreadyFriends')}</span>
                    ) : (
                      <button
                        onClick={() => handleAdd(searchResult.userId)}
                        disabled={!!addStatuses[searchResult.userId]}
                        className="text-xs px-3 py-1.5 rounded-lg btn-glass text-white font-semibold disabled:opacity-60"
                      >
                        {addStatuses[searchResult.userId] === 'sent' ? t('friends.requestSent')
                          : addStatuses[searchResult.userId] === 'sending' ? '…'
                          : t('friends.addFriend')}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Incoming requests */}
              {incoming.length > 0 && (
                <div>
                  <h2 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">{t('friends.incomingRequests')}</h2>
                  <div className="space-y-2">
                    {incoming.map(f => (
                      <div key={f.friendshipId} className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                        <Avatar name={f.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{f.name}</p>
                          {f.username && <p className="text-white/60 text-xs">@{f.username} {f.country ? countryFlag(f.country) : ''}</p>}
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleRespond(f.friendshipId, true)}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-green-500/30 hover:bg-green-500/50 text-white font-semibold transition-colors"
                          >
                            {t('friends.accept')}
                          </button>
                          <button
                            onClick={() => handleRespond(f.friendshipId, false)}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 font-semibold transition-colors"
                          >
                            {t('friends.decline')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Friends list */}
              <div>
                <h2 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">{t('friends.friendsList')}</h2>
                {loading ? (
                  <p className="text-white/50 text-sm py-2">{t('common.loading')}</p>
                ) : accepted.length === 0 ? (
                  <p className="text-white/50 text-sm py-2">{t('friends.noFriends')}</p>
                ) : (
                  <div className="space-y-2">
                    {accepted.map(f => (
                      <div key={f.friendshipId} className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                        <Avatar name={f.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{f.name} {f.country ? countryFlag(f.country) : ''}</p>
                          <p className="text-white/60 text-xs">
                            {f.username ? `@${f.username}` : ''}
                            {f.rating != null ? (f.username ? ` · ${f.rating}` : `${f.rating}`) : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemove(f.friendshipId)}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-red-500/30 text-white/60 hover:text-white font-semibold transition-colors"
                        >
                          {t('friends.remove')}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outgoing pending */}
              {outgoing.length > 0 && (
                <div>
                  <h2 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">{t('friends.pendingOutgoing')}</h2>
                  <div className="space-y-2">
                    {outgoing.map(f => (
                      <div key={f.friendshipId} className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                        <Avatar name={f.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{f.name}</p>
                          {f.username && <p className="text-white/60 text-xs">@{f.username}</p>}
                        </div>
                        <span className="text-xs text-white/50 px-2">{t('friends.requestSent')}</span>
                        <button
                          onClick={() => handleRemove(f.friendshipId)}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 font-semibold transition-colors"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}
