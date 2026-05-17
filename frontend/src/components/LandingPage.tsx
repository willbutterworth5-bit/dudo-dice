import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import CookieConsentModal from './CookieConsentModal';
import { APP_VERSION } from '../version';
import { hasConsent } from '../utils/cookieConsent';
import { useLanguage } from '../i18n/LanguageContext';
import { ProfileStorage } from '../utils/profileStorage';
import { shareOrCopy } from '../utils/share';

export default function LandingPage() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const [consentGiven, setConsentGiven] = useState(hasConsent);
  const profile = ProfileStorage.getProfile();
  const profileName = profile.username ? `@${profile.username}` : (profile.name && profile.name !== 'You' ? profile.name : null);
  const [showCookiePrefs, setShowCookiePrefs] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState<'bug' | 'suggestion' | 'other'>('suggestion');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');

  const handleShare = async () => {
    const result = await shareOrCopy('https://dudodice.com', 'Dudo Dice', "Play free Liar's Dice online: https://dudodice.com");
    if (result === 'copied') {
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 2000);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackMessage.trim()) return;
    setFeedbackStatus('sending');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: feedbackMessage, category: feedbackCategory, email: feedbackEmail || undefined }),
      });
      if (!res.ok) throw new Error('Server error');
      setFeedbackStatus('sent');
      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackMessage('');
        setFeedbackEmail('');
        setFeedbackCategory('suggestion');
        setFeedbackStatus('idle');
      }, 1800);
    } catch {
      setFeedbackStatus('error');
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 sm:p-8" style={{ overflowY: 'auto' }}>
      <div className="max-w-md w-full">
        {/* Logo and title */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <picture>
            <source srcSet="/Logo.webp" type="image/webp" />
            <img src="/Logo.png" alt="Dudo Dice Logo" className="flex-shrink-0 w-16 h-16 sm:w-[88px] sm:h-[88px]" />
          </picture>
          <div className="flex flex-col">
            <h1 className="text-4xl sm:text-5xl font-bold text-white">
              Dudo Dice
            </h1>
            <p className="text-base text-white/80 mt-1">
              {t('landing.tagline')}
            </p>
          </div>
        </div>

        {/* Mode selection card */}
        <div className={`bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl p-6 transition-opacity duration-200 ${!consentGiven ? 'opacity-40 pointer-events-none select-none' : ''}`}>
          <div className="flex flex-col gap-4">

            {/* How it works strip */}
            <button
              onClick={() => navigate('/rules')}
              className="bg-black/20 rounded-xl border border-white/10 px-4 py-4 flex flex-col items-center gap-3"
            >
              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-col items-center gap-1.5 animate-fade-slide-up" style={{ animationDelay: '0s', animationFillMode: 'both' }}>
                  <span className="text-3xl" style={{ animation: 'diceRoll 2.8s ease-in-out infinite', display: 'inline-block' }}>🎲</span>
                  <span className="text-white/90 text-base font-bold">{t('landing.howItWorksRoll')}</span>
                </div>
                <span className="text-white/30 text-lg mb-4">›</span>
                <div className="flex flex-col items-center gap-1.5 animate-fade-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                  <span className="text-3xl" style={{ animation: 'bidWobble 1.8s ease-in-out infinite', display: 'inline-block' }}>💬</span>
                  <span className="text-white/90 text-base font-bold">{t('landing.howItWorksBid')}</span>
                </div>
                <span className="text-white/30 text-lg mb-4">›</span>
                <div className="flex flex-col items-center gap-1.5 animate-fade-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                  <span className="text-3xl" style={{ animation: 'challengeFlash 1.8s ease-in-out infinite', display: 'inline-block' }}>⚡</span>
                  <span className="text-white/90 text-base font-bold">{t('landing.howItWorksChallenge')}</span>
                </div>
              </div>
              <p className="text-white/45 text-xs tracking-wide">
                {t('landing.socialProof')}
              </p>
            </button>

            <div className="border-t border-white/15" />

            {/* Primary CTA */}
            <button
              onClick={() => navigate('/play')}
              className="w-full py-4 text-white font-extrabold text-lg rounded-xl transition-colors btn-3d-accent flex items-center justify-center gap-3"
            >
              🎲 {t('landing.playVsComputer')}
            </button>

            {/* Secondary CTA */}
            <button
              onClick={() => navigate('/online')}
              className="w-full py-3 text-white font-bold text-base rounded-xl btn-glass flex items-center justify-center gap-3"
            >
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
              {t('landing.playOnline')}
            </button>

            <div className="border-t border-white/15" />

            {/* Tertiary rows */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/profile')}
                className="flex-1 py-2.5 text-white hover:text-white/80 text-xs font-semibold transition-colors text-center rounded-xl border border-white/20 hover:border-white/40"
              >
                {profileName ? `👤 ${profileName}` : t('landing.profile')}
              </button>
              <button
                onClick={() => navigate('/rules')}
                className="flex-1 py-2.5 text-white hover:text-white/80 text-xs font-semibold transition-colors text-center rounded-xl border border-white/20 hover:border-white/40"
              >
                {t('landing.rules')}
              </button>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/tutorial')}
                className="flex-1 py-2.5 text-white hover:text-white/80 text-xs font-semibold transition-colors text-center rounded-xl border border-white/20 hover:border-white/40"
              >
                🎓 Tutorial
              </button>
              <button
                onClick={() => navigate('/friends')}
                className="flex-1 py-2.5 text-white hover:text-white/80 text-xs font-semibold transition-colors text-center rounded-xl border border-white/20 hover:border-white/40"
              >
                {t('landing.friends')}
              </button>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-y-1 mt-5 text-xs text-white/40 text-center">
          <div className="flex items-center justify-center gap-x-3">
            <span className="whitespace-nowrap">{APP_VERSION}</span>
            <span>·</span>
            <button onClick={() => setShowPrivacy(true)} className="hover:text-white/70 transition-colors whitespace-nowrap">
              {t('landing.privacyPolicy')}
            </button>
            <span>·</span>
            <button onClick={() => setShowCookiePrefs(true)} className="hover:text-white/70 transition-colors whitespace-nowrap">
              {t('landing.cookiePreferences')}
            </button>
          </div>
          <div className="flex items-center justify-center gap-x-3">
            <button onClick={() => setShowFeedback(true)} className="hover:text-white/70 transition-colors whitespace-nowrap">
              {t('landing.shareFeedback')}
            </button>
            <span>·</span>
            <button onClick={handleShare} className="hover:text-white/70 transition-colors whitespace-nowrap">
              {shareState === 'copied' ? t('landing.shareCopied') : t('landing.share')}
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowLanguageModal(true)}
        className="fixed top-3 right-3 z-50 py-2 px-3 text-sm font-semibold rounded-xl btn-glass text-white"
      >
        {language === 'zh-HK' ? '語言' : language === 'en' ? 'Language' : 'Idioma'}
      </button>

      {showLanguageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLanguageModal(false)}>
          <div
            className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl p-5 w-64 mx-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-white font-bold text-lg text-center mb-4">{language === 'zh-HK' ? '語言' : language === 'en' ? 'Language' : 'Idioma'}</h2>
            <div className="flex flex-col gap-2">
              {([['en', 'gb', 'English'], ['es', 'es', 'Español'], ['zh-HK', 'hk', '廣東話']] as const).map(([code, flagCode, label]) => (
                <button
                  key={code}
                  onClick={() => { setLanguage(code); setShowLanguageModal(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-left transition-all text-white ${
                    language === code ? 'btn-3d-accent' : 'btn-glass'
                  }`}
                >
                  <img
                    src={`https://flagcdn.com/32x24/${flagCode}.png`}
                    srcSet={`https://flagcdn.com/64x48/${flagCode}.png 2x`}
                    width="32"
                    height="24"
                    alt={label}
                    className="rounded-sm flex-shrink-0"
                  />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowLanguageModal(false)}
              className="mt-4 w-full py-2 rounded-xl btn-glass text-white text-sm font-semibold"
            >
              {language === 'zh-HK' ? '關閉' : language === 'en' ? 'Close' : 'Cerrar'}
            </button>
          </div>
        </div>
      )}

      {(!consentGiven || showCookiePrefs) && (
        <CookieConsentModal onAccept={() => { setConsentGiven(true); setShowCookiePrefs(false); }} />
      )}

      {showPrivacy && <PrivacyPolicyModal onClose={() => setShowPrivacy(false)} />}

      {showFeedback && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => { if (feedbackStatus !== 'sending') setShowFeedback(false); }}
        >
          <div
            className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl w-full max-w-sm p-5 animate-modal-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">{t('landing.feedbackTitle')}</h2>
              <button
                onClick={() => { if (feedbackStatus !== 'sending') setShowFeedback(false); }}
                className="text-white/60 hover:text-white text-xl leading-none px-1"
              >
                ✕
              </button>
            </div>

            {feedbackStatus === 'sent' ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">✓</div>
                <p className="text-white font-semibold">{t('landing.feedbackThanks')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">{t('landing.feedbackType')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['bug', 'suggestion', 'other'] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setFeedbackCategory(cat)}
                        className={`py-1.5 rounded-xl font-bold text-sm ${feedbackCategory === cat ? 'text-white btn-3d-accent' : 'btn-glass'}`}
                      >
                        {cat === 'bug' ? t('landing.feedbackBug') : cat === 'suggestion' ? t('landing.feedbackIdea') : t('landing.feedbackOther')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">{t('landing.feedbackMessage')}</label>
                  <textarea
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder={t('landing.feedbackMessagePlaceholder')}
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">{t('landing.feedbackEmail')} <span className="font-normal text-white/50">(optional)</span></label>
                  <input
                    type="email"
                    value={feedbackEmail}
                    onChange={(e) => setFeedbackEmail(e.target.value)}
                    placeholder={t('landing.feedbackEmailPlaceholder')}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>

                {feedbackStatus === 'error' && (
                  <p className="text-red-300 text-sm text-center">{t('landing.feedbackErrorMsg')}</p>
                )}

                <button
                  onClick={handleFeedbackSubmit}
                  disabled={!feedbackMessage.trim() || feedbackStatus === 'sending'}
                  className="w-full py-2.5 text-white font-extrabold rounded-xl btn-3d-accent disabled:opacity-50"
                >
                  {feedbackStatus === 'sending' ? t('landing.feedbackSubmitting') : t('landing.feedbackSubmit')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
