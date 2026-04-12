import { useEffect, useState } from 'react';

interface StreakToastProps {
  streak: number;
  onDismiss: () => void;
}

export default function StreakToast({ streak, onDismiss }: StreakToastProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    setExiting(false);
    const dismissTimer = setTimeout(() => setExiting(true), 3200);
    return () => clearTimeout(dismissTimer);
  }, []);

  useEffect(() => {
    if (!exiting) return;
    const removeTimer = setTimeout(() => onDismiss(), 320);
    return () => clearTimeout(removeTimer);
  }, [exiting, onDismiss]);

  const icon = streak >= 30 ? '🏆' : streak >= 14 ? '⚡' : streak >= 7 ? '🔥' : '🎯';

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-40 pointer-events-none ${exiting ? 'toast-exit' : 'toast-enter'}`}
      style={{ transform: 'translateX(-50%)' }}
    >
      <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl border border-white/20 px-5 py-3 flex items-center gap-3 min-w-[260px] max-w-xs">
        <span className="text-3xl flex-shrink-0">{icon}</span>
        <div className="flex flex-col">
          <span className="text-xs text-white/60 font-medium uppercase tracking-wide">Daily Streak</span>
          <span className="text-sm font-bold text-white leading-tight">
            {streak === 1 ? 'First game today!' : `${streak} days in a row!`}
          </span>
          <span className="text-xs text-white/70 leading-tight mt-0.5">Keep it up — come back tomorrow!</span>
        </div>
      </div>
    </div>
  );
}
