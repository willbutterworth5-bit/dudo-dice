import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DiceCounter } from '../../shared/src/DiceCounter.ts';

const players = [
  { id: 'p1', name: 'P1', dice: [1, 4, 4], diceCount: 3, isHuman: true, color: 'red' },
  { id: 'p2', name: 'P2', dice: [2, 4, 6], diceCount: 3, isHuman: true, color: 'blue' },
];

describe('DiceCounter', () => {
  it('counts ones as wild in normal play', () => {
    assert.equal(
      DiceCounter.countDice(players, 4, { active: false, lockedFaceValue: null }),
      4
    );
  });

  it('stops counting ones as wild in palifico', () => {
    assert.equal(
      DiceCounter.countDice(players, 4, { active: true, lockedFaceValue: 4 }),
      3
    );
  });

  it('counts a single player consistently with table totals', () => {
    assert.equal(
      DiceCounter.countPlayerDice(
        players[0],
        4,
        { active: false, lockedFaceValue: null }
      ),
      3
    );
  });
});
