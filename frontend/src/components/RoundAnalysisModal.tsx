import { useState } from 'react';
import { Player, RoundResult, PLAYER_COLOR_MAP } from '../game/GameState';
import { probabilityFromRecord, alternativeBids, probColour } from '../utils/probability';
import DiceFace from './DiceFace';
import { useLanguage } from '../i18n/LanguageContext';


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
  const { t } = useLanguage();
  const [highlightedFace, setHighlightedFace] = useState<number | null>(null);
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
          <h2 className="text-base font-bold text-white">{t('roundAnalysis.title', { n: result.round })}</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white text-lg leading-none px-1">✕</button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ scrollbarWidth: 'none' }}>

          {/* Challenge outcome */}
          {challengedBidProb !== null && (
            <div className="bg-white/10 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white/50 uppercase tracking-wider">
                  {result.challengeType === 'calza' ? t('roundAnalysis.calzaOutcome') : t('roundAnalysis.challengeOutcome')}
                </p>
                <InfoTooltip text={
                  result.challengeType === 'calza'
                    ? t('roundAnalysis.calzaTooltip')
                    : t('roundAnalysis.challengeTooltip')
                } />
              </div>

              <div className="flex items-center gap-2">
                <BidDisplay quantity={result.challengedBid.quantity} faceValue={result.challengedBid.faceValue} />
                <span className="text-xs text-white/60">
                  {result.challengeType === 'calza' ? t('roundAnalysis.calzaBy') : t('roundAnalysis.challengedBy')}
                </span>
                <span className="text-xs font-semibold text-white">
                  {challengerPlayer?.isHuman ? t('game.you') : challengerPlayer?.name}
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs text-white/70">
                <span>{t('roundResult.actualCount')}</span>
                <span className="font-bold text-white">{result.actualCount}×</span>
                <span className="inline-block w-4 h-4 bg-white rounded"><DiceFace value={result.challengedBid.faceValue} size="sm" /></span>
              </div>
              {result.challengeType !== 'calza' && (
                <div className="text-xs text-white/70">
                  {t('roundAnalysis.probability', { probability: Math.round(challengedBidProb * 100) })}
                </div>
              )}

              {result.challengeType === 'calza' ? (
                result.calzaSuccess ? (
                  <p className="text-xs text-yellow-300 font-semibold">
                    {humanWasChallenger
                      ? t('roundAnalysis.exactGainYou')
                      : t('roundAnalysis.exactGainOther', { name: challengerPlayer?.name ?? '' })}
                  </p>
                ) : (
                  <p className="text-xs text-amber-300 font-semibold">
                    {humanWasChallenger
                      ? t('roundAnalysis.wrongLoseYou', { actual: result.actualCount, quantity: result.challengedBid.quantity })
                      : t('roundAnalysis.wrongLoseOther', { actual: result.actualCount, quantity: result.challengedBid.quantity, name: challengerPlayer?.name ?? '' })}
                  </p>
                )
              ) : (
                <>
                  {humanWasChallenger && !humanLost && (
                    <p className="text-xs text-green-300 font-semibold">
                      {challengedBidProb < 0.35
                        ? t('roundAnalysis.goodCall', { probability: Math.round(challengedBidProb * 100) })
                        : t('roundAnalysis.luckyCall', { probability: Math.round(challengedBidProb * 100) })}
                    </p>
                  )}

                  {humanWasChallenger && humanLost && (
                    <p className="text-xs text-amber-300 font-semibold">
                      {challengedBidProb < 0.35
                        ? t('roundAnalysis.unluckyCall', { probability: Math.round(challengedBidProb * 100) })
                        : t('roundAnalysis.riskyCall', { probability: Math.round(challengedBidProb * 100) })}
                    </p>
                  )}

                  {!humanWasChallenger && humanWasBidder && !humanLost && (
                    <p className="text-xs text-green-300 font-semibold">
                      {challengedBidProb >= 0.35
                        ? t('roundAnalysis.bidHeldUp', { probability: Math.round(challengedBidProb * 100), name: challengerPlayer?.name ?? '' })
                        : t('roundAnalysis.bluffWorked', { probability: Math.round(challengedBidProb * 100) })}
                    </p>
                  )}

                  {!humanWasChallenger && humanWasBidder && humanLost && (
                    <p className="text-xs text-amber-300 font-semibold">
                      {challengedBidProb < 0.35
                        ? t('roundAnalysis.rightChallenge', { probability: Math.round(challengedBidProb * 100), name: challengerPlayer?.name ?? '' })
                        : t('roundAnalysis.unluckyBid', { probability: Math.round(challengedBidProb * 100) })}
                    </p>
                  )}

                  {!humanWasChallenger && !humanWasBidder && (
                    <p className="text-xs text-white/60">
                      {challengedBidProb < 0.35
                        ? t('roundAnalysis.dudoWouldHave', { probability: Math.round((1 - challengedBidProb) * 100) })
                        : t('roundAnalysis.bidAppeared')}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Bid timeline */}
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <p className="text-xs font-bold text-white/50 uppercase tracking-wider">{t('roundAnalysis.bidTimeline')}</p>
              <InfoTooltip text={t('roundAnalysis.bidTimelineTooltip')} />
            </div>
            <div className="space-y-0.5">
              {result.bids.map((record, i) => {
                const player = players.find(p => p.id === record.playerId);
                const color = player ? (PLAYER_COLOR_MAP[player.color] || '#6B7280') : '#6B7280';
                const name = player?.isHuman ? t('game.you') : (player?.name ?? 'Unknown');
                const prob = probabilityFromRecord(record);
                const isFinalBid = i === result.bids.length - 1;

                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2 px-2 py-1 rounded-lg ${
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
              <p className="text-xs text-white/40 italic">{t('roundAnalysis.noBids')}</p>
            )}
          </div>

          {/* Alternative bids (when human challenged and lost) */}
          {humanWasChallenger && humanLost && (
            <div className="bg-white/10 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white/50 uppercase tracking-wider">{t('roundAnalysis.couldHaveBid')}</p>
                <InfoTooltip align="right" text={t('roundAnalysis.couldHaveBidTooltip')} />
              </div>
              {alternatives.length > 0 ? (
                <div className="space-y-1.5">
                  {alternatives.map((alt, i) => {
                    // Minimum valid bid for this face value
                    const minQty = alt.faceValue === result.challengedBid.faceValue
                      ? result.challengedBid.quantity + 1
                      : alt.faceValue > result.challengedBid.faceValue
                        ? result.challengedBid.quantity
                        : result.challengedBid.quantity + 1;
                    const hasRange = alt.actualCount > minQty;
                    return (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="text-xs text-white">{hasRange ? `up to ${alt.actualCount}×` : `${alt.actualCount}×`}</span>
                        <div className="w-5 h-5 bg-white rounded flex items-center justify-center flex-shrink-0"><DiceFace value={alt.faceValue} size="sm" /></div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-white/50 italic">
                  {t('roundAnalysis.noValidBids')}
                </p>
              )}
            </div>
          )}

          {/* Actual dice per player */}
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <p className="text-xs font-bold text-white/50 uppercase tracking-wider">{t('roundAnalysis.actualDice')}</p>
              <InfoTooltip text={t('roundAnalysis.actualDiceTooltip')} />
            </div>
            {(() => {
              // Pre-compute total counts for each face value across all dice
              const allDiceFlat = result.allDice.flatMap(d => d.dice);
              const faceCounts: Record<number, number> = {};
              for (const d of allDiceFlat) {
                faceCounts[d] = (faceCounts[d] || 0) + 1;
              }
              const wildsCount = faceCounts[1] || 0;

              // Check if a die should be highlighted based on the selected face
              const isDieHighlighted = (dieValue: number): boolean => {
                if (highlightedFace === null) return false;
                if (dieValue === highlightedFace) return true;
                // Wilds (1s) count for non-1 faces in non-palifico
                if (!palificoMode && highlightedFace !== 1 && dieValue === 1) return true;
                return false;
              };

              const getTooltipText = (): string => {
                if (highlightedFace === null) return '';
                const exact = faceCounts[highlightedFace] || 0;
                if (palificoMode || highlightedFace === 1) {
                  return t('roundAnalysis.total', { exact });
                }
                const total = exact + wildsCount;
                return t('roundAnalysis.totalWithWild', { total, exact, wilds: wildsCount });
              };

              return (
                <div className="relative">
                  {/* Floating tooltip — positioned above the section title */}
                  {highlightedFace !== null && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/85 text-white text-[10px] font-bold px-2.5 py-1 rounded-md whitespace-nowrap z-20 pointer-events-none flex items-center gap-1.5">
                      <span className="inline-block w-4 h-4 bg-white rounded flex-shrink-0"><DiceFace value={highlightedFace} size="sm" /></span>
                      {getTooltipText()}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    {result.allDice.map(({ playerId, dice }) => {
                      const player = players.find(p => p.id === playerId);
                      if (!player || dice.length === 0) return null;
                      const color = PLAYER_COLOR_MAP[player.color] || '#6B7280';
                      const name = player.isHuman ? t('game.you') : player.name;
                      return (
                        <div key={playerId} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-xs text-white/70 w-16 truncate">{name}</span>
                          <div className="flex gap-1">
                            {dice.sort((a, b) => a - b).map((d, di) => (
                              <div
                                key={di}
                                className="w-5 h-5 rounded flex items-center justify-center cursor-pointer transition-shadow duration-150"
                                style={{
                                  background: 'white',
                                  boxShadow: isDieHighlighted(d) ? '0 0 6px 2px rgba(251, 191, 36, 0.8), inset 0 0 0 1.5px #fbbf24' : 'none',
                                }}
                                onMouseEnter={() => setHighlightedFace(d)}
                                onMouseLeave={() => setHighlightedFace(null)}
                                onClick={() => setHighlightedFace(prev => prev === d ? null : d)}
                              >
                                <DiceFace value={d} size="sm" />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/20 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2 btn-3d-accent text-white font-bold rounded-xl text-sm"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
