import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { GameState, Player, RoundResult } from '@dudo-dice/shared';
import { buildSectorPlayers } from '../../frontend/src/components/game-board/layout.ts';
import {
  buildSequentialRevealOrder,
  type OrderedRevealDie,
} from '../../frontend/src/components/game-board/reveal.ts';

const CLOCKWISE_SECTORS = [4, 5, 0, 1, 2, 3] as const;

function makePlayer(
  id: string,
  opts: { human?: boolean; dice: number[]; color?: string },
): Player {
  const dice = opts.dice;
  return {
    id,
    name: id,
    dice,
    diceCount: dice.length,
    isHuman: opts.human ?? false,
    color: opts.color ?? 'red',
  };
}

function makeGameState(players: Player[]): GameState {
  return {
    players,
    currentPlayerIndex: 0,
    currentBid: null,
    bidSequence: [],
    currentRoundBids: [],
    gamePhase: 'bidding',
    roundHistory: [],
    settings: {
      playerCount: players.length,
      startingDice: 5,
      analysisEnabled: false,
      palificoEnabled: true,
      calzaEnabled: false,
    },
    palificoMode: { active: false, lockedFaceValue: null },
    turnDelay: 3000,
    roundNumber: 1,
  };
}

function makeRoundResult(allDice: { playerId: string; dice: number[] }[]): RoundResult {
  return {
    round: 1,
    challengedBid: { quantity: 2, faceValue: 3, playerId: 'p0' },
    actualCount: 0,
    challengerId: 'p1',
    bidderId: 'p0',
    winnerId: 'p0',
    loserId: 'p1',
    allDice,
    bids: [],
    challengeType: 'dudo',
  };
}

/** First sector index of each contiguous run (matches clockwise “who is revealed next”). */
function sectorRunStarts(order: OrderedRevealDie[]): number[] {
  const starts: number[] = [];
  let prev = -1;
  for (const die of order) {
    if (die.playerSectorIdx !== prev) {
      starts.push(die.playerSectorIdx);
      prev = die.playerSectorIdx;
    }
  }
  return starts;
}

/** Expected sector visit order: clockwise walk, skipping empty seats. */
function expectedClockwiseSectorOrder(players: Player[], multiplayer: boolean, mpId: string | null): number[] {
  const sectorPlayers = buildSectorPlayers(players, multiplayer, mpId);
  return CLOCKWISE_SECTORS.filter((idx) => sectorPlayers[idx] !== null);
}

describe('buildSequentialRevealOrder (post-challenge dice reveal)', () => {
  it('uses clockwise sector order 4→5→0→1→2→3, skipping only empty seats', () => {
    const players = [
      makePlayer('p0', { dice: [6, 1] }),
      makePlayer('p1', { dice: [2] }),
      makePlayer('p2', { dice: [3, 3, 4] }),
      makePlayer('p3', { human: true, dice: [5] }),
      makePlayer('p4', { dice: [1, 2] }),
      makePlayer('p5', { dice: [4] }),
    ];
    const state = makeGameState(players);
    const allDice = players.map((p) => ({ playerId: p.id, dice: [...p.dice] }));
    const result = makeRoundResult(allDice);

    const order = buildSequentialRevealOrder(result, state, false, null);
    const expectedSectors = expectedClockwiseSectorOrder(players, false, null);

    assert.deepEqual(sectorRunStarts(order), expectedSectors);
    assert.equal(
      expectedSectors.length,
      6,
      'fixture: human at index 3 should seat all 6 players on the board',
    );
  });

  it('does not skip any on-board player: every seated player appears with all dice exactly once', () => {
    const players = [
      makePlayer('p0', { dice: [6, 2] }),
      makePlayer('p1', { dice: [3] }),
      makePlayer('p2', { dice: [1, 1, 5] }),
      makePlayer('p3', { human: true, dice: [4] }),
      makePlayer('p4', { dice: [2, 2] }),
      makePlayer('p5', { dice: [6] }),
    ];
    const state = makeGameState(players);
    const allDice = players.map((p) => ({ playerId: p.id, dice: [...p.dice] }));
    const result = makeRoundResult(allDice);
    const sectorPlayers = buildSectorPlayers(players, false, null);

    const order = buildSequentialRevealOrder(result, state, false, null);

    const seatedIds = new Set(
      sectorPlayers.filter((p): p is Player => p !== null).map((p) => p.id),
    );

    for (const pid of seatedIds) {
      const entry = allDice.find((e) => e.playerId === pid);
      assert.ok(entry, `allDice has ${pid}`);
      const fromOrder = order.filter((d) => d.playerId === pid);
      assert.equal(
        fromOrder.length,
        entry!.dice.length,
        `player ${pid}: reveal count matches dice count`,
      );
      const idxs = fromOrder.map((d) => d.originalDieIdx).sort((a, b) => a - b);
      const expectedIdxs = entry!.dice.map((_, i) => i).sort((a, b) => a - b);
      assert.deepEqual(idxs, expectedIdxs, `player ${pid}: each original die index appears once`);
    }

    assert.equal(
      order.length,
      [...seatedIds].reduce((sum, id) => sum + allDice.find((e) => e.playerId === id)!.dice.length, 0),
      'total reveal steps equals sum of dice for all seated players',
    );
  });

  it('sorts each player’s dice ascending by face value (stable tie-break by original index)', () => {
    const players = [
      makePlayer('p0', { dice: [4, 1, 4] }),
      makePlayer('p1', { human: true, dice: [2] }),
      makePlayer('p2', { dice: [6] }),
    ];
    const state = makeGameState(players);
    const allDice = players.map((p) => ({ playerId: p.id, dice: [...p.dice] }));
    const result = makeRoundResult(allDice);

    const order = buildSequentialRevealOrder(result, state, false, null);
    const p0Dice = order.filter((d) => d.playerId === 'p0');
    assert.deepEqual(
      p0Dice.map((d) => d.dieValue),
      [1, 4, 4],
      'values ascending',
    );
    assert.deepEqual(
      p0Dice.map((d) => d.originalDieIdx),
      [1, 0, 2],
      'original indices preserved for ties',
    );
  });

  it('multiplayer: uses the same seat as local human when playerId matches that seat', () => {
    const players = [
      makePlayer('remote-a', { dice: [1] }),
      makePlayer('remote-b', { dice: [2] }),
      makePlayer('me', { human: true, dice: [3] }),
      makePlayer('remote-c', { dice: [4] }),
    ];
    const state = makeGameState(players);

    const localOrder = buildSequentialRevealOrder(
      makeRoundResult(players.map((p) => ({ playerId: p.id, dice: [...p.dice] }))),
      state,
      false,
      null,
    );
    const mpOrder = buildSequentialRevealOrder(
      makeRoundResult(players.map((p) => ({ playerId: p.id, dice: [...p.dice] }))),
      state,
      true,
      'me',
    );

    assert.deepEqual(
      mpOrder.map((d) => d.playerId),
      localOrder.map((d) => d.playerId),
    );
    assert.deepEqual(
      mpOrder.map((d) => d.playerSectorIdx),
      localOrder.map((d) => d.playerSectorIdx),
    );
  });
});
