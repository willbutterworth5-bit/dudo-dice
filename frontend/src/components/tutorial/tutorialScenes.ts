export interface TutorialPlayer {
  id: string;
  name: string;
  color: string;
  dice: number[];
  diceCount: number;
  isHuman: boolean;
  isEliminated: boolean;
}

export interface TutorialBid {
  quantity: number;
  faceValue: number;
  playerId: string;
}

export interface TutorialPalificoMode {
  active: boolean;
  lockedFaceValue: number | null;
}

export interface TutorialRevealState {
  allDice: { playerId: string; dice: number[] }[];
  challengedBid: TutorialBid;
  actualCount: number;
  winnerId: string;
  loserId: string;
}

export interface TutorialScene {
  players: TutorialPlayer[];
  currentBid: TutorialBid | null;
  currentPlayerIdx: number;
  palificoMode: TutorialPalificoMode;
  revealState: TutorialRevealState | null;
  innerCircleText?: string;
}

const noPalifico: TutorialPalificoMode = { active: false, lockedFaceValue: null };

const p = (
  id: string, name: string, color: string, dice: number[], isHuman = false, isEliminated = false,
): TutorialPlayer => ({ id, name, color, dice, diceCount: dice.length, isHuman, isEliminated });

const KAI   = 'kai';    // sector 0 — orange
const PRIYA = 'priya';  // sector 1 — green
const MARCO = 'marco';  // sector 2 — blue
const YOU   = 'you';    // sector 3 — red (human)
const SOFIA = 'sofia';  // sector 4 — yellow
const LENA  = 'lena';   // sector 5 — pink

// ────────────────────────────────────────────────────────────────────────────
// Round 1 — everyone starts with 5 dice.
//
// R1 actual 4s (bid face value = 4, ones are wild):
//   You  [4,4,6,2,3] → 2 fours
//   Sofia[1,3,6,4,2] → 1 four + 1 wild one → 2 effective
//   Lena [3,4,2,5,6] → 1 four
//   Total = 5 fours.  Lena bids 6×4 → 5 < 6 → Lena loses ✓
//
// Turn order: Priya(1) → Marco(2) → You(3) → Sofia(4) → Lena(5) → Kai(0) [calls Dudo]
// ────────────────────────────────────────────────────────────────────────────
// R1 actual 4s (face=4, ones wild):
//   Kai  [1,4,4,2,6] → wild+2 fours = 3
//   Priya[1,4,2,3,5] → wild+1 four  = 2
//   Marco[4,2,3,6,5] → 1 four       = 1
//   You  [4,4,6,2,3] → 2 fours      = 2
//   Sofia[4,2,6,3,5] → 1 four       = 1
//   Lena [2,3,5,6,3] → 0            = 0
//   Total = 9. Lena bids 10×4 → 9 < 10 → Lena loses ✓
const r1Players = (): TutorialPlayer[] => [
  p(KAI,   'Kai',   '#FF6600', [1, 4, 4, 2, 6]),
  p(PRIYA, 'Priya', '#00CC66', [1, 4, 2, 3, 5]),
  p(MARCO, 'Marco', '#0080FF', [4, 2, 3, 6, 5]),
  p(YOU,   'You',   '#FF3333', [4, 4, 6, 2, 3], true),
  p(SOFIA, 'Sofia', '#E6B800', [4, 2, 6, 3, 5]),
  p(LENA,  'Lena',  '#FF1493', [2, 3, 5, 6, 3]),
];

const hideOpponents = (players: TutorialPlayer[]): TutorialPlayer[] =>
  players.map(pl => pl.isHuman ? pl : { ...pl, dice: [] });

// ────────────────────────────────────────────────────────────────────────────
// Round 2 — Lena lost 1 die in R1 (5→4). Everyone else keeps 5.
//
// Clockwise from loser Lena(5): Lena→Kai(0)→Priya(1)→Marco(2)→You(3)→Sofia(4)
//
// R2 dice — every player has exactly one 1 (wild) and one 6.
// That gives 6 actual ones when bidding ones.
//
// R2 bid sequence:
//   Lena  bids 2×6
//   Kai   bids 3×6
//   Priya bids 4×6
//   Marco switches to ones: 3×1  (floor(4/2)+1 = 3)
//   You   bid ones (interactive) → 4×1
//   Sofia calls Dudo on your bid (WRONG — actual ones = 6 ≥ 4) → Sofia loses a die
// After R2: Sofia has 4 dice.
// ────────────────────────────────────────────────────────────────────────────

// Array index order: [Kai, Priya, Marco, You, Sofia, Lena]
const R2_COUNTS = [5, 5, 5, 5, 5, 4];

// ────────────────────────────────────────────────────────────────────────────
// Round 3 — Sofia lost a die in R2 (5→4). Lena still 4 (from R1). Others 5.
// Total: 28 dice. Bidding threes (face=3), ones wild.
//
// Turn order: Sofia(4) → Lena(5) → Kai(0) → Priya(1) → Marco(2) → You(3) call Dudo
// Actual threes: Sofia[3]=1, Kai[3+3]=2, Priya[1+3]=2, Marco[3]=1, You[3+3]=2, Lena[3]=1 → total 9
// Marco bids 14×3 → 9 < 14 → You win ✓. Marco drops to 4 dice.
// ────────────────────────────────────────────────────────────────────────────
const r3Players = (): TutorialPlayer[] => [
  p(KAI,   'Kai',   '#FF6600', [3, 3, 4, 6, 5]),
  p(PRIYA, 'Priya', '#00CC66', [1, 3, 2, 6, 4]),
  p(MARCO, 'Marco', '#0080FF', [3, 2, 6, 5, 4]),
  p(YOU,   'You',   '#FF3333', [3, 3, 4, 2, 6], true),
  p(SOFIA, 'Sofia', '#E6B800', [3, 2, 5, 4]),        // 4 dice (lost in R2)
  p(LENA,  'Lena',  '#FF1493', [3, 4, 6, 2]),         // 4 dice (lost in R1)
];

const r2Players = (): TutorialPlayer[] => [
  p(KAI,   'Kai',   '#FF6600', []),
  p(PRIYA, 'Priya', '#00CC66', []),
  p(MARCO, 'Marco', '#0080FF', []),
  p(YOU,   'You',   '#FF3333', [1, 3, 2, 4, 6], true),
  p(SOFIA, 'Sofia', '#E6B800', []),
  p(LENA,  'Lena',  '#FF1493', []),
].map((pl, i) => ({ ...pl, diceCount: R2_COUNTS[i] }));

export const TUTORIAL_SCENES: Record<string, TutorialScene> = {

  // ── Steps 1–2: Welcome & Your Dice ────────────────────────────────────────
  'board-intro': {
    players: hideOpponents(r1Players()),
    currentBid: null,
    currentPlayerIdx: 1, // Priya is about to open
    palificoMode: noPalifico,
    revealState: null,
    innerCircleText: 'Welcome!',
  },

  // ── Step 3: Centre circle ─────────────────────────────────────────────────
  'center-scene': {
    players: hideOpponents(r1Players()),
    currentBid: null,
    currentPlayerIdx: 1, // Priya
    palificoMode: noPalifico,
    revealState: null,
    innerCircleText: 'Priya',
  },

  // ── Step 4: Priya opens 2×4 ───────────────────────────────────────────────
  'priya-bid-r1': {
    players: hideOpponents(r1Players()),
    currentBid: { quantity: 5, faceValue: 4, playerId: PRIYA },
    currentPlayerIdx: 2, // Marco next
    palificoMode: noPalifico,
    revealState: null,
    innerCircleText: 'Marco',
  },

  // ── Steps 5 & 6: Marco 3×4 → then Your Turn (same board state) ────────────
  'marco-bid-r1': {
    players: hideOpponents(r1Players()),
    currentBid: { quantity: 7, faceValue: 4, playerId: MARCO },
    currentPlayerIdx: 3, // Your turn
    palificoMode: noPalifico,
    revealState: null,
    innerCircleText: 'Your Turn!',
  },

  // ── Step 7: Sofia raises to 5×4 ───────────────────────────────────────────
  'sofia-bid-r1': {
    players: hideOpponents(r1Players()),
    currentBid: { quantity: 9, faceValue: 4, playerId: SOFIA },
    currentPlayerIdx: 5, // Lena next
    palificoMode: noPalifico,
    revealState: null,
    innerCircleText: 'Lena',
  },

  // ── Step 8: Lena pushes to 6×4 ────────────────────────────────────────────
  'lena-bid-r1': {
    players: hideOpponents(r1Players()),
    currentBid: { quantity: 10, faceValue: 4, playerId: LENA },
    currentPlayerIdx: 0, // Kai next
    palificoMode: noPalifico,
    revealState: null,
    innerCircleText: 'Kai',
  },

  // ── Step 9: Kai calls Dudo on Lena's 6×4 ─────────────────────────────────
  'kai-dudo-r1': {
    players: hideOpponents(r1Players()),
    currentBid: { quantity: 10, faceValue: 4, playerId: LENA },
    currentPlayerIdx: 0, // Kai calling
    palificoMode: noPalifico,
    revealState: null,
    innerCircleText: 'DUDO!',
  },

  // ── Step 10: Reveal R1 ────────────────────────────────────────────────────
  // 4s: You[4,4]=2, Sofia[4]=1, wild Sofia[1]=1, Lena[4]=1 → total 5
  // Lena bid 6×4 → 5 < 6 → Lena loses ✓
  'reveal-r1': {
    players: r1Players(),
    currentBid: { quantity: 6, faceValue: 4, playerId: LENA },
    currentPlayerIdx: 0,
    palificoMode: noPalifico,
    revealState: {
      allDice: [
        { playerId: KAI,   dice: [1, 4, 4, 2, 6] },
        { playerId: PRIYA, dice: [1, 4, 2, 3, 5] },
        { playerId: MARCO, dice: [4, 2, 3, 6, 5] },
        { playerId: YOU,   dice: [4, 4, 6, 2, 3] },
        { playerId: SOFIA, dice: [4, 2, 6, 3, 5] },
        { playerId: LENA,  dice: [2, 3, 5, 6, 3] },
      ],
      challengedBid: { quantity: 10, faceValue: 4, playerId: LENA },
      actualCount: 9, // Kai[1+4+4]=3 + Priya[1+4]=2 + Marco[4]=1 + You[4+4]=2 + Sofia[4]=1
      winnerId: KAI,
      loserId: LENA,
    },
    innerCircleText: 'DUDO!',
  },

  // ── Step 11: Round result — Lena lost ─────────────────────────────────────
  'result-r1': {
    players: [
      p(KAI,   'Kai',   '#FF6600', [1, 4, 4, 2, 6]),
      p(PRIYA, 'Priya', '#00CC66', [1, 4, 2, 3, 5]),
      p(MARCO, 'Marco', '#0080FF', [4, 2, 3, 6, 5]),
      p(YOU,   'You',   '#FF3333', [4, 4, 6, 2, 3], true),
      p(SOFIA, 'Sofia', '#E6B800', [4, 2, 6, 3, 5]),
      p(LENA,  'Lena',  '#FF1493', [2, 3, 5, 6]),    // lost 1 → 4 dice
    ],
    currentBid: null,
    currentPlayerIdx: 5, // Lena starts next round
    palificoMode: noPalifico,
    revealState: null,
    innerCircleText: 'Lena',
  },

  // ── Step 12: Lena opens Round 2 (2×6) ────────────────────────────────────
  'lena-opens-r2': {
    players: r2Players(),
    currentBid: { quantity: 4, faceValue: 6, playerId: LENA },
    currentPlayerIdx: 5, // Lena is bidding
    palificoMode: noPalifico,
    revealState: null,
    innerCircleText: 'Lena',
  },

  // ── Step 13: Kai raises to 3×6 ───────────────────────────────────────────
  'kai-bid-r2': {
    players: r2Players(),
    currentBid: { quantity: 6, faceValue: 6, playerId: KAI },
    currentPlayerIdx: 1, // Priya next
    palificoMode: noPalifico,
    revealState: null,
    innerCircleText: 'Priya',
  },

  // ── Step 14: Priya raises to 4×6 ─────────────────────────────────────────
  'priya-bid-r2': {
    players: r2Players(),
    currentBid: { quantity: 8, faceValue: 6, playerId: PRIYA },
    currentPlayerIdx: 2, // Marco next
    palificoMode: noPalifico,
    revealState: null,
    innerCircleText: 'Marco',
  },

  // ── Steps 15–17: Marco switches to ones 3×1 ──────────────────────────────
  // From Priya's 4×6: min ones bid = floor(4/2)+1 = 3. Marco bids 3×1.
  // You are next (sector 3). Ones explanation + interactive bid both use this scene.
  'marco-bid-ones': {
    players: r2Players(),
    currentBid: { quantity: 5, faceValue: 1, playerId: MARCO },
    currentPlayerIdx: 3, // Your turn
    palificoMode: noPalifico,
    revealState: null,
    innerCircleText: 'Your Turn!',
  },

  // ── Step 18: Sofia calls Dudo on your ones bid (WRONG) ───────────────────
  // Scripted: You bid 4×1. Actual ones = 6 (every player has a 1). 6 ≥ 4 → Sofia wrong.
  'sofia-dudo-wrong': {
    players: r2Players(),
    currentBid: { quantity: 6, faceValue: 1, playerId: YOU },
    currentPlayerIdx: 4, // Sofia calling
    palificoMode: noPalifico,
    revealState: null,
    innerCircleText: 'DUDO!',
  },

  // ── Step 19: Reveal R2 — Sofia's Dudo was wrong ──────────────────────────
  // All players had a 1 → 6 actual ones. Player's 4×1 bid was valid → Sofia loses.
  'reveal-r2': {
    players: [
      p(KAI,   'Kai',   '#FF6600', [1, 3, 4, 2, 6]),
      p(PRIYA, 'Priya', '#00CC66', [1, 6, 2, 3, 5]),
      p(MARCO, 'Marco', '#0080FF', [1, 4, 5, 3, 6]),
      p(YOU,   'You',   '#FF3333', [1, 3, 2, 4, 6], true),
      p(SOFIA, 'Sofia', '#E6B800', [1, 3, 6, 4, 2]),
      p(LENA,  'Lena',  '#FF1493', [1, 4, 2, 6]),       // 4 dice
    ],
    currentBid: { quantity: 6, faceValue: 1, playerId: YOU },
    currentPlayerIdx: 4,
    palificoMode: noPalifico,
    revealState: {
      allDice: [
        { playerId: KAI,   dice: [1, 3, 4, 2, 6] },
        { playerId: PRIYA, dice: [1, 6, 2, 3, 5] },
        { playerId: MARCO, dice: [1, 4, 5, 3, 6] },
        { playerId: YOU,   dice: [1, 3, 2, 4, 6] },
        { playerId: SOFIA, dice: [1, 3, 6, 4, 2] },
        { playerId: LENA,  dice: [1, 4, 2, 6] },
      ],
      challengedBid: { quantity: 6, faceValue: 1, playerId: YOU },
      // Ones bid: ones are NOT wild → only actual 1s count
      // Every player has exactly one 1 → 6 total. 6 ≥ 4 → Sofia's Dudo WRONG.
      actualCount: 6,
      winnerId: YOU,
      loserId: SOFIA,
    },
    innerCircleText: 'DUDO!',
  },

  // ── Step 20: R2 result — Sofia loses a die ───────────────────────────────
  'r2-result': {
    players: [
      p(KAI,   'Kai',   '#FF6600', [1, 3, 4, 2, 6]),
      p(PRIYA, 'Priya', '#00CC66', [1, 6, 2, 3, 5]),
      p(MARCO, 'Marco', '#0080FF', [1, 4, 5, 3, 6]),
      p(YOU,   'You',   '#FF3333', [1, 3, 2, 4, 6], true),
      p(SOFIA, 'Sofia', '#E6B800', [3, 6, 4, 2]),        // 4 dice (lost 1)
      p(LENA,  'Lena',  '#FF1493', [1, 4, 2, 6]),        // 4 dice (from R1 loss)
    ],
    currentBid: null,
    currentPlayerIdx: 4, // Sofia starts next (she lost)
    palificoMode: noPalifico,
    revealState: null,
    innerCircleText: 'Sofia',
  },

  // ── Steps 22–27: Round 3 bids ─────────────────────────────────────────────
  'sofia-opens-r3': {
    players: hideOpponents(r3Players()),
    currentBid: { quantity: 9, faceValue: 3, playerId: SOFIA },
    currentPlayerIdx: 5, // Lena next
    palificoMode: noPalifico,
    revealState: null,
    innerCircleText: 'Lena',
  },

  'lena-bids-r3': {
    players: hideOpponents(r3Players()),
    currentBid: { quantity: 10, faceValue: 3, playerId: LENA },
    currentPlayerIdx: 0, // Kai next
    palificoMode: noPalifico,
    revealState: null,
    innerCircleText: 'Kai',
  },

  'kai-bids-r3': {
    players: hideOpponents(r3Players()),
    currentBid: { quantity: 11, faceValue: 3, playerId: KAI },
    currentPlayerIdx: 1, // Priya next
    palificoMode: noPalifico,
    revealState: null,
    innerCircleText: 'Priya',
  },

  'priya-bids-r3': {
    players: hideOpponents(r3Players()),
    currentBid: { quantity: 12, faceValue: 3, playerId: PRIYA },
    currentPlayerIdx: 2, // Marco next
    palificoMode: noPalifico,
    revealState: null,
    innerCircleText: 'Marco',
  },

  'marco-bids-r3': {
    players: hideOpponents(r3Players()),
    currentBid: { quantity: 14, faceValue: 3, playerId: MARCO },
    currentPlayerIdx: 3, // Your Turn
    palificoMode: noPalifico,
    revealState: null,
    innerCircleText: 'Your Turn!',
  },

  // ── Step 26: Reveal R3 ────────────────────────────────────────────────────
  // Threes: Sofia[3]=1, Kai[3+3]=2, Priya[1+3]=2, Marco[3]=1, You[3+3]=2, Lena[3]=1 → actual 9
  'reveal-r3': {
    players: r3Players(),
    currentBid: { quantity: 14, faceValue: 3, playerId: MARCO },
    currentPlayerIdx: 3,
    palificoMode: noPalifico,
    revealState: {
      allDice: [
        { playerId: KAI,   dice: [3, 3, 4, 6, 5] },
        { playerId: PRIYA, dice: [1, 3, 2, 6, 4] },
        { playerId: MARCO, dice: [3, 2, 6, 5, 4] },
        { playerId: YOU,   dice: [3, 3, 4, 2, 6] },
        { playerId: SOFIA, dice: [3, 2, 5, 4] },
        { playerId: LENA,  dice: [3, 4, 6, 2] },
      ],
      challengedBid: { quantity: 14, faceValue: 3, playerId: MARCO },
      actualCount: 9, // Sofia[3]+Kai[3+3]+Priya[1+3]+Marco[3]+You[3+3]+Lena[3]
      winnerId: YOU,
      loserId: MARCO,
    },
    innerCircleText: 'DUDO!',
  },

  // ── Step 27: R3 result — Marco loses ──────────────────────────────────────
  'result-r3': {
    players: [
      p(KAI,   'Kai',   '#FF6600', [3, 3, 4, 6, 5]),
      p(PRIYA, 'Priya', '#00CC66', [1, 3, 2, 6, 4]),
      p(MARCO, 'Marco', '#0080FF', [3, 2, 6, 5]),    // 4 dice (lost in R3)
      p(YOU,   'You',   '#FF3333', [3, 3, 4, 2, 6], true),
      p(SOFIA, 'Sofia', '#E6B800', [3, 2, 5, 4]),
      p(LENA,  'Lena',  '#FF1493', [3, 4, 6, 2]),
    ],
    currentBid: null,
    currentPlayerIdx: 2, // Marco starts next (he lost)
    palificoMode: noPalifico,
    revealState: null,
    innerCircleText: 'Marco',
  },

  // ── Step 28: Tutorial complete ────────────────────────────────────────────
  'game-over': {
    players: [
      p(KAI,   'Kai',   '#FF6600', [3, 3, 4, 6, 5]),
      p(PRIYA, 'Priya', '#00CC66', [1, 3, 2, 6, 4]),
      p(MARCO, 'Marco', '#0080FF', [3, 2, 6, 5]),    // 4 dice (lost in R3)
      p(YOU,   'You',   '#FF3333', [3, 3, 4, 2, 6], true),
      p(SOFIA, 'Sofia', '#E6B800', [3, 2, 5, 4]),
      p(LENA,  'Lena',  '#FF1493', [3, 4, 6, 2]),
    ],
    currentBid: null,
    currentPlayerIdx: 3, // You
    palificoMode: noPalifico,
    revealState: null,
    innerCircleText: '🎉',
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Per-scene bid round log (shown in the 📋 game log panel)
// ────────────────────────────────────────────────────────────────────────────
const R1_P  = [{ quantity: 5,  faceValue: 4, playerId: PRIYA }];
const R1_M  = [...R1_P,  { quantity: 7,  faceValue: 4, playerId: MARCO }];
const R1_Y  = [...R1_M,  { quantity: 8,  faceValue: 4, playerId: YOU }];   // scripted stand-in
const R1_SO = [...R1_Y,  { quantity: 9,  faceValue: 4, playerId: SOFIA }];
const R1_L  = [...R1_SO, { quantity: 10, faceValue: 4, playerId: LENA }];

const R2_L  = [{ quantity: 4, faceValue: 6, playerId: LENA }];
const R2_K  = [...R2_L,  { quantity: 6, faceValue: 6, playerId: KAI }];
const R2_PR = [...R2_K,  { quantity: 8, faceValue: 6, playerId: PRIYA }];
const R2_M  = [...R2_PR, { quantity: 5, faceValue: 1, playerId: MARCO }]; // Marco switches to ones
const R2_PL = [...R2_M,  { quantity: 6, faceValue: 1, playerId: YOU }];   // scripted stand-in

const R3_SO = [{ quantity: 9,  faceValue: 3, playerId: SOFIA }];
const R3_L  = [...R3_SO, { quantity: 10, faceValue: 3, playerId: LENA }];
const R3_K  = [...R3_L,  { quantity: 11, faceValue: 3, playerId: KAI }];
const R3_PR = [...R3_K,  { quantity: 12, faceValue: 3, playerId: PRIYA }];
const R3_M  = [...R3_PR, { quantity: 14, faceValue: 3, playerId: MARCO }];

export const SCENE_ROUND_LOGS: Record<string, TutorialBid[]> = {
  'board-intro':      [],
  'center-scene':     [],
  'priya-bid-r1':     R1_P,
  'marco-bid-r1':     R1_M,
  'sofia-bid-r1':     R1_SO,
  'lena-bid-r1':      R1_L,
  'kai-dudo-r1':      R1_L,
  'reveal-r1':        R1_L,
  'result-r1':        [],
  'lena-opens-r2':    R2_L,
  'kai-bid-r2':       R2_K,
  'priya-bid-r2':     R2_PR,
  'marco-bid-ones':   R2_M,
  'sofia-dudo-wrong': R2_PL,
  'reveal-r2':        R2_PL,
  'r2-result':        [],
  'sofia-opens-r3':   R3_SO,
  'lena-bids-r3':     R3_L,
  'kai-bids-r3':      R3_K,
  'priya-bids-r3':    R3_PR,
  'marco-bids-r3':    R3_M,
  'reveal-r3':        R3_M,
  'result-r3':        [],
  'game-over':        [],
};

export const PLAYER_SECTOR: Record<string, number> = {
  [KAI]:   0,
  [PRIYA]: 1,
  [MARCO]: 2,
  [YOU]:   3,
  [SOFIA]: 4,
  [LENA]:  5,
};
