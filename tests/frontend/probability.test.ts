import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  alternativeBids,
  bidProbabilityFromHuman,
  probColour,
} from '../../frontend/src/utils/probability.ts';

describe('frontend probability helpers', () => {
  it('returns certainty when the human already covers the bid', () => {
    const probability = bidProbabilityFromHuman(2, 4, [1, 4, 6], 6, false);

    assert.equal(probability, 1);
  });

  it('returns a floor probability when the bid is impossible from unknown dice', () => {
    const probability = bidProbabilityFromHuman(7, 6, [2, 3], 4, false);

    assert.equal(probability, 0.01);
  });

  it('suggests stronger alternative bids sorted by actual count', () => {
    const bids = alternativeBids(
      [
        { playerId: 'p1', dice: [1, 4, 4] },
        { playerId: 'p2', dice: [4, 5, 6] },
      ],
      { quantity: 3, faceValue: 4 },
      false
    );

    assert.deepEqual(bids[0], { quantity: 4, faceValue: 4, actualCount: 4 });
    assert.ok(
      bids.every((bid, index) => index === 0 || bids[index - 1].actualCount >= bid.actualCount)
    );
  });

  it('maps probability thresholds to the expected colour classes', () => {
    assert.deepEqual(probColour(0.8), { text: 'text-green-300', bg: 'bg-green-500/20' });
    assert.deepEqual(probColour(0.5), { text: 'text-amber-300', bg: 'bg-amber-500/20' });
    assert.deepEqual(probColour(0.1), { text: 'text-red-300', bg: 'bg-red-500/20' });
  });
});
