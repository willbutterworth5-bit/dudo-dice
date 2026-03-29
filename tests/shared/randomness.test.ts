import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GameEngine } from '../../shared/src/GameEngine.ts';

describe('dice randomness sanity', () => {
  it('keeps dice values within 1-6 and produces a non-degenerate distribution', () => {
    const counts = new Map<number, number>();
    let total = 0;

    for (let i = 0; i < 150; i++) {
      const engine = new GameEngine({
        playerCount: 6,
        startingDice: 5,
        analysisEnabled: false,
        palificoEnabled: true,
        calzaEnabled: false,
      });
      const dice = engine.getState().players.flatMap((player) => player.dice);
      for (const die of dice) {
        assert.ok(die >= 1 && die <= 6, `die out of range: ${die}`);
        counts.set(die, (counts.get(die) ?? 0) + 1);
        total += 1;
      }
    }

    assert.equal(total, 4_500);
    assert.equal(counts.size, 6);

    for (const face of [1, 2, 3, 4, 5, 6]) {
      const ratio = (counts.get(face) ?? 0) / total;
      assert.ok(
        ratio > 0.10 && ratio < 0.24,
        `face ${face} distribution ratio out of bounds: ${ratio}`
      );
    }
  });
});
