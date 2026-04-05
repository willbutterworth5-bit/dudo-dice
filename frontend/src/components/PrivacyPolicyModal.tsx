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

        <div className="overflow-y-auto px-5 py-4 space-y-4 text-sm text-white/80 leading-relaxed">
          <p className="text-white/50 text-xs">Last updated: January 2026</p>

          <section>
            <h3 className="font-bold text-white mb-1">What we collect</h3>
            <p>
              Dudo Dice stores your game statistics, achievements, and profile settings locally in your browser
              (localStorage). If you create an account, this data is also stored in our database so you can
              access it across devices.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-white mb-1">Account data</h3>
            <p>
              If you sign in with Google or create an email account, we store your email address, display name,
              country, and date of birth. Your date of birth is used only to verify you meet the minimum age
              requirement (13+) and is never shared publicly.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-white mb-1">Game data</h3>
            <p>
              We store your win/loss record, Dudo call statistics, achievements, and Elo rating. This data is
              used to display your profile and, for ranked play, to match you with similarly-rated opponents.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-white mb-1">Feedback</h3>
            <p>
              If you submit feedback, we store the message content and optionally your email address if provided.
              This is used solely to respond to your feedback and improve the game.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-white mb-1">Third parties</h3>
            <p>
              We use Supabase to store account and game data. Authentication via Google OAuth is handled by
              Google. We do not sell or share your data with any other third parties.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-white mb-1">Data retention</h3>
            <p>
              You can delete your account at any time by contacting us. Guest data stored in localStorage
              is cleared when you clear your browser data.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-white mb-1">Contact</h3>
            <p>
              For privacy questions or data deletion requests, use the feedback form in the app.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
