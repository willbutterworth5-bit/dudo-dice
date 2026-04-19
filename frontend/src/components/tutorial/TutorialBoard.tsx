import { useEffect, useRef, useState } from 'react';
import DiceFace from '../DiceFace';
import type { TutorialScene, TutorialPlayer } from './tutorialScenes';
import { PLAYER_SECTOR } from './tutorialScenes';

interface TutorialBoardProps {
  scene: TutorialScene;
  revealPhase?: 'hidden' | 'revealing' | 'done';
  // Forwarded refs for spotlight measurement
  boardRef?: React.RefObject<HTMLDivElement>;
  centerCircleRef?: React.RefObject<HTMLDivElement>;
  palificoBadgeRef?: React.RefObject<HTMLDivElement>;
  sectorYouRef?: React.RefObject<HTMLDivElement>;
  bidChipRef?: React.RefObject<HTMLDivElement>;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function darkenHex(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (n >> 16) - amount);
  const g = Math.max(0, ((n >> 8) & 0xff) - amount);
  const b = Math.max(0, (n & 0xff) - amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const SECTOR_ANGLES = [-120, -60, 0, 60, 120, 180];
// Reveal order: clockwise starting from the sector to the left of the human
// (sector 4 = Sofia, left of You at sector 3), matching the real game
const REVEAL_SECTOR_ORDER = [4, 5, 0, 1, 2, 3];

const innerRadius = 70;
const ringRadius = 175;
const outerRadius = 225;
const innerRingMidR = 118;

export default function TutorialBoard({
  scene,
  revealPhase = 'hidden',
  boardRef,
  centerCircleRef,
  palificoBadgeRef,
  sectorYouRef,
  bidChipRef,
}: TutorialBoardProps) {
  // Map sector index → player
  const sectorPlayer: (TutorialPlayer | null)[] = SECTOR_ANGLES.map((_, i) =>
    scene.players.find(pl => PLAYER_SECTOR[pl.id] === i) ?? null,
  );

  const currentPlayerColor = sectorPlayer[scene.currentPlayerIdx]?.color ?? '#9CA3AF';

  // Bid chip position
  const bidSectorIdx = scene.currentBid
    ? (PLAYER_SECTOR[scene.currentBid.playerId] ?? 0)
    : -1;
  const bidMidAngle = bidSectorIdx >= 0 ? SECTOR_ANGLES[bidSectorIdx] + 30 : 0;
  const bidMidRad = (bidMidAngle * Math.PI) / 180;
  const bidChipX = Math.cos(bidMidRad) * innerRingMidR;
  const bidChipY = Math.sin(bidMidRad) * innerRingMidR;

  // Bid chip entrance animation: fade in when bid first appears (null → bid)
  const prevBidExisted = useRef<boolean>(false);
  const [chipOpacity, setChipOpacity] = useState(1);

  useEffect(() => {
    const hasBid = scene.currentBid !== null;
    if (hasBid && !prevBidExisted.current) {
      // Bid just appeared from nothing — start transparent then fade in
      setChipOpacity(0);
      const t = setTimeout(() => setChipOpacity(1), 60);
      prevBidExisted.current = true;
      return () => clearTimeout(t);
    }
    if (!hasBid) {
      prevBidExisted.current = false;
      setChipOpacity(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.currentBid]);

  // ─── Reveal ordering ──────────────────────────────────────────────────────
  // Build the ordered reveal list: sectors [4,5,0,1,2,3], dice sorted by
  // value descending within each sector (high to low, matching board display).
  const allDiceForReveal: { playerId: string; dieIdx: number }[] = scene.revealState
    ? REVEAL_SECTOR_ORDER.flatMap(sectorIdx => {
        const player = sectorPlayer[sectorIdx];
        if (!player) return [];
        const entry = scene.revealState!.allDice.find(d => d.playerId === player.id);
        if (!entry || entry.dice.length === 0) return [];
        // Sort dice indices by value ascending (low to high)
        const sortedIndices = entry.dice
          .map((value, idx) => ({ value, idx }))
          .sort((a, b) => a.value - b.value)
          .map(item => item.idx);
        return sortedIndices.map(dieIdx => ({ playerId: player.id, dieIdx }));
      })
    : [];

  // Sequential reveal counter
  const [revealedCount, setRevealedCount] = useState(0);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (revealPhase === 'revealing' && scene.revealState) {
      setRevealedCount(0);
      let count = 0;
      const total = allDiceForReveal.length;
      const next = () => {
        count++;
        setRevealedCount(count);
        if (count < total) {
          revealTimerRef.current = setTimeout(next, 350);
        }
      };
      revealTimerRef.current = setTimeout(next, 250);
      return () => {
        if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
      };
    } else if (revealPhase === 'done') {
      setRevealedCount(allDiceForReveal.length);
    } else {
      setRevealedCount(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealPhase]);

  // Has a specific (player, original-die-index) been revealed yet?
  const isRevealed = (playerId: string, dieIdx: number): boolean => {
    if (revealPhase === 'done') return true;
    if (revealPhase !== 'revealing') return false;
    const pos = allDiceForReveal.findIndex(d => d.playerId === playerId && d.dieIdx === dieIdx);
    return pos !== -1 && pos < revealedCount;
  };

  // Does a die value match the current bid (for glow)?
  const isDieMatchingBid = (value: number): boolean => {
    if (!scene.currentBid) return false;
    const { faceValue } = scene.currentBid;
    if (value === faceValue) return true;
    // Ones are wild unless bidding ones themselves or Palifico is active
    if (value === 1 && faceValue !== 1 && !scene.palificoMode.active) return true;
    return false;
  };

  // Running match count — for centre-circle tally during reveal
  const matchCount = ((revealPhase === 'revealing' || revealPhase === 'done') && scene.revealState)
    ? allDiceForReveal.slice(0, revealedCount).filter(({ playerId, dieIdx }) => {
        const entry = scene.revealState!.allDice.find(d => d.playerId === playerId);
        return entry ? isDieMatchingBid(entry.dice[dieIdx]) : false;
      }).length
    : 0;

  return (
    <div
      ref={boardRef}
      className="relative"
      style={{ width: '450px', height: '450px', flexShrink: 0 }}
    >
      {/* Palifico badge */}
      {scene.palificoMode.active && (
        <div
          ref={palificoBadgeRef}
          className="absolute z-30 top-2 right-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg"
          style={{ pointerEvents: 'none' }}
        >
          PALIFICO
        </div>
      )}

      {/* Base circle */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: '#F5F5F5',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #E0E0E0',
        }}
      />

      {/* Player sectors */}
      {SECTOR_ANGLES.map((startAngle, sectorIdx) => {
        const player = sectorPlayer[sectorIdx];
        const isCurrentPlayer = sectorIdx === scene.currentPlayerIdx;
        const hexColor = player?.color ?? '#9CA3AF';
        const endAngle = startAngle + 60;
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;
        const largeArc = 0;
        const opacity = player?.isEliminated ? 0.12 : 1;

        const x1 = Math.cos(startRad) * innerRadius;
        const y1 = Math.sin(startRad) * innerRadius;
        const x2 = Math.cos(startRad) * ringRadius;
        const y2 = Math.sin(startRad) * ringRadius;
        const x3 = Math.cos(endRad) * ringRadius;
        const y3 = Math.sin(endRad) * ringRadius;
        const x4 = Math.cos(endRad) * innerRadius;
        const y4 = Math.sin(endRad) * innerRadius;

        const x5 = Math.cos(startRad) * ringRadius;
        const y5 = Math.sin(startRad) * ringRadius;
        const x6 = Math.cos(startRad) * outerRadius;
        const y6 = Math.sin(startRad) * outerRadius;
        const x7 = Math.cos(endRad) * outerRadius;
        const y7 = Math.sin(endRad) * outerRadius;
        const x8 = Math.cos(endRad) * ringRadius;
        const y8 = Math.sin(endRad) * ringRadius;

        return (
          <svg
            key={`sector-${sectorIdx}`}
            className="absolute"
            style={{
              width: '450px', height: '450px',
              left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1, overflow: 'visible',
              opacity,
            }}
          >
            <path
              d={`M ${225 + x1} ${225 + y1} L ${225 + x2} ${225 + y2} A ${ringRadius} ${ringRadius} 0 ${largeArc} 1 ${225 + x3} ${225 + y3} L ${225 + x4} ${225 + y4} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${225 + x1} ${225 + y1} Z`}
              fill={hexColor}
              fillOpacity={isCurrentPlayer ? 0.65 : 0.15}
              stroke={isCurrentPlayer ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.06)'}
              strokeWidth={isCurrentPlayer ? '2' : '0.5'}
            />
            <path
              d={`M ${225 + x5} ${225 + y5} L ${225 + x6} ${225 + y6} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${225 + x7} ${225 + y7} L ${225 + x8} ${225 + y8} A ${ringRadius} ${ringRadius} 0 ${largeArc} 0 ${225 + x5} ${225 + y5} Z`}
              fill={hexColor}
              fillOpacity={0.75}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="0.5"
            />
          </svg>
        );
      })}

      {/* Dividing lines */}
      {[false, true].map(renderActive =>
        SECTOR_ANGLES.map((angle, idx) => {
          const startX = Math.cos((angle * Math.PI) / 180) * innerRadius;
          const startY = Math.sin((angle * Math.PI) / 180) * innerRadius;
          const endX = Math.cos((angle * Math.PI) / 180) * outerRadius;
          const endY = Math.sin((angle * Math.PI) / 180) * outerRadius;
          const isActiveLine = idx === scene.currentPlayerIdx || idx === (scene.currentPlayerIdx + 1) % 6;
          if (isActiveLine !== renderActive) return null;
          const gradientId = `tut-line-grad-${idx}`;

          return (
            <svg
              key={`line-${renderActive ? 'a' : 'i'}-${idx}`}
              className="absolute"
              style={{
                width: '450px', height: '450px',
                left: '50%', top: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: renderActive ? 3 : 2,
                overflow: 'visible',
              }}
            >
              {isActiveLine && (
                <defs>
                  <linearGradient
                    id={gradientId} gradientUnits="userSpaceOnUse"
                    x1={225 + startX} y1={225 + startY}
                    x2={225 + endX} y2={225 + endY}
                  >
                    <stop offset="0%" stopColor="white" stopOpacity="1" />
                    <stop offset="15%" stopColor={currentPlayerColor} stopOpacity="1" />
                    <stop offset="65%" stopColor={currentPlayerColor} stopOpacity="1" />
                    <stop offset="100%" stopColor={darkenHex(currentPlayerColor, 65)} stopOpacity="1" />
                  </linearGradient>
                </defs>
              )}
              <line
                x1={225 + startX} y1={225 + startY}
                x2={225 + endX} y2={225 + endY}
                stroke={isActiveLine ? `url(#${gradientId})` : 'rgba(255,255,255,0.33)'}
                strokeWidth="12"
                strokeLinecap="round"
              />
            </svg>
          );
        })
      )}

      {/* ── Dice rendering — two-pass (glow halos then faces) ─────────────────
          Pass 1: glow halos for matching revealed dice (drawn beneath all faces) */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 4 }}>
        {(revealPhase === 'revealing' || revealPhase === 'done') && scene.revealState &&
          sectorPlayer.map((player, sectorIdx) => {
            if (!player) return null;
            const revealData = scene.revealState!.allDice.find(rd => rd.playerId === player.id);
            if (!revealData) return null;

            const startAngle = SECTOR_ANGLES[sectorIdx];
            // Sort dice by value ascending (low to high) — same order as faces pass
            const sorted = revealData.dice
              .map((v, i) => ({ v, i }))
              .sort((a, b) => a.v - b.v);
            const diceSpacing = 60 / (sorted.length + 1);

            return sorted.map(({ v, i: originalIdx }, visualIdx) => {
              if (!isRevealed(player.id, originalIdx)) return null;
              if (!isDieMatchingBid(v)) return null;
              const angleInSector = startAngle + (visualIdx + 1) * diceSpacing;
              const angleRad = (angleInSector * Math.PI) / 180;
              const x = Math.cos(angleRad) * 200;
              const y = Math.sin(angleRad) * 200;
              return (
                <div
                  key={`glow-${player.id}-${originalIdx}`}
                  className="absolute w-7 h-7 rounded die-matching-glow"
                  style={{
                    left: '50%', top: '50%',
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${angleInSector - 90}deg)`,
                    pointerEvents: 'none',
                  }}
                />
              );
            });
          })
        }
      </div>

      {/* Invisible reference element for the human sector spotlight.
          Positioned to cover all dice that can appear in sector 3 (angles 60°–120°,
          radius ~200 from the board centre at 225,225). Board is always 450×450. */}
      <div
        ref={sectorYouRef}
        className="absolute pointer-events-none"
        style={{
          // Covers the bounding box of all dice in sector 3 (1–5 dice)
          // Leftmost die centre: cos(110°)*200+225 ≈ 157px, rightmost: cos(70°)*200+225 ≈ 293px
          // Topmost die centre: sin(70°)*200+225 ≈ 413px,  bottommost: sin(90°)*200+225 = 425px
          // Add half-die (14px) + 8px breathing room on each edge
          left:   '133px',   // 157 - 14 - 10
          top:    '399px',   // 413 - 14 = 399
          width:  '184px',   // (293 - 157) + 28 + 20 = 184
          height:  '42px',   // (425 - 413) + 28 + 6  = 46 → 42 is snug
        }}
      />

      {/* Pass 2: die faces */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 5 }}>
        {SECTOR_ANGLES.map((startAngle, sectorIdx) => {
          const player = sectorPlayer[sectorIdx];
          if (!player || player.isEliminated) return null;

          const duringReveal = (revealPhase === 'revealing' || revealPhase === 'done') && !!scene.revealState;
          const revealData = duringReveal
            ? scene.revealState!.allDice.find(rd => rd.playerId === player.id)
            : null;

          // Build display entries — sorted by value descending (high to low) during reveal
          type DieEntry = { value: number | null; originalIdx: number };
          const entries: DieEntry[] = (() => {
            if (duringReveal && revealData) {
              return revealData.dice
                .map((v, i) => ({ v, i }))
                .sort((a, b) => a.v - b.v)
                .map(({ v, i }) => ({ value: isRevealed(player.id, i) ? v : null, originalIdx: i }));
            }
            if (player.dice.length > 0) {
              // Sort low → high to match real GameBoard display
              return player.dice
                .map((v, i) => ({ v, i }))
                .sort((a, b) => a.v - b.v)
                .map(({ v, i }) => ({ value: v, originalIdx: i }));
            }
            return Array.from({ length: player.diceCount }, (_, i) => ({ value: null, originalIdx: i }));
          })();

          if (entries.length === 0) return null;
          const diceSpacing = 60 / (entries.length + 1);

          return entries.map(({ value }, visualIdx) => {
            const angleInSector = startAngle + (visualIdx + 1) * diceSpacing;
            const angleRad = (angleInSector * Math.PI) / 180;
            const x = Math.cos(angleRad) * 200;
            const y = Math.sin(angleRad) * 200;
            const rotationAngle = angleInSector - 90;

            // Reveal animation classes (same as real game)
            const isRevealedDie = duringReveal && revealData && value !== null;
            const isMatchingDie = isRevealedDie && isDieMatchingBid(value as number);
            const animClass = isRevealedDie
              ? (isMatchingDie ? 'animate-reveal-match' : 'animate-reveal')
              : '';

            return (
              <div
                key={`die-${sectorIdx}-${visualIdx}`}
                className="absolute"
                style={{
                  left: '50%', top: '50%',
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${rotationAngle}deg)`,
                }}
              >
                <div className={`flex items-center justify-center ${animClass}`}>
                  <div
                    className="w-7 h-7 bg-white border border-border-medium rounded flex items-center justify-center shadow-sm"
                    style={{
                      opacity: duringReveal && revealData && value === null ? 0.3 : 1,
                      transition: 'opacity 0.2s ease',
                    }}
                  >
                    {value !== null ? (
                      <DiceFace value={value} size="sm" />
                    ) : (
                      <span className="text-xs font-bold" style={{ color: player.color }}>?</span>
                    )}
                  </div>
                </div>
              </div>
            );
          });
        })}
      </div>

      {/* Bid chip */}
      {scene.currentBid && bidSectorIdx >= 0 && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
          <div
            ref={bidChipRef}
            className="absolute"
            style={{
              left: '50%', top: '50%',
              transform: `translate(calc(-50% + ${bidChipX}px), calc(-50% + ${bidChipY}px))`,
              transition: 'transform 0.4s ease, opacity 0.35s ease',
              opacity: chipOpacity,
            }}
          >
            <div className="flex flex-col items-center justify-center gap-0.5">
              <div className="w-7 h-7 bg-white rounded flex items-center justify-center shadow-sm flex-shrink-0">
                <DiceFace value={scene.currentBid.faceValue} size="sm" />
              </div>
              <div
                className="text-sm font-bold text-white leading-none"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
              >
                ×{scene.currentBid.quantity}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Centre circle — outer ring uses player colour at 35% opacity, matching real game */}
      <div
        ref={centerCircleRef}
        className="absolute flex items-center justify-center"
        style={{
          width: '140px', height: '140px',
          left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 20,
          borderRadius: '50%',
          background: hexToRgba(currentPlayerColor, 0.35),
        }}
      >
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: '120px', height: '120px',
            background: currentPlayerColor,
            transition: 'background 0.4s ease',
          }}
        >
          <div className="text-center flex flex-col items-center justify-center w-full px-2 gap-0 select-none">
            {(revealPhase === 'revealing' || revealPhase === 'done') && scene.revealState ? (
              // Reveal animation: die face + qty + FOUND + count (matches real GameBoard)
              <>
                <div className="flex items-center gap-1 mb-0.5">
                  <div className="w-5 h-5 bg-white rounded flex items-center justify-center shadow-sm">
                    <DiceFace value={scene.revealState.challengedBid.faceValue} size="sm" />
                  </div>
                  <span className="text-sm font-bold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                    ×{scene.revealState.challengedBid.quantity}
                  </span>
                </div>
                <div className="text-[9px] font-semibold text-white/70 uppercase tracking-wider">FOUND</div>
                <div
                  className="text-2xl font-bold text-white leading-tight"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
                >
                  {matchCount}
                </div>
              </>
            ) : scene.currentBid && scene.innerCircleText === 'DUDO!' ? (
              // Dudo call: show the challenged bid + DUDO label (matches real GameBoard challenge moment)
              <>
                <div className="flex items-center gap-1 mb-0.5">
                  <div className="w-5 h-5 bg-white rounded flex items-center justify-center shadow-sm">
                    <DiceFace value={scene.currentBid.faceValue} size="sm" />
                  </div>
                  <span className="text-sm font-bold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                    ×{scene.currentBid.quantity}
                  </span>
                </div>
                <div className="text-sm font-bold text-white uppercase tracking-wide" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                  DUDO!
                </div>
              </>
            ) : (
              <div
                className="text-xl font-bold text-white leading-tight"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
              >
                {scene.innerCircleText ?? sectorPlayer[scene.currentPlayerIdx]?.name ?? ''}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
