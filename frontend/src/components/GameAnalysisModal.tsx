import { useState } from 'react';
import { Player, RoundResult, PLAYER_COLOR_MAP } from '../game/GameState';
import { probabilityFromRecord, alternativeBids, probColour } from '../utils/probability';
import DiceFace from './DiceFace';

interface GameAnalysisModalProps {
  roundHistory: RoundResult[];
  players: Player[];
  onClose: () => void;
}

function ProbBadge({ prob }: { prob: number }) {
  const { text, bg } = probColour(prob);
  return (
    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${text} ${bg}`}>
      {Math.round(prob * 100)}%
    </span>
  );
}

function InfoTooltip({ text, align = 'left' }: { text: string; align?: 'left' | 'right' }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="w-4 h-4 rounded-full bg-white/20 text-white/60 hover:bg-white/35 hover:text-white flex items-center justify-center text-[10px] font-bold leading-none flex-shrink-0"
      >
        i
      </button>
      {visible && (
        <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-5 z-20 w-44 bg-gray-900/95 text-white/85 text-xs rounded-lg p-2.5 shadow-xl pointer-events-none border border-white/10 leading-relaxed`}>
          {text}
        </div>
      )}
    </span>
  );
}

function BidDisplay({ quantity, faceValue }: { quantity: number; faceValue: number }) {
  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <span className="font-bold text-white text-xs">{quantity}×</span>
      <div className="w-4 h-4 bg-white rounded flex items-center justify-center">
        <DiceFace value={faceValue} size="sm" />
      </div>
    </div>
  );
}

function RoundDetail({ round, players }: { round: RoundResult; players: Player[] }) {
  const humanPlayer = players.find(p => p.isHuman);
  const humanWasChallenger = humanPlayer?.id === round.challengerId;
  const humanLost = humanPlayer?.id === round.loserId;
  const lastBid = round.bids[round.bids.length - 1];
  const challengedBidProb = lastBid ? probabilityFromRecord(lastBid) : null;
  const challenger = players.find(p => p.id === round.challengerId);
  const loser = players.find(p => p.id === round.loserId);

  const palificoMode = round.bids[0]?.palificoMode ?? false;
  const alternatives = (humanWasChallenger && humanLost)
    ? alternativeBids(round.allDice, round.challengedBid, palificoMode)
    : [];

  return (
    <div className="space-y-3">
      {/* Bid timeline */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Bid Timeline</p>
          <InfoTooltip text="Every bid made this round in order. The % shows how likely the bid was true from your perspective — using your dice and the total dice still in play at that moment." />
        </div>
        <div className="space-y-1">
          {round.bids.map((record, i) => {
            const player = players.find(p => p.id === record.playerId);
            const color = player ? (PLAYER_COLOR_MAP[player.color] || '#6B7280') : '#6B7280';
            const name = player?.isHuman ? 'You' : (player?.name ?? 'Unknown');
            const prob = probabilityFromRecord(record);
            const isFinal = i === round.bids.length - 1;
            return (
              <div
                key={i}
                className={`flex items-center gap-2 px-2 py-1 rounded-lg ${isFinal ? 'bg-white/15 border border-dashed border-white/30' : 'bg-white/8'}`}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs font-semibold text-white/80 flex-1 truncate">{name}</span>
                <BidDisplay quantity={record.bid.quantity} faceValue={record.bid.faceValue} />
                <ProbBadge prob={prob} />
              </div>
            );
          })}
          {round.bids.length === 0 && <p className="text-xs text-white/30 italic">No bids recorded</p>}
        </div>
      </div>

      {/* Summary row */}
      {challengedBidProb !== null && (
        <div className="bg-white/10 rounded-lg p-2.5 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-bold text-white/50 uppercase tracking-wider">
              {round.challengeType === 'calza' ? 'Calza Outcome' : 'Challenge Outcome'}
            </p>
            <InfoTooltip text={
              round.challengeType === 'calza'
                ? "A summary of the CALZA call — whether the exact count matched the bid."
                : "A summary of the DUDO call — what was bid, the actual count on the table, and whether the challenge was the right move based on the probabilities at the time."
            } />
          </div>
          <div className="flex items-center gap-2 text-xs text-white/70 flex-wrap">
            <span>
              {challenger?.isHuman ? 'You' : challenger?.name}{' '}
              {round.challengeType === 'calza' ? 'called CALZA on' : 'called DUDO on'}{' '}
            </span>
            <BidDisplay quantity={round.challengedBid.quantity} faceValue={round.challengedBid.faceValue} />
            <span className="flex items-center gap-1">· Actual: <span className="font-bold text-white">{round.actualCount}×</span><span className="inline-block w-4 h-4 bg-white rounded"><DiceFace value={round.challengedBid.faceValue} size="sm" /></span></span>
          </div>
          {round.challengeType === 'calza' ? (
            round.calzaSuccess ? (
              <p className="text-xs text-yellow-300">🎯 Exact count — {challenger?.isHuman ? 'You' : challenger?.name} gained a die</p>
            ) : (
              <p className="text-xs text-amber-300">{loser?.isHuman ? 'You' : loser?.name} lost a die — count was off</p>
            )
          ) : (
            <>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-white/60">Bid was</span>
                <ProbBadge prob={challengedBidProb} />
                <span className="text-white/60">likely ·</span>
                <span className="text-white/60">
                  {loser?.isHuman ? 'You' : loser?.name} lost a die
                </span>
              </div>
              {humanWasChallenger && !humanLost && (
                <p className="text-xs text-green-300">✓ Good DUDO call</p>
              )}
              {humanWasChallenger && humanLost && (
                <div>
                  <p className="text-xs text-amber-300 mb-1">Could have bid instead</p>
                  {alternatives.length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                      {alternatives.map((alt, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <BidDisplay quantity={alt.quantity} faceValue={alt.faceValue} />
                          <span className="text-xs text-white/50">({alt.actualCount} on board)</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/50 italic">No valid bids above the challenge were true — DUDO was your only option.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Actual dice */}
      <div className="bg-white/10 rounded-lg p-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Actual Dice</p>
          <InfoTooltip text="The dice each player was actually holding at the end of this round, revealed after the challenge." />
        </div>
        <div className="space-y-1">
          {round.allDice.map(({ playerId, dice }) => {
            const player = players.find(p => p.id === playerId);
            if (!player || dice.length === 0) return null;
            const color = PLAYER_COLOR_MAP[player.color] || '#6B7280';
            const name = player.isHuman ? 'You' : player.name;
            return (
              <div key={playerId} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs text-white/70 w-14 truncate">{name}</span>
                <div className="flex gap-0.5">
                  {dice.sort((a, b) => a - b).map((d, di) => (
                    <div key={di} className="w-4 h-4 bg-white rounded flex items-center justify-center">
                      <DiceFace value={d} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function computeSummaryStats(roundHistory: RoundResult[], players: Player[]) {
  const human = players.find(p => p.isHuman);
  if (!human || roundHistory.length === 0) return null;

  const humanBids = roundHistory.flatMap(r => r.bids.filter(b => b.playerId === human.id));
  const avgProb = humanBids.length > 0
    ? humanBids.reduce((sum, b) => sum + probabilityFromRecord(b), 0) / humanBids.length
    : null;

  const humanChallenges = roundHistory.filter(r => r.challengerId === human.id);
  const correctChallenges = humanChallenges.filter(r => r.winnerId === human.id);

  const missedOpportunities = roundHistory.filter(r => {
    if (r.challengerId === human.id) return false; // human did challenge
    const lastBid = r.bids[r.bids.length - 1];
    if (!lastBid) return false;
    const prob = probabilityFromRecord(lastBid);
    return prob < 0.30; // bid was <30% likely — DUDO would very likely have worked
  });

  return { avgProb, correctChallenges: correctChallenges.length, totalChallenges: humanChallenges.length, missedOpportunities: missedOpportunities.length };
}

export default function GameAnalysisModal({ roundHistory, players, onClose }: GameAnalysisModalProps) {
  const [selectedRound, setSelectedRound] = useState(roundHistory[roundHistory.length - 1]?.round ?? 1);

  const selectedResult = roundHistory.find(r => r.round === selectedRound);
  const stats = computeSummaryStats(roundHistory, players);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div
        className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-xl shadow-2xl w-full max-w-sm flex flex-col"
        style={{ maxHeight: '88vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/20 flex-shrink-0">
          <h2 className="text-base font-bold text-white">Game Analysis</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white text-lg leading-none px-1">✕</button>
        </div>

        {/* Summary stats */}
        {stats && (
          <div className="px-4 py-3 border-b border-white/20 flex gap-3 flex-shrink-0">
            {stats.avgProb !== null && (
              <div className="flex-1 bg-white/10 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-white">{Math.round(stats.avgProb * 100)}%</p>
                <p className="text-xs text-white/50">Avg bid probability</p>
              </div>
            )}
            <div className="flex-1 bg-white/10 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-white">{stats.correctChallenges}/{stats.totalChallenges}</p>
              <p className="text-xs text-white/50">DUDO calls</p>
            </div>
            <div className="flex-1 bg-white/10 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-white">{stats.missedOpportunities}</p>
              <p className="text-xs text-white/50">Missed DUDOs</p>
            </div>
          </div>
        )}

        {/* Round selector — horizontally scrollable, capped at ~6 visible */}
        <div className="px-4 py-2 border-b border-white/20 flex-shrink-0">
          <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {roundHistory.map(r => (
              <button
                key={r.round}
                onClick={() => setSelectedRound(r.round)}
                className={`flex-shrink-0 w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                  r.round === selectedRound ? 'btn-3d-accent text-white' : 'btn-glass'
                }`}
              >
                {r.round}
              </button>
            ))}
          </div>
        </div>

        {/* Round detail */}
        <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-indigo">
          {selectedResult ? (
            <RoundDetail round={selectedResult} players={players} />
          ) : (
            <p className="text-xs text-white/40 italic">No data for this round</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/20 flex-shrink-0">
          <button onClick={onClose} className="w-full py-2 btn-3d-accent text-white font-bold rounded-xl text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
