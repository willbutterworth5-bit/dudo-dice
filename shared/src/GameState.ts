export interface Bid {
  quantity: number;
  faceValue: number;
  playerId: string;
}

export interface Player {
  id: string;
  name: string;
  dice: number[];
  diceCount: number;
  isHuman: boolean;
  color: string;
}

export interface GameSettings {
  playerCount: number;
  startingDice: number;
  analysisEnabled: boolean;
  palificoEnabled: boolean;
  calzaEnabled: boolean;
}

export interface BidRecord {
  playerId: string;
  bid: { quantity: number; faceValue: number };
  humanDice: number[];      // human player's dice at the moment this bid was made
  totalDiceOnBoard: number; // total dice still in play at bid time
  palificoMode: boolean;
}

export interface PalificoMode {
  active: boolean;
  lockedFaceValue: number | null;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  currentBid: Bid | null;
  bidSequence: Bid[]; // All bids made in the current round, in order
  currentRoundBids: BidRecord[]; // Rich bid records for current round (cleared each round)
  gamePhase: 'bidding' | 'challenged' | 'gameOver' | 'waiting';
  roundHistory: RoundResult[];
  settings: GameSettings;
  palificoMode: PalificoMode;
  turnDelay: number;
  roundNumber: number;
}

export interface RoundResult {
  round: number;
  challengedBid: Bid;
  actualCount: number;
  challengerId: string;
  bidderId: string;
  winnerId: string;
  loserId: string;
  allDice: { playerId: string; dice: number[] }[];
  bids: BidRecord[]; // Rich bid records for analysis
  challengeType: 'dudo' | 'calza';
  calzaSuccess?: boolean; // only set when challengeType === 'calza'
}

export const PLAYER_COLORS = ['red', 'orange', 'yellow', 'pink', 'green', 'blue'] as const;
export type PlayerColor = typeof PLAYER_COLORS[number];

export const PLAYER_COLOR_MAP: Record<string, string> = {
  red: '#FF3333',
  orange: '#FF6600',
  yellow: '#E6B800',
  pink: '#FF1493',
  green: '#00CC66',
  blue: '#0080FF',
};
