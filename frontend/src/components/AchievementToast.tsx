import { useEffect, useState } from 'react';
import { ACHIEVEMENT_MAP } from '../utils/achievements';

interface AchievementToastProps {
  ids: string[];
  onDismiss: (id: string) => void;
}

export default function AchievementToast({ ids, onDismiss }: AchievementToastProps) {
  const [exiting, setExiting] = useState(false);

  const currentId = ids[0];
  const achievement = currentId ? ACHIEVEMENT_MAP[currentId] : null;

  useEffect(() => {
    if (!currentId) return;
    setExiting(false);

    const dismissTimer = setTimeout(() => {
      setExiting(true);
    }, 3200);

    return () => clearTimeout(dismissTimer);
  }, [currentId]);

  useEffect(() => {
    if (!exiting || !currentId) return;
    const removeTimer = setTimeout(() => {
      onDismiss(currentId);
      setExiting(false);
    }, 320);
    return () => clearTimeout(removeTimer);
  }, [exiting, currentId, onDismiss]);

  if (!achievement) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-40 pointer-events-none ${exiting ? 'toast-exit' : 'toast-enter'}`}
      style={{ transform: 'translateX(-50%)' }}
    >
      <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl border border-white/20 px-5 py-3 flex items-center gap-3 min-w-[260px] max-w-xs">
        <span className="text-3xl flex-shrink-0">{achievement.icon}</span>
        <div className="flex flex-col">
          <span className="text-xs text-white/60 font-medium uppercase tracking-wide">Achievement Unlocked</span>
          <span className="text-sm font-bold text-white leading-tight">{achievement.name}</span>
          <span className="text-xs text-white/70 leading-tight mt-0.5">{achievement.description}</span>
        </div>
      </div>
    </div>
  );
}
