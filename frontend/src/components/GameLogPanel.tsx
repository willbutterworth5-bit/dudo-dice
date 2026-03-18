import { useState } from 'react';
import { Bid, BidRecord, Player, RoundResult, PLAYER_COLOR_MAP } from '../game/GameState';
import { probabilityFromRecord, probColour } from '../utils/probability';
import DiceFace from './DiceFace';

interface GameLogPanelProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  currentRoundBids: Bid[];
  roundHistory: RoundResult[];
  roundNumber: number;
  analysisEnabled: boolean;
}

function BidRow({ bid, players, record, analysisEnabled }: {
  bid: Bid;
  players: Player[];
  record?: BidRecord;
  analysisEnabled: boolean;
}) {
  const player = players.find(p => p.id === bid.playerId);
  const color = player ? (PLAYER_COLOR_MAP[player.color] || '#6B7280') : '#6B7280';
  const name = player?.isHuman ? 'You' : (player?.name ?? 'Unknown');

  let probEl = null;
  if (analysisEnabled && record) {
    const prob = probabilityFromRecord(record);
    const { text, bg } = probColour(prob);
    probEl = (
      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${text} ${bg}`}>
        {Math.round(prob * 100)}%
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1">
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <span className="text-xs text-white/80 font-semibold truncate flex-1">{name}</span>
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-xs font-bold text-white">{bid.quantity}×</span>
        <div className="w-4 h-4 bg-white rounded flex items-center justify-center">
          <DiceFace value={bid.faceValue} size="sm" />
        </div>
      </div>
      {probEl}
    </div>
  );
}

function PreviousRound({ round, players, analysisEnabled }: {
  round: RoundResult;
  players: Player[];
  analysisEnabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const loser = players.find(p => p.id === round.loserId);
  const loserName = loser?.isHuman ? 'You' : (loser?.name ?? 'Unknown');
  const loserColor = loser ? (PLAYER_COLOR_MAP[loser.color] || '#6B7280') : '#6B7280';

  return (
    <div className="mb-1">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left flex items-center gap-2 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
      >
        <span className="text-xs font-bold text-white/60">R{round.round}</span>
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: loserColor }} />
        <span className="text-xs text-white/70 flex-1 truncate">{loserName} −1 die</span>
        <span className="text-white/40 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="mt-1 pl-2 border-l border-white/10">
          {round.bids.map((bid, i) => (
            <BidRow
              key={i}
              bid={bid.bid as any}
              players={players}
              record={bid}
              analysisEnabled={analysisEnabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function GameLogPanel({
  isOpen,
  onClose,
  players,
  currentRoundBids,
  roundHistory,
  roundNumber,
  analysisEnabled,
}: GameLogPanelProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={onClose}
        />
      )}

      {/* Slide-in panel */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{
          width: '260px',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s ease',
          background: 'linear-gradient(135deg, #3730a3, #581c87)',
          boxShadow: isOpen ? '-4px 0 24px rgba(0,0,0,0.4)' : 'none',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-white/20 flex-shrink-0">
          <span className="text-sm font-bold text-white">Game Log</span>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-lg leading-none px-1"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-indigo">
          {/* Current round */}
          <div className="mb-3">
            <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1">
              Round {roundNumber}
            </p>
            {currentRoundBids.length === 0 ? (
              <p className="text-xs text-white/30 italic">No bids yet</p>
            ) : (
              currentRoundBids.map((bid, i) => (
                <BidRow
                  key={i}
                  bid={bid}
                  players={players}
                  record={undefined}
                  analysisEnabled={false}
                />
              ))
            )}
          </div>

          {/* Previous rounds */}
          {roundHistory.length > 0 && (
            <div>
              <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1">
                Previous Rounds
              </p>
              {[...roundHistory].reverse().map((round) => (
                <PreviousRound
                  key={round.round}
                  round={round}
                  players={players}
                  analysisEnabled={analysisEnabled}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
