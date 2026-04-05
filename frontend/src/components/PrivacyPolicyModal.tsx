interface Props {
  onClose: () => void;
}

export default function PrivacyPolicyModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/20 flex-shrink-0">
          <h2 className="text-lg font-bold text-white">Privacy Policy</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-xl leading-none px-1"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto scrollbar-indigo px-5 py-4 space-y-4 text-sm text-white/80 leading-relaxed">
          <p className="text-white/50 text-xs">Last updated: April 2026</p>

          <section>
            <h3 className="font-bold text-white mb-1">Who we are</h3>
            <p>
              Dudo Dice is an online Perudo (Liar's Dice) game. This policy explains what personal data we
              collect, why we collect it, and your rights under the UK GDPR and EU GDPR.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-white mb-1">What data we collect and why</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><span className="text-white font-medium">Email address</span> — to identify your account and send password-reset emails. Legal basis: contract.</li>
              <li><span className="text-white font-medium">Display name and country</span> — to personalise your profile. Legal basis: contract.</li>
              <li><span className="text-white font-medium">Date of birth</span> — to verify you are 13 or older (required to use the service). Not shown publicly. Legal basis: legal obligation / legitimate interest.</li>
              <li><span className="text-white font-medium">Game statistics and achievements</span> — to track your progress and display your profile. Legal basis: contract.</li>
              <li><span className="text-white font-medium">Elo rating</span> — to match you with similarly-skilled opponents in ranked play. Legal basis: contract.</li>
              <li><span className="text-white font-medium">Profile photo</span> — stored locally in your browser and optionally synced to your account to display on your profile. Legal basis: contract. You can remove it at any time from the Profile screen.</li>
              <li><span className="text-white font-medium">IP address</span> — processed transiently by our server when you connect to online games. Not stored persistently. Legal basis: legitimate interest (preventing abuse).</li>
              <li><span className="text-white font-medium">Feedback messages</span> — to respond to bug reports and suggestions. Legal basis: legitimate interest. Providing your email is optional.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-white mb-1">Guest play</h3>
            <p>
              If you play without an account, game data is stored only in your browser's localStorage. We do
              not receive or process this data. It is deleted when you clear your browser data.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-white mb-1">Third-party processors</h3>
            <p>
              We use <span className="text-white font-medium">Supabase</span> (EU region) to store account and game data, and <span className="text-white font-medium">Google OAuth</span> to enable sign-in with Google.
              Both act as data processors under written agreements. We do not sell your data to any third party.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-white mb-1">Data retention</h3>
            <p>
              Account data is retained for as long as your account is active. If you request deletion, we will
              erase your personal data within 30 days. Game statistics may be retained in anonymised,
              aggregated form for analytics after deletion.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-white mb-1">Your rights</h3>
            <p>Under UK/EU GDPR you have the right to:</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Request erasure of your data ("right to be forgotten")</li>
              <li>Restrict or object to processing</li>
              <li>Data portability (receive your data in a machine-readable format)</li>
              <li>Withdraw consent at any time (where processing is based on consent)</li>
            </ul>
            <p className="mt-1">
              You can exercise these rights directly in the app: use <span className="text-white font-medium">Export my data</span> on your profile page to download a copy of your data, and <span className="text-white font-medium">Delete account</span> to permanently erase your account. For other requests, use the feedback form. We will respond within 30 days.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-white mb-1">Cookies</h3>
            <p>
              We do not use tracking or advertising cookies. The app uses localStorage for session and profile
              data only.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-white mb-1">Contact</h3>
            <p>
              For privacy questions, data requests, or complaints, use the feedback form in the app. You also
              have the right to lodge a complaint with your national supervisory authority (e.g. the ICO in the UK).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
