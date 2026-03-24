import type { RoomPlayerInfo } from '../hooks/useMultiplayerConnection';
import { PLAYER_COLOR_MAP, PLAYER_COLORS } from '@dudo-dice/shared';

interface WaitingRoomProps {
  roomCode: string;
  players: RoomPlayerInfo[];
  hostId: string;
  mySessionId: string;
  settings: {
    maxPlayers: number;
    startingDice: number;
    palificoEnabled: boolean;
    calzaEnabled: boolean;
  };
  onStartGame: () => void;
  onLeave: () => void;
}

export default function WaitingRoom({
  roomCode,
  players,
  hostId,
  mySessionId,
  settings,
  onStartGame,
  onLeave,
}: WaitingRoomProps) {
  const isHost = mySessionId === hostId;
  const canStart = players.length >= 2;

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full">
        <div className="flex items-center justify-center gap-4 mb-5">
          <img src="/Logo.png" alt="Dudo Dice Logo" className="flex-shrink-0" style={{ width: '56px', height: '56px' }} />
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-white">Waiting Room</h1>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl p-5 mb-4">
          {/* Room code */}
          <div className="text-center mb-5">
            <p className="text-sm text-white/60 mb-1">Room Code</p>
            <button
              onClick={copyCode}
              className="text-4xl font-black text-white tracking-[0.3em] hover:text-white/80 transition-colors"
              title="Click to copy"
            >
              {roomCode}
            </button>
            <p className="text-xs text-white/40 mt-1">Click to copy · Share with friends</p>
          </div>

          <div className="h-px bg-white/20 mb-4" />

          {/* Settings summary */}
          <div className="flex gap-3 text-xs text-white/60 justify-center mb-4">
            <span>🎲 {settings.startingDice} dice</span>
            <span>👥 Up to {settings.maxPlayers}</span>
            {settings.palificoEnabled && <span>🎯 Palifico</span>}
            {settings.calzaEnabled && <span>✋ Calza</span>}
          </div>

          {/* Player list */}
          <div className="space-y-2 mb-5">
            <p className="text-sm font-semibold text-white">
              Players ({players.length}/{settings.maxPlayers})
            </p>
            {players.map((p, idx) => {
              const colorKey = PLAYER_COLORS[idx % PLAYER_COLORS.length];
              const color = PLAYER_COLOR_MAP[colorKey];
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-2 rounded-xl bg-white/5"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: color }}
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white font-semibold text-sm flex-1">
                    {p.name}
                    {p.id === mySessionId && <span className="text-white/40 ml-1">(you)</span>}
                  </span>
                  {p.id === hostId && (
                    <span className="text-xs text-yellow-400 font-bold">HOST</span>
                  )}
                </div>
              );
            })}

            {/* Empty slots */}
            {Array.from({ length: settings.maxPlayers - players.length }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 opacity-30">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white/40 text-sm">?</span>
                </div>
                <span className="text-white/40 text-sm">Waiting for player...</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          {isHost ? (
            <button
              onClick={onStartGame}
              disabled={!canStart}
              className="w-full py-2.5 text-white font-extrabold rounded-xl btn-3d-accent disabled:opacity-50"
            >
              {canStart ? 'Start Game' : 'Need at least 2 players'}
            </button>
          ) : (
            <p className="text-center text-white/50 text-sm">
              Waiting for host to start the game...
            </p>
          )}
        </div>

        <button
          onClick={onLeave}
          className="w-full py-2 text-white/70 font-semibold text-sm hover:text-white transition-colors"
        >
          ← Leave Room
        </button>
      </div>
    </div>
  );
}
