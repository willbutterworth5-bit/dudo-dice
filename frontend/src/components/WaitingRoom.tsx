import type { RoomPlayerInfo } from '../hooks/useMultiplayerConnection';
import { PLAYER_COLOR_MAP, PLAYER_COLORS } from '@dudo-dice/shared';

interface WaitingRoomProps {
  roomCode: string;
  players: RoomPlayerInfo[];
  hostId: string | null;
  myPlayerId: string | null;
  settings: {
    maxPlayers: number;
    startingDice: number;
    palificoEnabled: boolean;
    calzaEnabled: boolean;
  };
  startWithBotsVotes: string[];
  isRanked: boolean;
  onStartGame: () => void;
  onVoteStartWithBots: () => void;
  onLeave: () => void;
}

export default function WaitingRoom({
  roomCode,
  players,
  hostId,
  myPlayerId,
  settings,
  startWithBotsVotes,
  isRanked,
  onStartGame,
  onVoteStartWithBots,
  onLeave,
}: WaitingRoomProps) {
  const humanPlayers = players.filter(p => !p.isAI);
  const canStart = players.length >= 2;
  const isHost = myPlayerId === hostId;
  const hasVotedBots = myPlayerId ? startWithBotsVotes.includes(myPlayerId) : false;
  const hasEmptySlots = players.length < settings.maxPlayers;

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 sm:p-8" style={{ overflowY: 'auto' }}>
      {/* Back button - fixed top left */}
      <button
        onClick={onLeave}
        className="fixed text-white text-sm font-semibold z-50 rounded-xl px-2 py-1 shadow-md bg-gradient-to-br from-indigo-700 to-purple-900"
        style={{ left: '0.75rem', top: '0.75rem' }}
      >
        ← Back
      </button>
      <div className="max-w-md w-full pt-12 sm:pt-0">
        <div className="flex items-center justify-center gap-4 mb-5 pl-16 sm:pl-0">
          <picture><source srcSet="/Logo.webp" type="image/webp" /><img src="/Logo.png" alt="Dudo Dice Logo" className="flex-shrink-0" style={{ width: '56px', height: '56px' }} /></picture>
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

          {/* Ranked / Casual banner */}
          <div className={`text-center text-xs font-semibold rounded-lg py-1.5 mb-4 ${
            isRanked
              ? 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30'
              : 'bg-white/5 text-white/50 border border-white/10'
          }`}>
            {isRanked
              ? 'Ranked Match — Rating changes will apply'
              : 'Casual Match — 3+ players needed for ranked'}
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
                    {p.id === myPlayerId && <span className="text-white/40 ml-1">(you)</span>}
                  </span>
                  {p.rating != null && !p.isAI && (
                    <span className="text-xs text-white/60 bg-white/10 rounded px-1.5 py-0.5 font-mono">
                      {p.rating}{p.provisional ? '?' : ''}
                    </span>
                  )}
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
          <div className="space-y-2">
            {/* Host start game — only shown when room is full or when host wants to start without bots */}
            {isHost && (
              <button
                onClick={onStartGame}
                disabled={!canStart}
                className="w-full py-2.5 text-white font-extrabold rounded-xl btn-3d-accent disabled:opacity-50"
              >
                {canStart ? 'Start Game' : 'Need at least 2 players'}
              </button>
            )}

            {/* Start with Bots — shown to all players when there are empty slots */}
            {hasEmptySlots && (
              <button
                onClick={onVoteStartWithBots}
                disabled={hasVotedBots || !canStart}
                className="w-full py-2.5 text-white font-bold rounded-xl btn-glass disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {hasVotedBots ? (
                  <>
                    <span>Waiting for others</span>
                    <span className="text-white/60 text-sm font-normal">
                      {startWithBotsVotes.length}/{humanPlayers.length} ready
                    </span>
                  </>
                ) : (
                  <>
                    <span>🤖 Start with Bots</span>
                    {startWithBotsVotes.length > 0 && (
                      <span className="text-white/60 text-sm font-normal">
                        {startWithBotsVotes.length}/{humanPlayers.length}
                      </span>
                    )}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
