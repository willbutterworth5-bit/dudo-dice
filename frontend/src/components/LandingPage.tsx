import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import CookieConsentModal from './CookieConsentModal';
import { APP_VERSION } from '../version';
import { hasConsent } from '../utils/cookieConsent';

export default function LandingPage() {
  const navigate = useNavigate();
  const [consentGiven, setConsentGiven] = useState(hasConsent);
  const [showCookiePrefs, setShowCookiePrefs] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState<'bug' | 'suggestion' | 'other'>('suggestion');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

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
              The Classic Perudo Game
            </p>
          </div>
        </div>

        {/* Mode selection card */}
        <div className={`bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl p-6 transition-opacity duration-200 ${!consentGiven ? 'opacity-40 pointer-events-none select-none' : ''}`}>
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/profile')}
                className="flex-1 py-2.5 text-white font-bold rounded-xl btn-glass flex items-center justify-center gap-2"
              >
                <span>👤</span> Profile
              </button>
              <button
                onClick={() => navigate('/rules')}
                className="flex-1 py-2.5 text-white font-bold rounded-xl btn-glass flex items-center justify-center gap-2"
              >
                <span>📖</span> Rules
              </button>
            </div>

            <h2 className="text-xl font-bold text-white text-center">
              Choose Game Mode
            </h2>

            <button
              onClick={() => navigate('/play')}
              className="w-full py-4 text-white font-extrabold text-lg rounded-xl transition-colors btn-3d-accent flex items-center justify-center gap-3"
            >
              <span className="text-2xl">🎲</span>
              Play vs Computer
            </button>

            <button
              onClick={() => navigate('/online')}
              className="w-full py-4 text-white font-extrabold text-lg rounded-xl transition-colors btn-3d-accent flex items-center justify-center gap-3"
            >
              <span className="text-2xl">☁️</span>
              Play Online
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-3 mt-5 text-xs text-white/40">
          <span>{APP_VERSION}</span>
          <span>·</span>
          <button onClick={() => setShowPrivacy(true)} className="hover:text-white/70 transition-colors">
            Privacy Policy
          </button>
          <span>·</span>
          <button onClick={() => setShowCookiePrefs(true)} className="hover:text-white/70 transition-colors">
            Cookie Preferences
          </button>
          <span>·</span>
          <button onClick={() => setShowFeedback(true)} className="hover:text-white/70 transition-colors">
            Share feedback
          </button>
        </div>
      </div>

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
              <h2 className="text-lg font-bold text-white">Share Feedback</h2>
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
                <p className="text-white font-semibold">Thanks for your feedback!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['bug', 'suggestion', 'other'] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setFeedbackCategory(cat)}
                        className={`py-1.5 rounded-xl font-bold text-sm ${feedbackCategory === cat ? 'text-white btn-3d-accent' : 'btn-glass'}`}
                      >
                        {cat === 'bug' ? 'Bug' : cat === 'suggestion' ? 'Idea' : 'Other'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Message</label>
                  <textarea
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="What's on your mind?"
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">Email <span className="font-normal text-white/50">(optional)</span></label>
                  <input
                    type="email"
                    value={feedbackEmail}
                    onChange={(e) => setFeedbackEmail(e.target.value)}
                    placeholder="So we can follow up"
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>

                {feedbackStatus === 'error' && (
                  <p className="text-red-300 text-sm text-center">Something went wrong. Please try again.</p>
                )}

                <button
                  onClick={handleFeedbackSubmit}
                  disabled={!feedbackMessage.trim() || feedbackStatus === 'sending'}
                  className="w-full py-2.5 text-white font-extrabold rounded-xl btn-3d-accent disabled:opacity-50"
                >
                  {feedbackStatus === 'sending' ? 'Sending...' : 'Submit Feedback'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
