interface LandingPageProps {
  onPlayComputer: () => void;
  onPlayOnline: () => void;
}

export default function LandingPage({ onPlayComputer, onPlayOnline }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="max-w-md w-full">
        {/* Logo and title */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <img
            src="/Logo.png"
            alt="Dudo Dice Logo"
            className="flex-shrink-0 w-16 h-16 sm:w-[88px] sm:h-[88px]"
          />
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
        <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl p-6">
          <h2 className="text-xl font-bold text-white text-center mb-6">
            Choose Game Mode
          </h2>

          <div className="flex flex-col gap-4">
            <button
              onClick={onPlayComputer}
              className="w-full py-4 text-white font-extrabold text-lg rounded-xl transition-colors btn-3d-accent flex items-center justify-center gap-3"
            >
              <span className="text-2xl">🎲</span>
              Play vs Computer
            </button>

            <button
              onClick={onPlayOnline}
              className="w-full py-4 text-white font-extrabold text-lg rounded-xl transition-colors btn-3d-accent flex items-center justify-center gap-3"
            >
              <span className="text-2xl">☁️</span>
              Play Online
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
