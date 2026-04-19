export type InteractionKind = 'click-dudo' | 'click-calza' | 'submit-bid';

export type SpotlightTarget =
  | 'board'
  | 'sector-you'
  | 'center-circle'
  | 'bid-chip'
  | 'bid-input'
  | 'bid-input-dudo'
  | 'bid-input-calza'
  | 'palifico-badge'
  | 'full-screen';

export type CalloutSide = 'above' | 'below' | 'left' | 'right';

export interface TutorialStep {
  id: string;
  titleKey: string;
  bodyKey: string;
  type: 'passive' | 'interactive';
  interaction?: InteractionKind;
  spotlight: SpotlightTarget;
  calloutSide: CalloutSide;
  calloutTopRight?: boolean;
  calloutTopLeft?: boolean;
  sceneKey: string;
  autoReveal?: boolean;
  showBidInput?: boolean;
  calzaEnabled?: boolean;
  /** When set, BidInput locks all other face values (enforced via palificoMode). */
  lockedBidFaceValue?: number;
}

export const TUTORIAL_STEPS: TutorialStep[] = [

  // ── Step 1: Welcome ────────────────────────────────────────────────────────
  {
    id: 'welcome',
    titleKey: 'tutorial.welcome.title',
    bodyKey: 'tutorial.welcome.body',
    type: 'passive',
    spotlight: 'full-screen',
    calloutSide: 'right',
    sceneKey: 'board-intro',
    showBidInput: true,
  },

  // ── Step 2: Your Dice ──────────────────────────────────────────────────────
  {
    id: 'your-dice',
    titleKey: 'tutorial.yourDice.title',
    bodyKey: 'tutorial.yourDice.body',
    type: 'passive',
    spotlight: 'sector-you',
    calloutSide: 'above',
    sceneKey: 'board-intro',
    showBidInput: true,
  },

  // ── Step 3: Dice count badge — probability intro (highlights top-right badge)
  {
    id: 'dice-count',
    titleKey: 'tutorial.diceCount.title',
    bodyKey: 'tutorial.diceCount.body',
    type: 'passive',
    spotlight: 'full-screen',
    calloutSide: 'right',
    calloutTopLeft: true,
    sceneKey: 'board-intro',
  },

  // ── Step 4: Centre circle ─────────────────────────────────────────────────
  {
    id: 'center-circle',
    titleKey: 'tutorial.centerCircle.title',
    bodyKey: 'tutorial.centerCircle.body',
    type: 'passive',
    spotlight: 'center-circle',
    calloutSide: 'right',
    calloutTopLeft: true,
    sceneKey: 'center-scene',
  },

  // ── Step 5: Priya opens 2×4 — AUTO-ADVANCE ────────────────────────────────
  {
    id: 'priya-bid-r1',
    titleKey: 'tutorial.kaiBids.title',
    bodyKey: 'tutorial.kaiBids.body',
    type: 'passive',
    spotlight: 'full-screen',
    calloutSide: 'right',
    calloutTopLeft: true,
    sceneKey: 'priya-bid-r1',
    showBidInput: true,
  },

  // ── Step 6: Marco raises 3×4 — AUTO-ADVANCE ───────────────────────────────
  {
    id: 'marco-bid-r1',
    titleKey: 'tutorial.priyaBids.title',
    bodyKey: 'tutorial.priyaBids.body',
    type: 'passive',
    spotlight: 'full-screen',
    calloutSide: 'left',
    calloutTopRight: true,
    sceneKey: 'marco-bid-r1',
    showBidInput: true,
  },

  // ── Step 7: YOUR TURN — interactive bid (face locked to 4) ────────────────
  {
    id: 'raise-bid',
    titleKey: 'tutorial.raiseBid.title',
    bodyKey: 'tutorial.raiseBid.body',
    type: 'interactive',
    interaction: 'submit-bid',
    spotlight: 'full-screen',
    calloutSide: 'right',
    calloutTopLeft: true,
    sceneKey: 'marco-bid-r1',
    showBidInput: true,
    lockedBidFaceValue: 4,
  },

  // ── Step 8: Sofia raises to 5×4 — AUTO-ADVANCE ────────────────────────────
  {
    id: 'sofia-bid-r1',
    titleKey: 'tutorial.sofiaBids.title',
    bodyKey: 'tutorial.sofiaBids.body',
    type: 'passive',
    spotlight: 'full-screen',
    calloutSide: 'left',
    calloutTopRight: true,
    sceneKey: 'sofia-bid-r1',
    showBidInput: true,
  },

  // ── Step 9: Lena pushes to 6×4 — AUTO-ADVANCE ─────────────────────────────
  {
    id: 'lena-bid-r1',
    titleKey: 'tutorial.lenaBidsR1.title',
    bodyKey: 'tutorial.lenaBidsR1.body',
    type: 'passive',
    spotlight: 'full-screen',
    calloutSide: 'right',
    calloutTopLeft: true,
    sceneKey: 'lena-bid-r1',
    showBidInput: true,
  },

  // ── Step 10: Kai calls Dudo — AUTO-ADVANCE ────────────────────────────────
  // Dudo button appears pressed/red via useEffect in TutorialScreen.
  {
    id: 'kai-dudo-r1',
    titleKey: 'tutorial.kaiDudoR1.title',
    bodyKey: 'tutorial.kaiDudoR1.body',
    type: 'passive',
    spotlight: 'full-screen',
    calloutSide: 'right',
    calloutTopLeft: true,
    sceneKey: 'kai-dudo-r1',
    showBidInput: true,
  },

  // ── Step 11: Reveal — dice flip face-up ───────────────────────────────────
  {
    id: 'reveal-r1',
    titleKey: 'tutorial.revealR1.title',
    bodyKey: 'tutorial.revealR1.body',
    type: 'passive',
    spotlight: 'full-screen',
    calloutSide: 'right',
    calloutTopRight: true,
    sceneKey: 'reveal-r1',
    autoReveal: true,
  },

  // ── Step 12: Round 1 result ────────────────────────────────────────────────
  {
    id: 'round-result-r1',
    titleKey: 'tutorial.roundResultR1.title',
    bodyKey: 'tutorial.roundResultR1.body',
    type: 'passive',
    spotlight: 'full-screen',
    calloutSide: 'right',
    sceneKey: 'result-r1',
  },

  // ── Step 13: Lena opens Round 2 (2×6) — AUTO-ADVANCE ─────────────────────
  {
    id: 'lena-opens-r2',
    titleKey: 'tutorial.lenaOpensR2.title',
    bodyKey: 'tutorial.lenaOpensR2.body',
    type: 'passive',
    spotlight: 'full-screen',
    calloutSide: 'right',
    calloutTopRight: true,
    sceneKey: 'lena-opens-r2',
    showBidInput: true,
  },

  // ── Step 14: Kai raises to 3×6 — AUTO-ADVANCE ────────────────────────────
  {
    id: 'kai-bids-r2',
    titleKey: 'tutorial.lenaBidsR2.title',
    bodyKey: 'tutorial.lenaBidsR2.body',
    type: 'passive',
    spotlight: 'full-screen',
    calloutSide: 'right',
    calloutTopLeft: true,
    sceneKey: 'kai-bid-r2',
    showBidInput: true,
  },

  // ── Step 15: Priya raises to 4×6 — AUTO-ADVANCE ──────────────────────────
  {
    id: 'priya-bids-r2',
    titleKey: 'tutorial.kaiBidsR2.title',
    bodyKey: 'tutorial.kaiBidsR2.body',
    type: 'passive',
    spotlight: 'full-screen',
    calloutSide: 'right',
    calloutTopLeft: true,
    sceneKey: 'priya-bid-r2',
    showBidInput: true,
  },

  // ── Step 16: Marco switches to ones (3×1) — Next button so player can read ─
  {
    id: 'marco-bids-ones',
    titleKey: 'tutorial.marcoBidsR2.title',
    bodyKey: 'tutorial.marcoBidsR2.body',
    type: 'passive',
    spotlight: 'full-screen',
    calloutSide: 'right',
    calloutTopLeft: true,
    sceneKey: 'marco-bid-ones',
    showBidInput: true,
  },

  // ── Step 17: YOUR TURN — bid ones (interactive). Face=1 locked: non-1 faces ─
  // greyed out via palificoMode { active:true, lockedFaceValue:1 } in TutorialScreen.
  // BidInput.canBidOnes is fixed so face=1 stays enabled while 2-6 are disabled.
  {
    id: 'ones-wildcard',
    titleKey: 'tutorial.onesWild.title',
    bodyKey: 'tutorial.onesWild.body',
    type: 'interactive',
    interaction: 'submit-bid',
    spotlight: 'full-screen',
    calloutSide: 'right',
    calloutTopLeft: true,
    sceneKey: 'marco-bid-ones',
    showBidInput: true,
    lockedBidFaceValue: 1,
  },

  // ── Step 18: Sofia calls Dudo on your bid (WRONG) — AUTO-ADVANCE ─────────
  // Dudo button appears pressed/red via useEffect in TutorialScreen.
  {
    id: 'sofia-dudo-wrong',
    titleKey: 'tutorial.lenaDudoWrong.title',
    bodyKey: 'tutorial.lenaDudoWrong.body',
    type: 'passive',
    spotlight: 'full-screen',
    calloutSide: 'right',
    calloutTopRight: true,
    sceneKey: 'sofia-dudo-wrong',
    showBidInput: true,
  },

  // ── Step 19: R2 reveal — Sofia wrong, player wins ────────────────────────
  {
    id: 'reveal-r2',
    titleKey: 'tutorial.r2Reveal.title',
    bodyKey: 'tutorial.r2Reveal.body',
    type: 'passive',
    spotlight: 'full-screen',
    calloutSide: 'right',
    calloutTopRight: true,
    sceneKey: 'reveal-r2',
    autoReveal: true,
    showBidInput: true,
  },

  // ── Step 20: R2 result ────────────────────────────────────────────────────
  {
    id: 'r2-result',
    titleKey: 'tutorial.r2Result.title',
    bodyKey: 'tutorial.r2Result.body',
    type: 'passive',
    spotlight: 'full-screen',
    calloutSide: 'right',
    sceneKey: 'r2-result',
    showBidInput: true,
  },

  // ── Step 22: Sofia opens Round 3 (5×3) ───────────────────────────────────
  {
    id: 'sofia-opens-r3',
    titleKey: 'tutorial.r3LenaBids.title',
    bodyKey: 'tutorial.r3LenaBids.body',
    type: 'passive',
    spotlight: 'full-screen',
    calloutSide: 'right',
    calloutTopLeft: true,
    sceneKey: 'sofia-opens-r3',
    showBidInput: true,
  },

  // ── Step 23: Lena raises to 10×3 ─────────────────────────────────────────
  {
    id: 'lena-bids-r3',
    titleKey: 'tutorial.lenaBidsR3.title',
    bodyKey: 'tutorial.lenaBidsR3.body',
    type: 'passive',
    spotlight: 'full-screen',
    calloutSide: 'right',
    calloutTopRight: true,
    sceneKey: 'lena-bids-r3',
    showBidInput: true,
  },

  // ── Step 24: Kai raises to 11×3 ──────────────────────────────────────────
  {
    id: 'kai-bids-r3',
    titleKey: 'tutorial.kaiBidsR3.title',
    bodyKey: 'tutorial.kaiBidsR3.body',
    type: 'passive',
    spotlight: 'full-screen',
    calloutSide: 'right',
    calloutTopLeft: true,
    sceneKey: 'kai-bids-r3',
    showBidInput: true,
  },

  // ── Step 25: Priya raises to 12×3 ────────────────────────────────────────
  {
    id: 'priya-bids-r3',
    titleKey: 'tutorial.priyaBidsR3.title',
    bodyKey: 'tutorial.priyaBidsR3.body',
    type: 'passive',
    spotlight: 'full-screen',
    calloutSide: 'left',
    calloutTopRight: true,
    sceneKey: 'priya-bids-r3',
    showBidInput: true,
  },

  // ── Step 26: Marco's bold 14×3 claim ─────────────────────────────────────
  {
    id: 'marco-bids-r3',
    titleKey: 'tutorial.r3MarcoDudo.title',
    bodyKey: 'tutorial.r3MarcoDudo.body',
    type: 'passive',
    spotlight: 'full-screen',
    calloutSide: 'right',
    calloutTopLeft: true,
    sceneKey: 'marco-bids-r3',
    showBidInput: true,
  },

  // ── Step 27: YOUR TURN — interactive Dudo call ────────────────────────────
  {
    id: 'call-dudo-r3',
    titleKey: 'tutorial.callDudoR3.title',
    bodyKey: 'tutorial.callDudoR3.body',
    type: 'interactive',
    interaction: 'click-dudo',
    spotlight: 'full-screen',
    calloutSide: 'right',
    calloutTopLeft: true,
    sceneKey: 'marco-bids-r3',
    showBidInput: true,
  },

  // ── Step 26: Reveal R3 — autoReveal, only 3 threes ────────────────────────
  {
    id: 'reveal-r3',
    titleKey: 'tutorial.r3Reveal.title',
    bodyKey: 'tutorial.r3Reveal.body',
    type: 'passive',
    spotlight: 'full-screen',
    calloutSide: 'right',
    calloutTopRight: true,
    sceneKey: 'reveal-r3',
    autoReveal: true,
  },

  // ── Step 27: R3 result — Marco loses a die ────────────────────────────────
  {
    id: 'r3-result',
    titleKey: 'tutorial.roundResultR3.title',
    bodyKey: 'tutorial.roundResultR3.body',
    type: 'passive',
    spotlight: 'full-screen',
    calloutSide: 'right',
    sceneKey: 'result-r3',
  },

  // ── Step 28: Tutorial complete ────────────────────────────────────────────
  {
    id: 'game-over',
    titleKey: 'tutorial.gameOver.title',
    bodyKey: 'tutorial.gameOver.body',
    type: 'passive',
    spotlight: 'full-screen',
    calloutSide: 'right',
    sceneKey: 'game-over',
  },
];

export const TOTAL_STEPS = TUTORIAL_STEPS.length;
