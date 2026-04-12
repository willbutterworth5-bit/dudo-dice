import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ProfileStorage } from '../utils/profileStorage';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';

const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;

interface UsernamePromptModalProps {
  onDone: () => void;
}

export default function UsernamePromptModal({ onDone }: UsernamePromptModalProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!username) { setStatus('idle'); return; }
    if (!USERNAME_REGEX.test(username)) { setStatus('invalid'); return; }

    setStatus('checking');
    debounceRef.current = setTimeout(async () => {
      if (!supabase) { setStatus('idle'); return; }
      const { data } = await supabase.rpc('is_username_available', { p_username: username });
      setStatus(data ? 'available' : 'taken');
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [username]);

  const handleSave = async () => {
    if (status !== 'available') return;
    setSaving(true);
    setError('');
    try {
      const trimmed = username.trim();
      if (supabase && user) {
        const { error: dbErr } = await supabase.from('profiles').upsert({
          id: user.id,
          name: trimmed,
          username: trimmed,
          updated_at: new Date().toISOString(),
        });
        if (dbErr) throw dbErr;
      }
      const profile = ProfileStorage.getProfile();
      ProfileStorage.saveProfile({ ...profile, name: trimmed, username: trimmed });
      onDone();
    } catch {
      setError(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-xl font-bold text-white mb-1">{t('auth.username')}</h2>
        <p className="text-white/60 text-sm mb-5">
          Choose a unique username — this is how other players will find you.
        </p>

        <div className="mb-1">
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
            placeholder={t('auth.usernamePlaceholder')}
            maxLength={20}
            autoFocus
            autoCapitalize="none"
            className={`w-full px-4 py-3 rounded-lg bg-white/15 text-white placeholder-white/40 border focus:outline-none text-base ${
              status === 'taken' || status === 'invalid'
                ? 'border-red-400 focus:border-red-400'
                : status === 'available'
                ? 'border-green-400 focus:border-green-400'
                : 'border-white/25 focus:border-white/60'
            }`}
          />
        </div>
        <p className={`text-xs mb-4 min-h-[1rem] ${
          status === 'available' ? 'text-green-400'
          : status === 'taken' ? 'text-red-400'
          : status === 'invalid' && username.length > 0 ? 'text-yellow-400'
          : status === 'checking' ? 'text-white/50'
          : 'text-transparent'
        }`}>
          {status === 'available' ? t('auth.usernameAvailable')
          : status === 'taken' ? t('auth.errorUsernameTaken')
          : status === 'invalid' && username.length > 0 ? t('auth.errorUsernameInvalid')
          : status === 'checking' ? t('auth.usernameChecking')
          : '.'}
        </p>

        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

        <button
          onClick={handleSave}
          disabled={status !== 'available' || saving}
          className="w-full btn-3d-accent text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50"
        >
          {saving ? t('auth.creatingAccount') : t('common.done')}
        </button>

      </div>
    </div>
  );
}
