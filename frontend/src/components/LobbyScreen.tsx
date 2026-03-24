import { useState, useEffect } from 'react';
import type { Difficulty } from '@dudo-dice/shared';
import { ProfileStorage } from '../utils/profileStorage';
import type { PublicRoom } from '../hooks/useMultiplayerConnection';

interface LobbyScreenProps {
  isConnected: boolean;
  publicRooms: PublicRoom[];
  error: string | null;
  onCreateRoom: (settings: {
    maxPlayers: number;
    startingDice: number;
    palificoEnabled: boolean;
    calzaEnabled: boolean;
    difficulty: string;
  }, isPublic: boolean, playerName: string) => void;
  onJoinRoom: (code: string, playerName: string) => void;
  onQuickMatch: (playerName: string) => void;
  onListRooms: () => void;
  onBack: () => void;
}

type Tab = 'join' | 'create' | 'browse';

export default function LobbyScreen({
  isConnected,
  publicRooms,
  error,
  onCreateRoom,
  onJoinRoom,
  onQuickMatch,
  onListRooms,
  onBack,
}: LobbyScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>('join');
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState(() => {
    const profile = ProfileStorage.getProfile();
    return profile.name === 'You' ? '' : profile.name;
  });

  // Create room settings
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [startingDice, setStartingDice] = useState(5);
  const [palificoEnabled, setPalificoEnabled] = useState(true);
  const [calzaEnabled, setCalzaEnabled] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (activeTab === 'browse') {
      onListRooms();
    }
  }, [activeTab, onListRooms]);

  const getName = () => playerName.trim() || 'Player';

  const handleJoin = () => {
    if (!roomCode.trim()) return;
    onJoinRoom(roomCode.trim().toUpperCase(), getName());
  };

  const handleQuickMatch = () => {
    onQuickMatch(getName());
  };

  const handleCreate = () => {
    onCreateRoom(
      { maxPlayers, startingDice, palificoEnabled, calzaEnabled, difficulty },
      isPublic,
      getName()
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-center gap-4 mb-5">
          <img src="/Logo.png" alt="Dudo Dice Logo" className="flex-shrink-0" style={{ width: '56px', height: '56px' }} />
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-white">Play Online</h1>
            <p className="text-sm text-white/70">
              {isConnected ? '🟢 Connected' : '🔴 Connecting...'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        {/* Player name */}
        <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl p-5 mb-4">
          <label className="block text-sm font-semibold text-white mb-2">Your Name:</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={16}
            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(['join', 'create', 'browse'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl font-bold text-sm transition-colors ${
                activeTab === tab ? 'text-white btn-3d-accent' : 'btn-glass'
              }`}
            >
              {tab === 'join' ? 'Join Game' : tab === 'create' ? 'Create Room' : 'Browse'}
            </button>
          ))}
        </div>

        <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl p-5">
          {/* Join tab */}
          {activeTab === 'join' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Room Code:</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="ABCD"
                  maxLength={4}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
              <button
                onClick={handleJoin}
                disabled={!isConnected || !roomCode.trim()}
                className="w-full py-2.5 text-white font-extrabold rounded-xl btn-3d-accent disabled:opacity-50"
              >
                Join Room
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/20" /></div>
                <div className="relative flex justify-center text-sm"><span className="bg-indigo-800 px-2 text-white/60">or</span></div>
              </div>

              <button
                onClick={handleQuickMatch}
                disabled={!isConnected}
                className="w-full py-2.5 text-white font-bold rounded-xl btn-glass disabled:opacity-50"
              >
                ⚡ Quick Match
              </button>
            </div>
          )}

          {/* Create tab */}
          {activeTab === 'create' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Max Players: <span className="font-extrabold">{maxPlayers}</span>
                </label>
                <input
                  type="range" min="2" max="6" value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="w-full h-3 bg-white/20 rounded-xl appearance-none cursor-pointer accent-white"
                />
                <div className="flex justify-between text-xs text-white/70 mt-1">
                  {[2,3,4,5,6].map(n => <span key={n}>{n}</span>)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Starting Dice: <span className="font-extrabold">{startingDice}</span>
                </label>
                <input
                  type="range" min="1" max="5" value={startingDice}
                  onChange={(e) => setStartingDice(Number(e.target.value))}
                  className="w-full h-3 bg-white/20 rounded-xl appearance-none cursor-pointer accent-white"
                />
                <div className="flex justify-between text-xs text-white/70 mt-1">
                  {[1,2,3,4,5].map(n => <span key={n}>{n}</span>)}
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-white mb-1">Palifico</label>
                  <div className="flex gap-1">
                    {(['off', 'on'] as const).map((val) => (
                      <button
                        key={val}
                        onClick={() => setPalificoEnabled(val === 'on')}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-xs ${
                          palificoEnabled === (val === 'on') ? 'text-white btn-3d-accent' : 'btn-glass'
                        }`}
                      >
                        {val.charAt(0).toUpperCase() + val.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-white mb-1">Calza</label>
                  <div className="flex gap-1">
                    {(['off', 'on'] as const).map((val) => (
                      <button
                        key={val}
                        onClick={() => setCalzaEnabled(val === 'on')}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-xs ${
                          calzaEnabled === (val === 'on') ? 'text-white btn-3d-accent' : 'btn-glass'
                        }`}
                      >
                        {val.charAt(0).toUpperCase() + val.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-white mb-1">Visibility</label>
                  <div className="flex gap-1">
                    {([true, false] as const).map((val) => (
                      <button
                        key={String(val)}
                        onClick={() => setIsPublic(val)}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-xs ${
                          isPublic === val ? 'text-white btn-3d-accent' : 'btn-glass'
                        }`}
                      >
                        {val ? 'Public' : 'Private'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-white mb-1">AI Difficulty</label>
                  <div className="flex gap-1">
                    {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-xs ${
                          difficulty === d ? 'text-white btn-3d-accent' : 'btn-glass'
                        }`}
                      >
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={!isConnected}
                className="w-full py-2.5 text-white font-extrabold rounded-xl btn-3d-accent disabled:opacity-50"
              >
                Create Room
              </button>
            </div>
          )}

          {/* Browse tab */}
          {activeTab === 'browse' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/70">{publicRooms.length} room{publicRooms.length !== 1 ? 's' : ''} available</span>
                <button onClick={onListRooms} className="text-sm btn-glass px-3 py-1 rounded-lg font-bold">
                  Refresh
                </button>
              </div>

              {publicRooms.length === 0 ? (
                <p className="text-center text-white/50 py-6 text-sm">
                  No open rooms. Create one or try Quick Match!
                </p>
              ) : (
                publicRooms.map((room) => (
                  <div key={room.code} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <span className="font-bold text-white text-sm">{room.code}</span>
                      <span className="text-white/50 text-xs ml-2">by {room.hostName}</span>
                      <div className="text-xs text-white/40 mt-0.5">
                        {room.playerCount}/{room.maxPlayers} players · {room.settings.startingDice} dice
                        {room.settings.palificoEnabled && ' · Palifico'}
                        {room.settings.calzaEnabled && ' · Calza'}
                      </div>
                    </div>
                    <button
                      onClick={() => onJoinRoom(room.code, getName())}
                      disabled={!isConnected}
                      className="px-4 py-1.5 text-sm font-bold rounded-xl btn-3d-accent disabled:opacity-50"
                    >
                      Join
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <button
          onClick={onBack}
          className="mt-4 w-full py-2 text-white/70 font-semibold text-sm hover:text-white transition-colors"
        >
          ← Back to Menu
        </button>
      </div>
    </div>
  );
}
