import { useState, useRef, useEffect } from 'react';
import { PLAYER_COLOR_MAP, Player, RoundResult } from '../game/GameState';
import { alternativeBids, probColour, probabilityFromRecord } from '../utils/probability';
import DiceFace from './DiceFace';

interface GameAnalysisModalProps {
  roundHistory: RoundResult[];
  players: Player[];
  onClose: () => void;
}

function ProbBadge({ prob }: { prob: number }) {
  const { text, bg } = probColour(prob);
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${text} ${bg}`}>
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
        className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold leading-none text-white/60 hover:bg-white/35 hover:text-white"
      >
        i
      </button>
      {visible && (
        <div
          className={`pointer-events-none absolute top-5 z-20 w-44 rounded-lg border border-white/10 bg-gray-900/95 p-2.5 text-xs leading-relaxed text-white/85 shadow-xl ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {text}
        </div>
      )}
    </span>
  );
}

function BidDisplay({ quantity, faceValue }: { quantity: number; faceValue: number }) {
  return (
    <div className="flex flex-shrink-0 items-center gap-1">
      <span className="text-xs font-bold text-white">{quantity}x</span>
      <div className="flex h-4 w-4 items-center justify-center rounded bg-white">
        <DiceFace value={faceValue} size="sm" />
      </div>
    </div>
  );
}

function MissedDudosPage({
  roundHistory,
  players,
  onBack,
}: {
  roundHistory: RoundResult[];
  players: Player[];
  onBack: () => void;
}) {
  const human = players.find(p => p.isHuman);
  const items: { round: number; bidderName: string; bidderColor: string; bid: { quantity: number; faceValue: number }; actualCount: number }[] = [];

  for (const round of roundHistory) {
    const wasPalifico = round.bids[0]?.palificoMode ?? false;
    const flatDice = round.allDice.flatMap(pd => pd.dice);

    for (let i = 0; i < round.bids.length; i++) {
      const record = round.bids[i];
      if (record.playerId === human?.id) continue;

      const nextBid = round.bids[i + 1];
      if (!nextBid || nextBid.playerId !== human?.id) continue;

      const actual = flatDice.filter(d => {
        if (wasPalifico) return d === record.bid.faceValue;
        return d === record.bid.faceValue || d === 1;
      }).length;

      if (actual < record.bid.quantity) {
        const bidder = players.find(p => p.id === record.playerId);
        items.push({
          round: round.round,
          bidderName: bidder?.name ?? 'Unknown',
          bidderColor: bidder ? PLAYER_COLOR_MAP[bidder.color] || '#6B7280' : '#6B7280',
          bid: record.bid,
          actualCount: actual,
        });
      }
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-white/20 px-4 py-2">
        <button onClick={onBack} className="text-sm text-white/60 hover:text-white">&larr; Back</button>
        <h3 className="text-sm font-bold text-white">Missed DUDOs</h3>
      </div>
      <div className="scrollbar-indigo flex-1 overflow-y-auto px-4 py-3">
        {items.length === 0 ? (
          <p className="text-center text-xs italic text-white/40">No missed DUDO opportunities.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="rounded-lg bg-amber-500/15 ring-1 ring-amber-400/30 p-2.5">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-300/70">Round {item.round}</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: item.bidderColor }} />
                  <span className="text-xs font-semibold text-white/80">{item.bidderName} bid</span>
                  <BidDisplay quantity={item.bid.quantity} faceValue={item.bid.faceValue} />
                </div>
                <p className="mt-1 text-[11px] text-amber-300/80">
                  Only {item.actualCount}x were on the board — you could have called DUDO.
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DudoCallsPage({
  roundHistory,
  players,
  onBack,
}: {
  roundHistory: RoundResult[];
  players: Player[];
  onBack: () => void;
}) {
  const human = players.find(p => p.isHuman);
  const calls = roundHistory.filter(r => r.challengerId === human?.id && r.challengeType === 'dudo');

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-white/20 px-4 py-2">
        <button onClick={onBack} className="text-sm text-white/60 hover:text-white">&larr; Back</button>
        <h3 className="text-sm font-bold text-white">Your DUDO Calls</h3>
      </div>
      <div className="scrollbar-indigo flex-1 overflow-y-auto px-4 py-3">
        {calls.length === 0 ? (
          <p className="text-center text-xs italic text-white/40">You made no DUDO calls this game.</p>
        ) : (
          <div className="space-y-2">
            {calls.map((round, idx) => {
              const won = round.winnerId === human?.id;
              const bidder = players.find(p => p.id === round.bidderId);
              const bidderColor = bidder ? PLAYER_COLOR_MAP[bidder.color] || '#6B7280' : '#6B7280';
              const lastBid = round.bids[round.bids.length - 1];
              const prob = lastBid ? probabilityFromRecord(lastBid) : null;
              return (
                <div
                  key={idx}
                  className={`rounded-lg p-2.5 ring-1 ${
                    won
                      ? 'bg-green-500/15 ring-green-400/30'
                      : 'bg-red-500/15 ring-red-400/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${won ? 'text-green-300/70' : 'text-red-300/70'}`}>
                      Round {round.round} — {won ? 'Correct ✓' : 'Wrong ✗'}
                    </p>
                    {prob !== null && <ProbBadge prob={prob} />}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: bidderColor }} />
                    <span className="text-xs text-white/70">
                      {bidder?.isHuman ? 'You' : bidder?.name ?? 'Unknown'} bid
                    </span>
                    <BidDisplay quantity={round.challengedBid.quantity} faceValue={round.challengedBid.faceValue} />
                  </div>
                  <p className="mt-1 text-[11px] text-white/60">
                    Actual: <span className="font-bold text-white">{round.actualCount}x</span>{' '}
                    {won ? '— bid was a bluff.' : '— bid was real, you lost a die.'}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function RoundDetail({
  round,
  players,
}: {
  round: RoundResult;
  players: Player[];
}) {
  const humanPlayer = players.find(player => player.isHuman);
  const humanWasChallenger = humanPlayer?.id === round.challengerId;
  const humanLost = humanPlayer?.id === round.loserId;
  const lastBid = round.bids[round.bids.length - 1];
  const challengedBidProb = lastBid ? probabilityFromRecord(lastBid) : null;
  const challenger = players.find(player => player.id === round.challengerId);
  const loser = players.find(player => player.id === round.loserId);
  const palificoMode = round.bids[0]?.palificoMode ?? false;
  const alternatives =
    humanWasChallenger && humanLost
      ? alternativeBids(round.allDice, round.challengedBid, palificoMode)
      : [];

  return (
    <div className="space-y-3">
      {challengedBidProb !== null && (
        <div className="flex flex-col gap-1.5 rounded-lg bg-white/10 p-2.5">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-white/50">
              {round.challengeType === 'calza' ? 'Calza Outcome' : 'Challenge Outcome'}
            </p>
            <InfoTooltip
              text={
                round.challengeType === 'calza'
                  ? 'Summary of the Calza call and whether the exact table count matched the bid.'
                  : 'Summary of the Dudo call, including the bid, the actual table count, and whether the challenge was strong at the time.'
              }
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
            <span>
              {challenger?.isHuman ? 'You' : challenger?.name}{' '}
              {round.challengeType === 'calza' ? 'called CALZA on' : 'called DUDO on'}
            </span>
            <BidDisplay quantity={round.challengedBid.quantity} faceValue={round.challengedBid.faceValue} />
            <span className="flex items-center gap-1">
              Actual:
              <span className="font-bold text-white">{round.actualCount}x</span>
              <span className="inline-block h-4 w-4 rounded bg-white">
                <DiceFace value={round.challengedBid.faceValue} size="sm" />
              </span>
            </span>
          </div>
          {round.challengeType === 'calza' ? (
            round.calzaSuccess ? (
              <p className="text-xs text-yellow-300">
                Exact count. {challenger?.isHuman ? 'You' : challenger?.name} gained a die.
              </p>
            ) : (
              <p className="text-xs text-amber-300">
                {loser?.isHuman ? 'You' : loser?.name} lost a die because the count was off.
              </p>
            )
          ) : (
            <>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-white/60">Bid was</span>
                <ProbBadge prob={challengedBidProb} />
                <span className="text-white/60">likely</span>
                <span className="text-white/60">
                  {loser?.isHuman ? 'You' : loser?.name} lost a die
                </span>
              </div>
              {humanWasChallenger && !humanLost && (
                <p className="text-xs text-green-300">Good DUDO call.</p>
              )}
            </>
          )}
        </div>
      )}

      <div className="rounded-lg bg-white/10 p-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-white/50">Bid Timeline</p>
          <InfoTooltip text="Every bid in order. The percentage reflects how likely the bid was from your perspective using your known dice and the remaining dice in play." />
        </div>
        <div className="space-y-0.5">
          {round.bids.map((record, index) => {
            const player = players.find(candidate => candidate.id === record.playerId);
            const color = player ? PLAYER_COLOR_MAP[player.color] || '#6B7280' : '#6B7280';
            const name = player?.isHuman ? 'You' : player?.name ?? 'Unknown';
            const prob = probabilityFromRecord(record);
            const isFinal = index === round.bids.length - 1;
            return (
              <div key={index}>
                <div
                  className={`flex items-center gap-2 rounded-lg px-2 py-1 ${
                    isFinal ? 'border border-dashed border-white/30 bg-white/15' : 'bg-white/8'
                  }`}
                >
                  <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  <span className="flex-1 truncate text-xs font-semibold text-white/80">{name}</span>
                  <BidDisplay quantity={record.bid.quantity} faceValue={record.bid.faceValue} />
                  <ProbBadge prob={prob} />
                </div>
              </div>
            );
          })}
          {round.bids.length === 0 && (
            <p className="text-xs italic text-white/30">No bids recorded.</p>
          )}
        </div>
      </div>

      {humanWasChallenger && humanLost && (
        <div className="rounded-lg bg-white/10 p-2.5">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-white/50">What You Could Have Bid</p>
          {alternatives.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {alternatives.map((alternative, index) => (
                <div key={index} className="flex items-center gap-1">
                  <BidDisplay quantity={alternative.quantity} faceValue={alternative.faceValue} />
                  <span className="text-xs text-white/50">({alternative.actualCount} on board)</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs italic text-white/50">
              No valid bids above the challenge were true. DUDO was your only option.
            </p>
          )}
        </div>
      )}

      <div className="rounded-lg bg-white/10 p-2.5">
        <div className="mb-1.5 flex items-center gap-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-white/50">Actual Dice</p>
          <InfoTooltip text="The dice each player held at the end of the round, revealed after the challenge." />
        </div>
        <div className="space-y-1">
          {round.allDice.map(({ playerId, dice }) => {
            const player = players.find(candidate => candidate.id === playerId);
            if (!player || dice.length === 0) return null;
            const color = PLAYER_COLOR_MAP[player.color] || '#6B7280';
            const name = player.isHuman ? 'You' : player.name;
            return (
              <div key={playerId} className="flex items-center gap-2">
                <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span className="w-14 truncate text-xs text-white/70">{name}</span>
                <div className="flex gap-0.5">
                  {[...dice].sort((a, b) => a - b).map((dieValue, dieIndex) => (
                    <div key={dieIndex} className="flex h-4 w-4 items-center justify-center rounded bg-white">
                      <DiceFace value={dieValue} size="sm" />
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
  const human = players.find(player => player.isHuman);
  if (!human || roundHistory.length === 0) return null;

  const humanBids = roundHistory.flatMap(round =>
    round.bids.filter(record => record.playerId === human.id),
  );
  const avgProb =
    humanBids.length > 0
      ? humanBids.reduce((sum, bid) => sum + probabilityFromRecord(bid), 0) / humanBids.length
      : null;

  const humanChallenges = roundHistory.filter(round => round.challengerId === human.id && round.challengeType === 'dudo');
  const correctChallenges = humanChallenges.filter(round => round.winnerId === human.id);

  const missedOpportunities = roundHistory.filter(round => {
    if (round.challengerId === human.id) return false;
    const flatDice = round.allDice.flatMap(playerDice => playerDice.dice);
    const wasPalifico = round.bids[0]?.palificoMode ?? false;
    return round.bids.some((bid, index) => {
      if (bid.playerId === human.id) return false;
      const nextBid = round.bids[index + 1];
      if (!nextBid || nextBid.playerId !== human.id) return false;
      const actual = flatDice.filter(dieValue => {
        if (wasPalifico) return dieValue === bid.bid.faceValue;
        return dieValue === bid.bid.faceValue || dieValue === 1;
      }).length;
      return actual < bid.bid.quantity;
    });
  });

  return {
    avgProb,
    correctChallenges: correctChallenges.length,
    totalChallenges: humanChallenges.length,
    missedOpportunities: missedOpportunities.length,
  };
}

type SubPage = 'main' | 'missed' | 'dudos';

export default function GameAnalysisModal({ roundHistory, players, onClose }: GameAnalysisModalProps) {
  const [selectedRound, setSelectedRound] = useState(
    roundHistory[roundHistory.length - 1]?.round ?? 1,
  );
  const [subPage, setSubPage] = useState<SubPage>('main');
  const roundScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (roundScrollRef.current) {
      roundScrollRef.current.scrollLeft = roundScrollRef.current.scrollWidth;
    }
  }, []);

  const stats = computeSummaryStats(roundHistory, players);
  const selectedResult = roundHistory.find(round => round.round === selectedRound) ?? roundHistory[0] ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className="flex w-full max-w-sm flex-col rounded-xl bg-gradient-to-br from-indigo-700 to-purple-900 shadow-2xl"
        style={{ maxHeight: '88vh' }}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-white/20 px-4 py-3">
          <h2 className="text-base font-bold text-white">Game Analysis</h2>
          <button onClick={onClose} className="px-1 text-lg leading-none text-white/60 hover:text-white">×</button>
        </div>

        {subPage === 'missed' ? (
          <MissedDudosPage roundHistory={roundHistory} players={players} onBack={() => setSubPage('main')} />
        ) : subPage === 'dudos' ? (
          <DudoCallsPage roundHistory={roundHistory} players={players} onBack={() => setSubPage('main')} />
        ) : (
          <>
            {/* Game Analysis summary */}
            {stats && (
              <div className="flex-shrink-0 border-b border-white/20 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">Summary</p>
                <div className="flex gap-3 items-stretch">
                  {stats.avgProb !== null && (
                    <div className="flex-1 rounded-lg bg-white/10 p-2 text-center flex flex-col items-center justify-center">
                      <p className="text-lg font-bold text-white leading-tight">{Math.round(stats.avgProb * 100)}%</p>
                      <p className="text-[11px] text-white/50 leading-tight mt-0.5">Avg bid probability</p>
                    </div>
                  )}
                  <button
                    className="flex-1 rounded-lg bg-white/10 p-2 text-center flex flex-col items-center justify-center hover:bg-white/20 transition-colors"
                    onClick={() => setSubPage('dudos')}
                  >
                    <p className="text-lg font-bold text-white leading-tight">
                      {stats.correctChallenges}/{stats.totalChallenges}
                    </p>
                    <p className="text-[11px] text-white/50 leading-tight mt-0.5">DUDO calls</p>
                  </button>
                  <button
                    className={`flex-1 rounded-lg p-2 text-center flex flex-col items-center justify-center transition-colors ${
                      stats.missedOpportunities > 0 ? 'bg-white/10 hover:bg-amber-500/20' : 'bg-white/10 opacity-60'
                    }`}
                    onClick={() => { if (stats.missedOpportunities > 0) setSubPage('missed'); }}
                  >
                    <p className="text-lg font-bold text-white leading-tight">{stats.missedOpportunities}</p>
                    <p className="text-[11px] text-white/50 leading-tight mt-0.5">Missed DUDOs</p>
                  </button>
                </div>
              </div>
            )}

            {/* Round by round section */}
            <div className="flex-shrink-0 border-b border-white/20 px-4 pt-3 pb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">Round by Round</p>
              <div ref={roundScrollRef} className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {roundHistory.map(round => (
                  <button
                    key={round.round}
                    onClick={() => setSelectedRound(round.round)}
                    className={`h-8 w-8 flex-shrink-0 rounded-lg text-xs font-bold transition-colors ${
                      round.round === selectedRound ? 'btn-3d-accent text-white' : 'btn-glass'
                    }`}
                  >
                    {round.round}
                  </button>
                ))}
              </div>
            </div>

            <div className="scrollbar-indigo flex-1 overflow-y-auto px-4 py-3">
              {selectedResult ? (
                <RoundDetail round={selectedResult} players={players} />
              ) : (
                <p className="text-xs italic text-white/40">No data for this round.</p>
              )}
            </div>
          </>
        )}

        <div className="flex-shrink-0 border-t border-white/20 px-4 py-3">
          <button onClick={onClose} className="btn-3d-accent w-full rounded-xl py-2 text-sm font-bold text-white">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
