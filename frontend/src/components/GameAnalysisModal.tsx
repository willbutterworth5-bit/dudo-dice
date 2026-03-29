import { useState } from 'react';
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

function RoundDetail({
  round,
  players,
  highlightMissedDudos = false,
}: {
  round: RoundResult;
  players: Player[];
  highlightMissedDudos?: boolean;
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
            <BidDisplay
              quantity={round.challengedBid.quantity}
              faceValue={round.challengedBid.faceValue}
            />
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
          <p className="text-xs font-bold uppercase tracking-wider text-white/50">
            Bid Timeline
          </p>
          <InfoTooltip text="Every bid in order. The percentage reflects how likely the bid was from your perspective using your known dice and the remaining dice in play." />
        </div>
        <div className="space-y-0.5">
          {round.bids.map((record, index) => {
            const player = players.find(candidate => candidate.id === record.playerId);
            const color = player ? PLAYER_COLOR_MAP[player.color] || '#6B7280' : '#6B7280';
            const name = player?.isHuman ? 'You' : player?.name ?? 'Unknown';
            const prob = probabilityFromRecord(record);
            const isFinal = index === round.bids.length - 1;
            const nextBid = round.bids[index + 1];
            const nextBidderIsHuman = nextBid
              ? players.find(candidate => candidate.id === nextBid.playerId)?.isHuman
              : false;
            const flatDice = round.allDice.flatMap(playerDice => playerDice.dice);
            const actualCount = flatDice.filter(dieValue => {
              if (palificoMode) {
                return dieValue === record.bid.faceValue;
              }
              return dieValue === record.bid.faceValue || dieValue === 1;
            }).length;
            const bidWasFalse = actualCount < record.bid.quantity;
            const couldHaveDudo =
              highlightMissedDudos && !player?.isHuman && bidWasFalse && nextBidderIsHuman;

            return (
              <div key={index}>
                <div
                  className={`flex items-center gap-2 rounded-lg px-2 py-1 ${
                    couldHaveDudo
                      ? 'bg-amber-500/20 ring-1 ring-amber-400/40'
                      : isFinal
                        ? 'border border-dashed border-white/30 bg-white/15'
                        : 'bg-white/8'
                  }`}
                >
                  <div
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="flex-1 truncate text-xs font-semibold text-white/80">
                    {name}
                  </span>
                  <BidDisplay quantity={record.bid.quantity} faceValue={record.bid.faceValue} />
                  <ProbBadge prob={prob} />
                </div>
                {couldHaveDudo && (
                  <p className="mt-0.5 pl-2 text-[10px] text-amber-300/80">
                    You could have called DUDO here. Only {actualCount} were on the board.
                  </p>
                )}
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
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-white/50">
            What You Could Have Bid
          </p>
          {alternatives.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {alternatives.map((alternative, index) => (
                <div key={index} className="flex items-center gap-1">
                  <BidDisplay
                    quantity={alternative.quantity}
                    faceValue={alternative.faceValue}
                  />
                  <span className="text-xs text-white/50">
                    ({alternative.actualCount} on board)
                  </span>
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
            if (!player || dice.length === 0) {
              return null;
            }

            const color = PLAYER_COLOR_MAP[player.color] || '#6B7280';
            const name = player.isHuman ? 'You' : player.name;

            return (
              <div key={playerId} className="flex items-center gap-2">
                <div
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="w-14 truncate text-xs text-white/70">{name}</span>
                <div className="flex gap-0.5">
                  {[...dice].sort((left, right) => left - right).map((dieValue, dieIndex) => (
                    <div
                      key={dieIndex}
                      className="flex h-4 w-4 items-center justify-center rounded bg-white"
                    >
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
  if (!human || roundHistory.length === 0) {
    return null;
  }

  const humanBids = roundHistory.flatMap(round =>
    round.bids.filter(record => record.playerId === human.id),
  );
  const avgProb =
    humanBids.length > 0
      ? humanBids.reduce((sum, bid) => sum + probabilityFromRecord(bid), 0) / humanBids.length
      : null;

  const humanChallenges = roundHistory.filter(round => round.challengerId === human.id);
  const correctChallenges = humanChallenges.filter(round => round.winnerId === human.id);

  const missedOpportunities = roundHistory.filter(round => {
    if (round.challengerId === human.id) {
      return false;
    }

    const flatDice = round.allDice.flatMap(playerDice => playerDice.dice);
    const wasPalifico = round.bids[0]?.palificoMode ?? false;

    return round.bids.some((bid, index) => {
      if (bid.playerId === human.id) {
        return false;
      }

      const nextBid = round.bids[index + 1];
      if (!nextBid || nextBid.playerId !== human.id) {
        return false;
      }

      const actual = flatDice.filter(dieValue => {
        if (wasPalifico) {
          return dieValue === bid.bid.faceValue;
        }
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
    missedRounds: missedOpportunities.map(round => round.round),
  };
}

export default function GameAnalysisModal({
  roundHistory,
  players,
  onClose,
}: GameAnalysisModalProps) {
  const [selectedRound, setSelectedRound] = useState(
    roundHistory[roundHistory.length - 1]?.round ?? 1,
  );
  const [filterMissed, setFilterMissed] = useState(false);

  const stats = computeSummaryStats(roundHistory, players);
  const displayedRounds =
    filterMissed && stats
      ? roundHistory.filter(round => stats.missedRounds.includes(round.round))
      : roundHistory;
  const selectedResult = displayedRounds.find(round => round.round === selectedRound)
    ?? roundHistory.find(round => round.round === selectedRound)
    ?? displayedRounds[0]
    ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className="flex w-full max-w-sm flex-col rounded-xl bg-gradient-to-br from-indigo-700 to-purple-900 shadow-2xl"
        style={{ maxHeight: '88vh' }}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-white/20 px-4 py-3">
          <h2 className="text-base font-bold text-white">Game Analysis</h2>
          <button
            onClick={onClose}
            className="px-1 text-lg leading-none text-white/60 hover:text-white"
          >
            x
          </button>
        </div>

        {stats && (
          <div className="flex flex-shrink-0 gap-3 border-b border-white/20 px-4 py-3">
            {stats.avgProb !== null && (
              <div className="flex-1 rounded-lg bg-white/10 p-2 text-center">
                <p className="text-lg font-bold text-white">{Math.round(stats.avgProb * 100)}%</p>
                <p className="text-xs text-white/50">Avg bid probability</p>
              </div>
            )}
            <div className="flex-1 rounded-lg bg-white/10 p-2 text-center">
              <p className="text-lg font-bold text-white">
                {stats.correctChallenges}/{stats.totalChallenges}
              </p>
              <p className="text-xs text-white/50">DUDO calls</p>
            </div>
            <button
              className={`flex-1 rounded-lg p-2 text-center transition-colors ${
                filterMissed
                  ? 'bg-amber-500/30 ring-1 ring-amber-400/50'
                  : 'bg-white/10 hover:bg-white/15'
              }`}
              onClick={() => {
                if (stats.missedRounds.length === 0) {
                  return;
                }

                const nextFilterMissed = !filterMissed;
                setFilterMissed(nextFilterMissed);

                if (nextFilterMissed) {
                  setSelectedRound(stats.missedRounds[0]);
                }
              }}
            >
              <p className="text-lg font-bold text-white">{stats.missedOpportunities}</p>
              <p className={`text-xs ${filterMissed ? 'text-amber-300' : 'text-white/50'}`}>
                Missed DUDOs
              </p>
            </button>
          </div>
        )}

        <div className="flex-shrink-0 border-b border-white/20 px-4 py-2">
          {filterMissed && (
            <p className="mb-1.5 text-xs text-amber-300/70">
              Showing missed DUDO rounds.
              <button
                className="ml-1 underline text-white/60 hover:text-white"
                onClick={() => setFilterMissed(false)}
              >
                Show all
              </button>
            </p>
          )}
          <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {displayedRounds.map(round => (
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
            <RoundDetail
              round={selectedResult}
              players={players}
              highlightMissedDudos={filterMissed}
            />
          ) : (
            <p className="text-xs italic text-white/40">No data for this round.</p>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-white/20 px-4 py-3">
          <button
            onClick={onClose}
            className="btn-3d-accent w-full rounded-xl py-2 text-sm font-bold text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
