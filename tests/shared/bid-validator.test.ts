import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BidValidator } from '../../shared/src/BidValidator.ts';

describe('BidValidator', () => {
  it('accepts any opening bid', () => {
    const result = BidValidator.validateBid(
      { quantity: 1, faceValue: 2, playerId: 'p1' },
      null,
      { active: false, lockedFaceValue: null }
    );

    assert.equal(result.valid, true);
  });

  it('enforces the ones half-quantity rule', () => {
    const result = BidValidator.validateBid(
      { quantity: 2, faceValue: 1, playerId: 'p2' },
      { quantity: 5, faceValue: 4, playerId: 'p1' },
      { active: false, lockedFaceValue: null }
    );

    assert.equal(result.valid, false);
    assert.match(result.reason ?? '', /at least 3/);
  });

  it('enforces doubling when moving back from ones', () => {
    const result = BidValidator.validateBid(
      { quantity: 5, faceValue: 3, playerId: 'p2' },
      { quantity: 3, faceValue: 1, playerId: 'p1' },
      { active: false, lockedFaceValue: null }
    );

    assert.equal(result.valid, false);
    assert.match(result.reason ?? '', /at least 6/);
  });

  it('allows raising face value at the same quantity', () => {
    const result = BidValidator.validateBid(
      { quantity: 4, faceValue: 6, playerId: 'p2' },
      { quantity: 4, faceValue: 5, playerId: 'p1' },
      { active: false, lockedFaceValue: null }
    );

    assert.equal(result.valid, true);
  });

  it('rejects face changes that break palifico lock', () => {
    const result = BidValidator.validateBid(
      { quantity: 2, faceValue: 5, playerId: 'p2' },
      { quantity: 1, faceValue: 4, playerId: 'p1' },
      { active: true, lockedFaceValue: 4 }
    );

    assert.equal(result.valid, false);
    assert.match(result.reason ?? '', /face value 4/);
  });

  it('detects palifico starts only for one-die players, regardless of bid quantity', () => {
    // 1-die player, opening bid quantity 1 → palifico
    assert.equal(
      BidValidator.checkPalificoStart(
        { quantity: 1, faceValue: 3, playerId: 'p1' },
        1
      ),
      true
    );
    // 1-die player, opening bid quantity > 1 → palifico (the bug: this was false before)
    assert.equal(
      BidValidator.checkPalificoStart(
        { quantity: 2, faceValue: 3, playerId: 'p1' },
        1
      ),
      true
    );
    // 2-die player, opening bid quantity 1 → no palifico
    assert.equal(
      BidValidator.checkPalificoStart(
        { quantity: 1, faceValue: 3, playerId: 'p1' },
        2
      ),
      false
    );
  });
});
