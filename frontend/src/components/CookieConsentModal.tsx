import { useState } from 'react';
import { setConsent } from '../utils/cookieConsent';

interface Props {
  onAccept: () => void;
}

export default function CookieConsentModal({ onAccept }: Props) {
  const [showDetails, setShowDetails] = useState(false);

  const handleChoice = (choice: 'essential' | 'all') => {
    setConsent(choice);
    onAccept();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl w-full max-w-md animate-modal-enter">
        <div className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl flex-shrink-0">🍪</span>
            <div>
              <h2 className="text-base font-bold text-white">Cookie Preferences</h2>
              <p className="text-sm text-white/70 mt-1">
                We use cookies to keep the game working and, with your permission, to understand how
                people use Dudo Dice so we can improve it.
              </p>
            </div>
          </div>

          {showDetails && (
            <div className="mb-4 space-y-3 text-sm border-t border-white/20 pt-3">
              <div className="flex gap-3">
                <div className="mt-0.5 w-4 h-4 rounded-full bg-green-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white">Essential cookies</p>
                  <p className="text-white/60">Always on. Required for login, game state, and profile storage. Cannot be disabled.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-0.5 w-4 h-4 rounded-full bg-blue-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white">Analytics cookies</p>
                  <p className="text-white/60">Optional. Help us understand which features are used so we can improve the game. No personal data is sold.</p>
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

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => handleChoice('essential')}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm btn-glass"
            >
              Essential only
            </button>
            <button
              onClick={() => handleChoice('all')}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white btn-3d-accent"
            >
              Accept all
            </button>
          </div>

          <p className="text-xs text-white/30 text-center mt-3">
            You can change this any time via Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
