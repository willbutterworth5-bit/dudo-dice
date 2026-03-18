interface TurnIndicatorProps {
  remaining: number;
  playerName: string;
}

export default function TurnIndicator({ remaining, playerName }: TurnIndicatorProps) {
  const seconds = Math.ceil(remaining / 1000);
  const progress = Math.max(0, Math.min(100, (remaining / 3000) * 100));

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-lg shadow-xl p-4 border-2 border-blue-500">
      <div className="flex items-center gap-4">
        <div className="animate-spin">
          <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <div>
          <p className="font-semibold text-gray-800">{playerName} is thinking...</p>
          <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{seconds}s remaining</p>
        </div>
      </div>
    </div>
  );
}
