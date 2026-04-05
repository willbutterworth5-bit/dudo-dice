import { useState } from 'react';
import { setConsent } from '../utils/cookieConsent';
import PrivacyPolicyModal from './PrivacyPolicyModal';

interface Props {
  onAccept: () => void;
}

export default function CookieConsentModal({ onAccept }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleChoice = (choice: 'essential' | 'all') => {
    setConsent(choice);
    onAccept();
  };

  const btnBase = 'flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-colors';
  const btnOutline = `${btnBase} border-white/40 text-white hover:bg-white/10`;
  const btnFilled = `${btnBase} border-white/40 bg-white/20 text-white hover:bg-white/30`;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl w-full max-w-md animate-modal-enter">
          <div className="p-5">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl flex-shrink-0">🍪</span>
              <div>
                <h2 className="text-base font-bold text-white">Cookie Preferences</h2>
                <p className="text-sm text-white/70 mt-1">
                  We use storage to keep the game working. We also use limited, cookie-free measurement,
                  and with your permission we use analytics cookies to better understand how people use
                  Dudo Dice so we can improve it. Read our{' '}
                  <button
                    onClick={() => setShowPrivacy(true)}
                    className="underline text-white/80 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </button>{' '}
                  for full details.
                </p>
              </div>
            </div>

            {showDetails && (
              <div className="mb-4 space-y-3 text-sm border-t border-white/20 pt-3">
                <div className="flex gap-3">
                  <div className="mt-0.5 w-4 h-4 rounded-full bg-green-400 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Essential cookies <span className="font-normal text-white/50">(always on)</span></p>
                    <p className="text-white/60">Required for login, game state, and profile storage. Includes limited cookie-free measurement so we can monitor basic usage without analytics cookies.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-0.5 w-4 h-4 rounded-full bg-blue-400 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Analytics cookies <span className="font-normal text-white/50">(optional)</span></p>
                    <p className="text-white/60">Allow Google Analytics cookies for better measurement of repeat visits and player journeys. No personal data is sold.</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowDetails(v => !v)}
              className="text-xs text-white/50 hover:text-white/80 transition-colors mb-4"
            >
              {showDetails ? 'Hide details ▲' : 'Show details ▼'}
            </button>

            {/* Equal-weight buttons — no visual bias toward either choice */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={() => handleChoice('essential')} className={btnOutline}>
                Essential only
              </button>
              <button onClick={() => handleChoice('all')} className={btnFilled}>
                Accept all
              </button>
            </div>

            <p className="text-xs text-white/30 text-center mt-3">
              You can change this any time via Cookie Preferences in the footer.
            </p>
          </div>
        </div>
      </div>

      {showPrivacy && <PrivacyPolicyModal onClose={() => setShowPrivacy(false)} />}
    </>
  );
}
