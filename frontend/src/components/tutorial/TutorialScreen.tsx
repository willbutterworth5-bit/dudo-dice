import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TutorialBoard from './TutorialBoard';
import TutorialSpotlight from './TutorialSpotlight';
import TutorialCallout from './TutorialCallout';
import BidInput from '../BidInput';
import DiceFace from '../DiceFace';
import { TUTORIAL_STEPS, TOTAL_STEPS } from './tutorialSteps';
import { TUTORIAL_SCENES, SCENE_ROUND_LOGS } from './tutorialScenes';
import type { TutorialScene, TutorialBid } from './tutorialScenes';
import type { InteractionKind } from './tutorialSteps';
import type { Bid } from '../../game/GameState';

// ─── State machine ────────────────────────────────────────────────────────────

type RevealPhase = 'hidden' | 'revealing' | 'done';

interface TutorialState {
  stepIndex: number;
  scenePatch: { currentBid?: TutorialBid } | null;
  revealPhase: RevealPhase;
  stepError: string | null;
}

type Action =
  | { type: 'NEXT_STEP' }
  | { type: 'PATCH_BID'; bid: TutorialBid }
  | { type: 'SET_REVEAL_PHASE'; phase: RevealPhase }
  | { type: 'SET_ERROR'; msg: string | null };

function reducer(state: TutorialState, action: Action): TutorialState {
  switch (action.type) {
    case 'NEXT_STEP':
      return {
        stepIndex: Math.min(state.stepIndex + 1, TOTAL_STEPS - 1),
        scenePatch: null,
        revealPhase: 'hidden',
        stepError: null,
      };
    case 'PATCH_BID':
      return { ...state, scenePatch: { currentBid: action.bid }, stepError: null };
    case 'SET_REVEAL_PHASE':
      return { ...state, revealPhase: action.phase };
    case 'SET_ERROR':
      return { ...state, stepError: action.msg };
    default:
      return state;
  }
}

// ─── Player name labels for the legend ───────────────────────────────────────
const PLAYER_ORDER = ['kai', 'priya', 'marco', 'you', 'sofia', 'lena'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function TutorialScreen() {
  const navigate = useNavigate();

  const [state, dispatch] = useReducer(reducer, {
    stepIndex: 0,
    scenePatch: null,
    revealPhase: 'hidden',
    stepError: null,
  });

  const [showDiceBreakdown, setShowDiceBreakdown] = useState(false);
  const [showGameLog, setShowGameLog] = useState(false);

  const { stepIndex, scenePatch, revealPhase, stepError } = state;
  const step = TUTORIAL_STEPS[stepIndex];

  // Board scale to fit viewport
  const [boardScale, setBoardScale] = useState(1);
  useEffect(() => {
    const update = () => {
      const maxW = window.innerWidth - 32;
      const maxH = window.innerHeight - 240; // leave room for callout + header
      setBoardScale(Math.min(1, maxW / 450, maxH / 450));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ─── Refs for spotlight measurement ───────────────────────────────────────
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const centerCircleRef   = useRef<HTMLDivElement>(null);
  const palificoBadgeRef  = useRef<HTMLDivElement>(null);
  const sectorYouRef      = useRef<HTMLDivElement>(null);
  const bidChipRef        = useRef<HTMLDivElement>(null);
  const bidInputRef       = useRef<HTMLDivElement>(null);

  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  const measureSpotlight = useCallback(() => {
    const target = step.spotlight;

    const measure = (el: Element | null | undefined, extraPad = 0): DOMRect | null => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (extraPad === 0) return r;
      return new DOMRect(
        r.left - extraPad,
        r.top - extraPad,
        r.width + extraPad * 2,
        r.height + extraPad * 2,
      );
    };

    let rect: DOMRect | null = null;

    switch (target) {
      case 'board':
        rect = measure(boardContainerRef.current);
        break;
      case 'sector-you':
        rect = measure(sectorYouRef.current, 50);
        break;
      case 'center-circle':
        rect = measure(centerCircleRef.current, 8);
        break;
      case 'bid-chip':
        rect = measure(bidChipRef.current, 12);
        break;
      case 'bid-input':
        rect = measure(bidInputRef.current, 6);
        break;
      case 'bid-input-dudo': {
        const btn = bidInputRef.current?.querySelector<HTMLElement>('.btn-3d-danger');
        rect = measure(btn, 6);
        break;
      }
      case 'bid-input-calza': {
        const btn = bidInputRef.current?.querySelector<HTMLElement>('.btn-3d-calza');
        rect = measure(btn, 6);
        break;
      }
      case 'palifico-badge':
        rect = measure(palificoBadgeRef.current, 6);
        break;
      case 'full-screen':
      default:
        rect = null;
    }

    setSpotlightRect(rect);
  }, [step.spotlight]);

  // Measure after each step change (double-rAF so DOM has settled)
  useEffect(() => {
    let raf1: number, raf2: number;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(measureSpotlight);
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [stepIndex, measureSpotlight]);

  // Re-measure on resize
  useEffect(() => {
    window.addEventListener('resize', measureSpotlight);
    return () => window.removeEventListener('resize', measureSpotlight);
  }, [measureSpotlight]);

  // ─── Reveal animation (no auto-advance — user clicks Next) ───────────────
  useEffect(() => {
    if (!step.autoReveal || !baseScene.revealState) return;
    dispatch({ type: 'SET_REVEAL_PHASE', phase: 'revealing' });
    const t = setTimeout(() => dispatch({ type: 'SET_REVEAL_PHASE', phase: 'done' }), 11000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  // ─── Dudo button pressed appearance for scripted computer Dudo steps ────────
  useEffect(() => {
    const dudoSteps = ['kai-dudo-r1', 'sofia-dudo-wrong'];
    const btn = bidInputRef.current?.querySelector<HTMLElement>('.btn-3d-danger');
    if (btn) {
      if (dudoSteps.includes(step.id)) {
        btn.style.transform = 'translateY(2px)';
        btn.style.boxShadow = '0 1px 0 #7f1d1d';
        btn.style.filter = 'brightness(0.8)';
      } else {
        btn.style.transform = '';
        btn.style.boxShadow = '';
        btn.style.filter = '';
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  // ─── Interaction handler ───────────────────────────────────────────────────
  const handleInteraction = useCallback((kind: InteractionKind, payload?: TutorialBid) => {
    if (step.type !== 'interactive' || step.interaction !== kind) return;

    if (kind === 'submit-bid' && payload) {
      dispatch({ type: 'PATCH_BID', bid: payload });
      setTimeout(() => dispatch({ type: 'NEXT_STEP' }), 700);
    } else {
      dispatch({ type: 'NEXT_STEP' });
    }
  }, [step]);

  // BidInput callbacks
  const onBid = useCallback((bid: Bid) => {
    handleInteraction('submit-bid', { quantity: bid.quantity, faceValue: bid.faceValue, playerId: bid.playerId });
  }, [handleInteraction]);

  const onChallenge = useCallback(() => {
    handleInteraction('click-dudo');
  }, [handleInteraction]);

  const onCalza = useCallback(() => {
    handleInteraction('click-calza');
  }, [handleInteraction]);

  // ─── Current scene (with optional patch) ─────────────────────────────────
  const baseScene: TutorialScene = TUTORIAL_SCENES[step.sceneKey] ?? TUTORIAL_SCENES['board-intro'];
  const scene: TutorialScene = scenePatch?.currentBid
    ? { ...baseScene, currentBid: scenePatch.currentBid }
    : baseScene;

  // BidInput needs a Bid | null (currentBid) — convert from TutorialBid
  const bidForInput = scene.currentBid
    ? { quantity: scene.currentBid.quantity, faceValue: scene.currentBid.faceValue, playerId: scene.currentBid.playerId }
    : null;

  // If the step locks a specific face value, override palificoMode so BidInput greys
  // out all other face-value buttons. BidInput.canBidOnes is fixed to allow face=1
  // even when palificoMode.active=true (when lockedFaceValue===1).
  const palificoForInput = step.lockedBidFaceValue != null
    ? { active: true, lockedFaceValue: step.lockedBidFaceValue }
    : { active: scene.palificoMode.active, lockedFaceValue: scene.palificoMode.lockedFaceValue };

  // ─── Dice count totals for the header badge ────────────────────────────────
  const totalDice = scene.players.reduce((sum, p) => sum + p.diceCount, 0);

  // ─── Game log bids for the current scene ──────────────────────────────────
  const roundLog: TutorialBid[] = SCENE_ROUND_LOGS[step.sceneKey] ?? [];

  // ─── Navigation ───────────────────────────────────────────────────────────
  const handleSkip = () => navigate('/');
  const handlePlayNow = () => navigate('/play');
  const handleNext = () => dispatch({ type: 'NEXT_STEP' });

  // ─── Render ───────────────────────────────────────────────────────────────
  const showBidInput = step.showBidInput && stepIndex < TOTAL_STEPS - 1;

  return (
    <div className="min-h-dvh flex flex-col overflow-hidden">

      {/* ── Top-right header: dice count + game log (matching GameBoard) ───── */}
      <div className="fixed z-50 flex items-center gap-1 sm:gap-1.5"
           style={{ right: 'max(0.75rem, env(safe-area-inset-right, 0px))', top: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}>

        {/* Dice count */}
        <div className="relative">
          <button
            onClick={() => { setShowDiceBreakdown(v => !v); setShowGameLog(false); }}
            className="h-10 sm:h-8 text-white px-2.5 sm:px-2 rounded-xl flex items-center gap-1 shadow-md bg-gradient-to-br from-indigo-700 to-purple-900 min-w-[3rem] justify-center"
          >
            <span className="text-xs">🎲</span>
            <span className="font-bold text-xs sm:text-sm">x{totalDice}</span>
          </button>
          {showDiceBreakdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDiceBreakdown(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 bg-gradient-to-br from-indigo-700 to-purple-900 rounded-xl shadow-lg border border-white/20 p-2.5 min-w-[140px]">
                {scene.players.filter(p => p.diceCount > 0 && !p.isEliminated).map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-2 py-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                      <span className="text-white text-xs truncate">{p.name}</span>
                    </div>
                    <span className="text-white font-bold text-xs flex-shrink-0">{p.diceCount}</span>
                  </div>
                ))}
                <div className="border-t border-white/20 mt-1.5 pt-1.5 flex items-center justify-between">
                  <span className="text-white/70 text-xs">Total</span>
                  <span className="text-white font-bold text-xs">{totalDice}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Palifico badge (header version) */}
        {scene.palificoMode.active && (
          <div className="h-10 sm:h-8 text-white px-2 sm:px-2 rounded-xl text-xs font-semibold shadow-md bg-gradient-to-br from-amber-600 to-amber-800 flex items-center">
            <span className="hidden sm:inline">Palifico</span>
            <span className="sm:hidden">P!</span>
          </div>
        )}

        {/* Game log */}
        <div className="relative">
          <button
            onClick={() => { setShowGameLog(v => !v); setShowDiceBreakdown(false); }}
            className="h-10 sm:h-8 text-white px-2 sm:px-2 rounded-xl text-xs font-semibold shadow-md bg-gradient-to-br from-indigo-700 to-purple-900 flex items-center"
            title="Game Log"
          >
            📋
          </button>
          {showGameLog && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowGameLog(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 bg-gradient-to-br from-indigo-700 to-purple-900 rounded-xl shadow-lg border border-white/20 p-3 min-w-[180px]">
                <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">This Round</p>
                {roundLog.length === 0 ? (
                  <p className="text-white/50 text-xs italic">No bids yet</p>
                ) : (
                  roundLog.map((bid, i) => {
                    const player = scene.players.find(p => p.id === bid.playerId);
                    return (
                      <div key={i} className="flex items-center gap-2 py-1">
                        <div className="w-2 h-2 rounded-full flex-shrink-0"
                             style={{ backgroundColor: player?.color ?? '#6B7280' }} />
                        <span className="text-xs text-white/80 font-semibold truncate flex-1">
                          {player?.name ?? bid.playerId}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-xs font-bold text-white">{bid.quantity}×</span>
                          <div className="w-4 h-4 bg-white rounded flex items-center justify-center">
                            <DiceFace value={bid.faceValue} size="sm" />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Board — centred in a flex-1 area; z-10 so it's below the spotlight (z-40) */}
      <div className="flex-1 flex items-center justify-center relative z-10" style={{ minHeight: 0, overflow: 'visible' }}>
        <div
          style={{
            transform: `scale(${boardScale})`,
            transformOrigin: 'center center',
            flexShrink: 0,
          }}
        >
          <TutorialBoard
            scene={scene}
            revealPhase={revealPhase}
            boardRef={boardContainerRef}
            centerCircleRef={centerCircleRef}
            palificoBadgeRef={palificoBadgeRef}
            sectorYouRef={sectorYouRef}
            bidChipRef={bidChipRef}
          />
        </div>
      </div>

      {/* Player legend — coloured name chips, same as GameBoard; z-45 keeps it above spotlight */}
      <div className="px-3 flex-shrink-0 relative" style={{ zIndex: 45 }}>
        <div className="max-w-2xl mx-auto flex flex-wrap gap-1 mt-2 mb-1">
          {PLAYER_ORDER.map(id => {
            const player = scene.players.find(p => p.id === id);
            if (!player) return null;
            // currentPlayerIdx is a SECTOR index; look up which player is in that sector
            const currentPlayerSectorId = scene.players.find(p => PLAYER_ORDER.indexOf(p.id) === scene.currentPlayerIdx)?.id;
            const isCurrentTurn = id === (currentPlayerSectorId ?? '');
            const isEliminated = player.isEliminated && player.diceCount === 0;
            return (
              <div
                key={id}
                className="flex-1 min-w-0 rounded-lg flex items-center justify-center transition-all duration-300 shadow-md h-9 sm:h-7"
                style={{
                  background: `linear-gradient(to bottom right, ${player.color}, ${player.color}dd)`,
                  boxShadow: isCurrentTurn
                    ? `inset 0 0 0 2px white, 0 2px 4px rgba(0,0,0,0.25)`
                    : `0 2px 4px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)`,
                  opacity: isEliminated ? 0.4 : (isCurrentTurn ? 1 : 0.75),
                }}
              >
                <span
                  className="text-[9px] sm:text-[11px] font-bold text-white text-center truncate px-1 sm:px-2.5"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {player.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* BidInput section — always in natural flow at bottom, matching GameBoard layout.
          z-45 renders it above the spotlight overlay (z-40). */}
      <div className="px-3 pb-2 sm:pb-4 flex-shrink-0 relative" style={{ zIndex: 45 }}>
        <div
          ref={bidInputRef}
          className="max-w-2xl mx-auto min-h-[9.5rem] sm:min-h-[7.5rem] flex flex-col justify-end"
        >
          {showBidInput && (
            <BidInput
              currentBid={bidForInput}
              palificoMode={palificoForInput}
              playerId="you"
              onBid={onBid}
              onChallenge={onChallenge}
              calzaEnabled={step.calzaEnabled}
              onCalza={onCalza}
              disabled={false}
            />
          )}
        </div>
      </div>

      {/* Spotlight overlay */}
      <TutorialSpotlight
        targetRect={spotlightRect}
        padding={step.spotlight === 'sector-you' ? 0 : 16}
      />

      {/* Callout — anchored near the spotlight target */}
      <TutorialCallout
        step={step}
        stepIndex={stepIndex}
        targetRect={spotlightRect}
        onNext={handleNext}
        onSkip={handleSkip}
        onPlayNow={handlePlayNow}
        stepError={stepError}
      />
    </div>
  );
}
