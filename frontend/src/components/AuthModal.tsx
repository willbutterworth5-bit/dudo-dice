import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  onClose: () => void;
}

const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;

export default function AuthModal({ onClose }: AuthModalProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const { t } = useLanguage();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');

  // Sign-in state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInError, setSignInError] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);

  // Sign-up state
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirm, setSignUpConfirm] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpDob, setSignUpDob] = useState('');
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);

  // Username availability
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Per-field errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Real-time username availability check
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!signUpUsername) {
      setUsernameStatus('idle');
      return;
    }
    if (!USERNAME_REGEX.test(signUpUsername)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');
    debounceRef.current = setTimeout(async () => {
      if (!supabase) { setUsernameStatus('idle'); return; }
      const { data } = await supabase.rpc('is_username_available', { p_username: signUpUsername });
      setUsernameStatus(data ? 'available' : 'taken');
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [signUpUsername]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError('');
    setSignInLoading(true);
    const err = await signInWithEmail(signInEmail.trim(), signInPassword);
    setSignInLoading(false);
    if (err) {
      setSignInError(err);
    } else {
      onClose();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!signUpUsername.trim()) {
      newErrors.username = t('auth.errorUsernameRequired');
    } else if (!USERNAME_REGEX.test(signUpUsername)) {
      newErrors.username = t('auth.errorUsernameInvalid');
    } else if (usernameStatus === 'taken') {
      newErrors.username = t('auth.errorUsernameTaken');
    } else if (usernameStatus === 'checking') {
      newErrors.username = t('auth.usernameChecking');
    }

    if (!signUpDob) {
      newErrors.dob = t('auth.errorDobRequired');
    } else {
      const dob = new Date(signUpDob);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
      if (age < 13) newErrors.dob = t('auth.errorDobTooYoung');
      if (age > 120) newErrors.dob = t('auth.errorDobInvalid');
    }

    if (!signUpEmail.trim() || !signUpEmail.includes('@')) {
      newErrors.email = t('auth.errorEmailInvalid');
    }

    if (signUpPassword.length < 6) {
      newErrors.password = t('auth.errorPasswordTooShort');
    }

    if (signUpConfirm !== signUpPassword) {
      newErrors.confirm = t('auth.errorPasswordMismatch');
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSignUpLoading(true);
    const err = await signUpWithEmail(signUpEmail.trim(), signUpPassword, signUpUsername.trim(), signUpDob);
    setSignUpLoading(false);
    if (err) {
      setErrors({ submit: err });
    } else {
      setSignUpSuccess(true);
    }
  };

  const baseInputClass = 'w-full px-4 py-2.5 rounded-lg bg-white/15 text-white placeholder-white/40 border focus:outline-none text-sm';
  const inputClass = (field: string) =>
    `${baseInputClass} ${errors[field] ? 'border-red-400 focus:border-red-400' : 'border-white/25 focus:border-white/60'}`;
  const labelClass = 'block text-white/80 text-xs font-semibold mb-1';
  const fieldErrorClass = 'text-red-400 text-xs mt-1';

  const usernameHint = () => {
    if (errors.username) return <p className={fieldErrorClass}>{errors.username}</p>;
    if (usernameStatus === 'checking') return <p className="text-white/50 text-xs mt-1">{t('auth.usernameChecking')}</p>;
    if (usernameStatus === 'available') return <p className="text-green-400 text-xs mt-1">{t('auth.usernameAvailable')}</p>;
    if (usernameStatus === 'taken') return <p className="text-red-400 text-xs mt-1">{t('auth.errorUsernameTaken')}</p>;
    if (usernameStatus === 'invalid' && signUpUsername.length > 0) return <p className="text-yellow-400 text-xs mt-1">{t('auth.errorUsernameInvalid')}</p>;
    return null;
  };

  const usernameInputClass = () => {
    if (errors.username || usernameStatus === 'taken') return `${baseInputClass} border-red-400 focus:border-red-400`;
    if (usernameStatus === 'available') return `${baseInputClass} border-green-400 focus:border-green-400`;
    return `${baseInputClass} border-white/25 focus:border-white/60`;
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-0 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            {tab === 'signin' ? t('auth.signIn') : t('auth.createAccount')}
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white text-2xl font-bold leading-none">×</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-5 pt-4">
          <button
            onClick={() => setTab('signin')}
            className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-colors ${tab === 'signin' ? 'btn-3d-accent text-white' : 'btn-glass'}`}
          >
            {t('auth.signIn')}
          </button>
          <button
            onClick={() => setTab('signup')}
            className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-colors ${tab === 'signup' ? 'btn-3d-accent text-white' : 'btn-glass'}`}
          >
            {t('auth.createAccount')}
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Google button */}
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-white text-gray-800 font-semibold text-sm hover:bg-gray-50 transition-colors shadow"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t('auth.continueWithGoogle')}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-white/40 text-xs">{t('common.or')}</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          {/* Sign In form */}
          {tab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-3">
              <div>
                <label className={labelClass}>{t('auth.email')}</label>
                <input type="email" required value={signInEmail} onChange={e => setSignInEmail(e.target.value)} className={`${baseInputClass} border-white/25 focus:border-white/60`} placeholder={t('auth.emailPlaceholder')} autoComplete="email" />
              </div>
              <div>
                <label className={labelClass}>{t('auth.password')}</label>
                <input type="password" required value={signInPassword} onChange={e => setSignInPassword(e.target.value)} className={`${baseInputClass} border-white/25 focus:border-white/60`} placeholder={t('auth.passwordPlaceholder')} autoComplete="current-password" />
              </div>
              {signInError && <p className="text-red-400 text-xs">{signInError}</p>}
              <button type="submit" disabled={signInLoading} className="w-full btn-3d-accent text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-60">
                {signInLoading ? t('auth.signingIn') : t('auth.signIn')}
              </button>
            </form>
          )}

          {/* Sign Up form */}
          {tab === 'signup' && (
            signUpSuccess ? (
              <div className="text-center py-4">
                <p className="text-green-400 font-semibold text-sm mb-1">{t('auth.checkEmail')}</p>
                <p className="text-white/70 text-xs">{t('auth.checkEmailDesc', { email: signUpEmail })}</p>
              </div>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-3">
                <div>
                  <label className={labelClass}>{t('auth.username')}</label>
                  <input
                    type="text"
                    required
                    value={signUpUsername}
                    onChange={e => { setSignUpUsername(e.target.value.replace(/\s/g, '')); setErrors(p => ({ ...p, username: '' })); }}
                    className={usernameInputClass()}
                    placeholder={t('auth.usernamePlaceholder')}
                    maxLength={20}
                    autoComplete="username"
                    autoCapitalize="none"
                  />
                  {usernameHint()}
                </div>
                <div>
                  <label className={labelClass}>{t('auth.dob')}</label>
                  <input type="date" required value={signUpDob} onChange={e => { setSignUpDob(e.target.value); setErrors(p => ({ ...p, dob: '' })); }} className={inputClass('dob')} max={new Date().toISOString().split('T')[0]} />
                  {errors.dob && <p className={fieldErrorClass}>{errors.dob}</p>}
                </div>
                <div>
                  <label className={labelClass}>{t('auth.email')}</label>
                  <input type="text" required value={signUpEmail} onChange={e => { setSignUpEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }} className={inputClass('email')} placeholder={t('auth.emailPlaceholder')} autoComplete="email" />
                  {errors.email && <p className={fieldErrorClass}>{errors.email}</p>}
                </div>
                <div>
                  <label className={labelClass}>{t('auth.password')}</label>
                  <input type="password" required value={signUpPassword} onChange={e => { setSignUpPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }} className={inputClass('password')} placeholder={t('auth.passwordMin')} autoComplete="new-password" />
                  {errors.password && <p className={fieldErrorClass}>{errors.password}</p>}
                </div>
                <div>
                  <label className={labelClass}>{t('auth.confirmPassword')}</label>
                  <input type="password" required value={signUpConfirm} onChange={e => { setSignUpConfirm(e.target.value); setErrors(p => ({ ...p, confirm: '' })); }} className={inputClass('confirm')} placeholder={t('auth.confirmPasswordPlaceholder')} autoComplete="new-password" />
                  {errors.confirm && <p className={fieldErrorClass}>{errors.confirm}</p>}
                </div>
                {errors.submit && <p className="text-red-400 text-xs">{errors.submit}</p>}
                <button
                  type="submit"
                  disabled={signUpLoading || usernameStatus === 'taken' || usernameStatus === 'checking'}
                  className="w-full btn-3d-accent text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-60"
                >
                  {signUpLoading ? t('auth.creatingAccount') : t('auth.createAccount')}
                </button>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  );
}
