import { useState } from 'react';
import { Player, RoundResult, PLAYER_COLOR_MAP } from '../game/GameState';
import { probabilityFromRecord, alternativeBids, probColour } from '../utils/probability';
import DiceFace from './DiceFace';


interface RoundAnalysisModalProps {
  result: RoundResult;
  players: Player[];
  onClose: () => void;
}

function ProbBadge({ prob }: { prob: number }) {
  const { text, bg } = probColour(prob);
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${text} ${bg}`}>
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
    <div className="flex items-center gap-1">
      <span className="font-bold text-white">{quantity}×</span>
      <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
        <DiceFace value={faceValue} size="sm" />
      </div>
    </div>
  );
}

export default function RoundAnalysisModal({ result, players, onClose }: RoundAnalysisModalProps) {
  const humanPlayer = players.find(p => p.isHuman);
  const challengerPlayer = players.find(p => p.id === result.challengerId);
  const humanWasChallenger = humanPlayer?.id === result.challengerId;
  const humanLost = humanPlayer?.id === result.loserId;

  // Probability of the challenged bid being true (from human's perspective at time of challenge)
  const lastBid = result.bids[result.bids.length - 1];
  const challengedBidProb = lastBid ? probabilityFromRecord(lastBid) : null;

  // If human challenged and lost: what could they have bid instead (based on actual board dice)?
  const palificoMode = result.bids[0]?.palificoMode ?? false;
  const alternatives = (humanWasChallenger && humanLost)
    ? alternativeBids(result.allDice, result.challengedBid, palificoMode)
    : [];

  // If AI challenged and human was the bidder: was human's bid justified?
  const humanWasBidder = humanPlayer?.id === result.bidderId;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div
        className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-xl shadow-2xl w-full max-w-sm flex flex-col"
        style={{ maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/20 flex-shrink-0">
          <h2 className="text-base font-bold text-white">Round {result.round} Analysis</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white text-lg leading-none px-1">✕</button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-indigo">

          {/* Bid timeline */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Bid Timeline</p>
              <InfoTooltip text="Every bid made this round in order. The % shows how likely the bid was true from your perspective — using your dice and the total dice still in play at that moment." />
            </div>
            <div className="space-y-1.5">
              {result.bids.map((record, i) => {
                const player = players.find(p => p.id === record.playerId);
                const color = player ? (PLAYER_COLOR_MAP[player.color] || '#6B7280') : '#6B7280';
                const name = player?.isHuman ? 'You' : (player?.name ?? 'Unknown');
                const prob = probabilityFromRecord(record);
                const isFinalBid = i === result.bids.length - 1;

                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${
                      isFinalBid ? 'bg-white/15 border border-white/30 border-dashed' : 'bg-white/8'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs font-semibold text-white/80 flex-1 truncate">{name}</span>
                    <BidDisplay quantity={record.bid.quantity} faceValue={record.bid.faceValue} />
                    <ProbBadge prob={prob} />
                  </div>
                );
              })}
            </div>
            {result.bids.length === 0 && (
              <p className="text-xs text-white/40 italic">No bids recorded</p>
            )}
          </div>

          {/* Challenge outcome */}
          {challengedBidProb !== null && (
            <div className="bg-white/10 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white/50 uppercase tracking-wider">
                  {result.challengeType === 'calza' ? 'Calza Outcome' : 'Challenge Outcome'}
                </p>
                <InfoTooltip text={
                  result.challengeType === 'calza'
                    ? "A summary of the CALZA call — whether the exact count matched the bid."
                    : "A summary of the DUDO call — what was bid, the actual count on the table, and whether the challenge was the right move based on the probabilities at the time."
                } />
              </div>

              <div className="flex items-center gap-2">
                <BidDisplay quantity={result.challengedBid.quantity} faceValue={result.challengedBid.faceValue} />
                <span className="text-xs text-white/60">
                  {result.challengeType === 'calza' ? 'calza by' : 'challenged by'}
                </span>
                <span className="text-xs font-semibold text-white">
                  {challengerPlayer?.isHuman ? 'You' : challengerPlayer?.name}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-white/70">
                <span>Actual count:</span>
                <span className="font-bold text-white">{result.actualCount}</span>
                {result.challengeType !== 'calza' && (
                  <>
                    <span className="text-white/40">·</span>
                    <span>
                      Bid probability was <span className="font-bold text-white">{Math.round(challengedBidProb * 100)}%</span>
                    </span>
                  </>
                )}
              </div>

              {result.challengeType === 'calza' ? (
                result.calzaSuccess ? (
                  <p className="text-xs text-yellow-300 font-semibold">
                    🎯 Exact count! {humanWasChallenger ? 'You gained' : `${challengerPlayer?.name} gained`} a die.
                  </p>
                ) : (
                  <p className="text-xs text-amber-300 font-semibold">
                    Count was {result.actualCount}, not {result.challengedBid.quantity}. {humanWasChallenger ? 'You lost' : `${challengerPlayer?.name} lost`} a die.
                  </p>
                )
              ) : (
                <>
                  {humanWasChallenger && !humanLost && (
                    <p className="text-xs text-green-300 font-semibold">
                      ✓ Good call — the bid was unlikely to be true.
                    </p>
                  )}

                  {humanWasChallenger && humanLost && (
                    <p className="text-xs text-amber-300 font-semibold">
                      The bid was actually true ({Math.round(challengedBidProb * 100)}% likely). DUDO was risky here.
                    </p>
                  )}

                  {!humanWasChallenger && humanWasBidder && !humanLost && (
                    <p className="text-xs text-green-300 font-semibold">
                      ✓ Your bid held up — {challengerPlayer?.name} was wrong to challenge.
                    </p>
                  )}

                  {!humanWasChallenger && humanWasBidder && humanLost && (
                    <p className="text-xs text-amber-300 font-semibold">
                      Your bid was challenged correctly — it was unlikely to be true.
                    </p>
                  )}

                  {!humanWasChallenger && !humanWasBidder && (
                    <p className="text-xs text-white/60">
                      {challengedBidProb < 0.35
                        ? `DUDO would have been ${Math.round((1 - challengedBidProb) * 100)}% likely to succeed from your perspective.`
                        : `The bid appeared likely — challenging would have been risky.`}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Alternative bids (when human challenged and lost) */}
          {humanWasChallenger && humanLost && (
            <div className="bg-white/10 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Instead, you could have bid:</p>
                <InfoTooltip align="right" text="Bids that were truthful based on the actual dice on the board — alternatives above the challenged bid that you could have safely made instead of calling DUDO." />
              </div>
              {alternatives.length > 0 ? (
                <div className="space-y-1.5">
                  {alternatives.map((alt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <BidDisplay quantity={alt.quantity} faceValue={alt.faceValue} />
                      <span className="text-xs text-white/50">({alt.actualCount} on the board)</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/50 italic">
                  No valid bids above the challenge were true — DUDO was your only option.
                </p>
              )}
            </div>
          )}

          {/* Actual dice per player */}
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Actual Dice</p>
              <InfoTooltip text="The dice each player was actually holding at the end of this round, revealed after the challenge." />
            </div>
            <div className="space-y-1.5">
              {result.allDice.map(({ playerId, dice }) => {
                const player = players.find(p => p.id === playerId);
                if (!player || dice.length === 0) return null;
                const color = PLAYER_COLOR_MAP[player.color] || '#6B7280';
                const name = player.isHuman ? 'You' : player.name;
                return (
                  <div key={playerId} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs text-white/70 w-16 truncate">{name}</span>
                    <div className="flex gap-1">
                      {dice.sort((a, b) => a - b).map((d, di) => (
                        <div key={di} className="w-5 h-5 bg-white rounded flex items-center justify-center">
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

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/20 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2 btn-3d-accent text-white font-bold rounded-xl text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
