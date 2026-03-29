import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GameEngine } from '../../shared/src/GameEngine.ts';

function createEngine() {
  return new GameEngine(
    {
      playerCount: 2,
      startingDice: 5,
      analysisEnabled: false,
      palificoEnabled: true,
      calzaEnabled: true,
    },
    [
      { id: 'p1', name: 'P1', isHuman: true },
      { id: 'p2', name: 'P2', isHuman: true },
    ]
  );
}

describe('GameEngine', () => {
  it('records a valid bid and advances the turn', () => {
    const engine = createEngine();
    const state = (engine as any).state;
    state.players[0].dice = [4, 4, 2];
    state.players[0].diceCount = 3;
    state.players[1].dice = [1, 5, 6];
    state.players[1].diceCount = 3;
    state.currentPlayerIndex = 0;

    const result = engine.makeBid({ quantity: 3, faceValue: 4, playerId: 'p1' });

    assert.equal(result.success, true);
    assert.deepEqual(state.currentBid, { quantity: 3, faceValue: 4, playerId: 'p1' });
    assert.equal(state.bidSequence.length, 1);
    assert.equal(state.currentRoundBids.length, 1);
    assert.equal(state.currentPlayerIndex, 1);
  });

  it('removes one die from the loser and starts a new round after a dudo', () => {
    const engine = createEngine();
    const state = (engine as any).state;
    state.players[0].dice = [4, 4, 2];
    state.players[0].diceCount = 3;
    state.players[1].dice = [1, 5, 6];
    state.players[1].diceCount = 3;
    state.currentPlayerIndex = 0;
    state.roundNumber = 1;

    engine.makeBid({ quantity: 3, faceValue: 4, playerId: 'p1' });
    const roundResult = engine.challengeBid('p2');

    assert.equal(roundResult.winnerId, 'p1');
    assert.equal(state.players[1].diceCount, 2);
    assert.equal(state.roundNumber, 2);
    assert.equal(state.gamePhase, 'bidding');
  });

  it('ends the game when the challenged loser loses their final die', () => {
    const engine = createEngine();
    const state = (engine as any).state;
    state.players[0].dice = [2];
    state.players[0].diceCount = 1;
    state.players[1].dice = [3];
    state.players[1].diceCount = 1;
    state.currentPlayerIndex = 0;
    state.currentBid = { quantity: 2, faceValue: 6, playerId: 'p1' };
    state.bidSequence = [{ quantity: 2, faceValue: 6, playerId: 'p1' }];
    state.currentRoundBids = [];
    state.roundHistory = [];

    const roundResult = engine.challengeBid('p2');

    assert.equal(roundResult.loserId, 'p1');
    assert.equal(state.gamePhase, 'gameOver');
    assert.equal(engine.getWinner()?.id, 'p2');
  });

  it('activates palifico when a one-die player opens with quantity one', () => {
    const engine = createEngine();
    const state = (engine as any).state;
    state.players[0].dice = [3];
    state.players[0].diceCount = 1;
    state.players[1].dice = [2, 2, 2];
    state.players[1].diceCount = 3;
    state.currentPlayerIndex = 0;

    const result = engine.makeBid({ quantity: 1, faceValue: 3, playerId: 'p1' });

    assert.equal(result.success, true);
    assert.deepEqual(state.palificoMode, { active: true, lockedFaceValue: 3 });
  });

  it('rewards a successful calza with one die when below the cap', () => {
    const engine = createEngine();
    const state = (engine as any).state;
    state.players[0].dice = [2, 2, 3];
    state.players[0].diceCount = 3;
    state.players[1].dice = [1, 4, 6];
    state.players[1].diceCount = 3;
    state.currentPlayerIndex = 0;
    state.currentBid = { quantity: 3, faceValue: 2, playerId: 'p2' };
    state.bidSequence = [{ quantity: 3, faceValue: 2, playerId: 'p2' }];
    state.currentRoundBids = [];
    state.roundHistory = [];

    const roundResult = engine.callCalza('p1');

    assert.equal(roundResult.calzaSuccess, true);
    assert.equal(state.players[0].diceCount, 4);
  });
});
