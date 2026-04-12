import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ProfileStorage } from '../utils/profileStorage';
import type { useMultiplayerConnection } from '../hooks/useMultiplayerConnection';

interface JoinRedirectProps {
  mp: ReturnType<typeof useMultiplayerConnection>;
}

export default function JoinRedirect({ mp }: JoinRedirectProps) {
  const { roomCode } = useParams<{ roomCode: string }>();
  const normalizedCode = roomCode?.toUpperCase() ?? '';

  useEffect(() => {
    if (!roomCode) return;
    const profile = ProfileStorage.getProfile();
    const playerName = profile.username
      || (profile.name && profile.name.trim() && profile.name !== 'You' ? profile.name : 'Player');
    mp.connectAndJoin(roomCode.toUpperCase(), playerName);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center text-white">
        <p className="text-2xl font-bold">Joining room...</p>
        {normalizedCode && (
          <p className="text-white/60 text-sm mt-2">{normalizedCode}</p>
        )}
      </div>
    </div>
  );
}
