import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AIPlayer } from '../../shared/src/AIPlayer.ts';
import { BidValidator } from '../../shared/src/BidValidator.ts';
import { withMockedRandom } from '../helpers/random.ts';

describe('AIPlayer', () => {
  it('always bids when opening a round', () => {
    const ai = new AIPlayer('medium');
    const decision = ai.makeDecision(
      {
        players: [
          { id: 'ai', name: 'AI', dice: [6, 6, 2], diceCount: 3, isHuman: false, color: 'red' },
          { id: 'p2', name: 'P2', dice: [], diceCount: 3, isHuman: true, color: 'blue' },
        ],
        currentPlayerIndex: 0,
        currentBid: null,
        bidSequence: [],
        currentRoundBids: [],
        gamePhase: 'bidding',
        roundHistory: [],
        settings: {
          playerCount: 2,
          startingDice: 5,
          analysisEnabled: false,
          palificoEnabled: true,
          calzaEnabled: false,
        },
        palificoMode: { active: false, lockedFaceValue: null },
        turnDelay: 3000,
        roundNumber: 1,
      },
      { id: 'ai', name: 'AI', dice: [6, 6, 2], diceCount: 3, isHuman: false, color: 'red' }
    );

    assert.equal(decision, 'bid');
  });

  it('uses the locked face when opening during palifico', async () => {
    const ai = new AIPlayer('medium');

    await withMockedRandom([0], async () => {
      const bid = ai.generateBid(
        {
          players: [
            { id: 'ai', name: 'AI', dice: [2, 4, 6], diceCount: 3, isHuman: false, color: 'red' },
            { id: 'p2', name: 'P2', dice: [], diceCount: 3, isHuman: true, color: 'blue' },
          ],
          currentPlayerIndex: 0,
          currentBid: null,
          bidSequence: [],
          currentRoundBids: [],
          gamePhase: 'bidding',
          roundHistory: [],
          settings: {
            playerCount: 2,
            startingDice: 5,
            analysisEnabled: false,
            palificoEnabled: true,
            calzaEnabled: false,
          },
          palificoMode: { active: true, lockedFaceValue: 4 },
          turnDelay: 3000,
          roundNumber: 1,
        },
        { id: 'ai', name: 'AI', dice: [2, 4, 6], diceCount: 3, isHuman: false, color: 'red' }
      );

      assert.equal(bid?.faceValue, 4);
      assert.equal(bid?.playerId, 'ai');
    });
  });

  it('returns valid raises when continuing a round', async () => {
    const ai = new AIPlayer('hard');

    await withMockedRandom([0, 0, 0], async () => {
      const state = {
        players: [
          { id: 'ai', name: 'AI', dice: [6, 6, 1], diceCount: 3, isHuman: false, color: 'red' },
          { id: 'p2', name: 'P2', dice: [], diceCount: 3, isHuman: true, color: 'blue' },
        ],
        currentPlayerIndex: 0,
        currentBid: { quantity: 2, faceValue: 5, playerId: 'p2' },
        bidSequence: [{ quantity: 2, faceValue: 5, playerId: 'p2' }],
        currentRoundBids: [],
        gamePhase: 'bidding' as const,
        roundHistory: [],
        settings: {
          playerCount: 2,
          startingDice: 5,
          analysisEnabled: false,
          palificoEnabled: true,
          calzaEnabled: false,
        },
        palificoMode: { active: false, lockedFaceValue: null },
        turnDelay: 3000,
        roundNumber: 1,
      };
      const player = state.players[0];
      const bid = ai.generateBid(state, player);

      assert.ok(bid);
      assert.equal(
        BidValidator.validateBid(bid, state.currentBid, state.palificoMode).valid,
        true
      );
    });
  });

  it('challenges hopeless bids when bluffing does not trigger', async () => {
    const ai = new AIPlayer('medium');

    await withMockedRandom([0.99], async () => {
      const decision = ai.makeDecision(
        {
          players: [
            { id: 'ai', name: 'AI', dice: [2], diceCount: 1, isHuman: false, color: 'red' },
            { id: 'p2', name: 'P2', dice: [], diceCount: 1, isHuman: true, color: 'blue' },
          ],
          currentPlayerIndex: 0,
          currentBid: { quantity: 5, faceValue: 6, playerId: 'p2' },
          bidSequence: [{ quantity: 5, faceValue: 6, playerId: 'p2' }],
          currentRoundBids: [],
          gamePhase: 'bidding',
          roundHistory: [],
          settings: {
            playerCount: 2,
            startingDice: 5,
            analysisEnabled: false,
            palificoEnabled: true,
            calzaEnabled: false,
          },
          palificoMode: { active: false, lockedFaceValue: null },
          turnDelay: 3000,
          roundNumber: 1,
        },
        { id: 'ai', name: 'AI', dice: [2], diceCount: 1, isHuman: false, color: 'red' }
      );

      assert.equal(decision, 'challenge');
    });
  });
});
