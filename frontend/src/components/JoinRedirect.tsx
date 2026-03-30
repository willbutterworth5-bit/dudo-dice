import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { ProfileStorage } from '../utils/profileStorage';
import type { useMultiplayerConnection } from '../hooks/useMultiplayerConnection';

interface JoinRedirectProps {
  mp: ReturnType<typeof useMultiplayerConnection>;
}

export default function JoinRedirect({ mp }: JoinRedirectProps) {
  const { roomCode } = useParams<{ roomCode: string }>();

  useEffect(() => {
    if (!roomCode) return;
    const profile = ProfileStorage.getProfile();
    const playerName = profile.name && profile.name.trim() && profile.name !== 'You'
      ? profile.name
      : 'Player';
    mp.connectAndJoin(roomCode.toUpperCase(), playerName);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show lobby briefly while connecting; App's auto-nav effect takes over
  return <Navigate to="/online" replace />;
}
