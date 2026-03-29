import type { GameState, Player, RoundResult } from '../../game/GameState';
import { buildSectorPlayers } from './layout';

export interface OrderedRevealDie {
  playerId: string;
  playerSectorIdx: number;
  originalDieIdx: number;
  dieValue: number;
}

export interface RevealState {
  playerIndex: number;
  dieIndex: number;
  revealed: Record<string, number[]>;
  matchingDice?: Record<string, number[]>;
}

export function buildSequentialRevealOrder(
  result: RoundResult,
  state: GameState,
  isMultiplayer: boolean,
  playerId?: string | null,
): OrderedRevealDie[] {
  const sectorPlayers = buildSectorPlayers(state.players, isMultiplayer, playerId);
  const clockwiseSectors = [4, 5, 0, 1, 2, 3];
  const orderedDicePositions: OrderedRevealDie[] = [];

  for (const sectorIdx of clockwiseSectors) {
    const player = sectorPlayers[sectorIdx];
    if (!player) {
      continue;
    }

    const playerDiceEntry = result.allDice.find(entry => entry.playerId === player.id);
    if (!playerDiceEntry || playerDiceEntry.dice.length === 0) {
      continue;
    }

    const diceWithIndices = playerDiceEntry.dice
      .map((value, originalIdx) => ({ value, originalIdx }))
      .sort((left, right) => left.value - right.value);

    for (const diceItem of diceWithIndices) {
      orderedDicePositions.push({
        playerId: player.id,
        playerSectorIdx: sectorIdx,
        originalDieIdx: diceItem.originalIdx,
        dieValue: diceItem.value,
      });
    }
  }

  return orderedDicePositions;
}

export function countMatchingDice(matchingDice?: Record<string, number[]>): number {
  if (!matchingDice) {
    return 0;
  }

  return Object.values(matchingDice).reduce((sum, diceIndices) => sum + diceIndices.length, 0);
}

export function getRevealedDiceForPlayer(
  revealState: RevealState | null,
  player: Player,
): { revealedIndices: number[]; matchingIndices: number[] } {
  return {
    revealedIndices: revealState?.revealed[player.id] ?? [],
    matchingIndices: revealState?.matchingDice?.[player.id] ?? [],
  };
}
