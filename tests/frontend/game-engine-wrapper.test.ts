import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { GameEngine } from '../../frontend/src/game/GameEngine.ts';
import { installLocalStorageMock } from '../helpers/localStorage.ts';

describe('frontend GameEngine wrapper', () => {
  beforeEach(() => {
    installLocalStorageMock();
  });

  it('uses the stored player name for the human seat', () => {
    localStorage.setItem(
      'dudo-player-profile',
      JSON.stringify({
        name: '  Captain Bluff  ',
        photo: null,
        country: 'GB',
        stats: {
          gamesPlayed: 0,
          gamesWon: 0,
          dudoCalls: 0,
          successfulDudoCalls: 0,
          timesCalledAgainst: 0,
          successfulCallsAgainst: 0,
        },
      })
    );

    const engine = new GameEngine({
      playerCount: 4,
      startingDice: 5,
      analysisEnabled: false,
      palificoEnabled: true,
      calzaEnabled: false,
    });
    const human = engine.getState().players.find((player) => player.isHuman);

    assert.ok(human);
    assert.equal(human.name, 'Captain Bluff');
  });

  it('falls back to "You" when the stored name is missing', () => {
    localStorage.setItem(
      'dudo-player-profile',
      JSON.stringify({
        name: '   ',
        photo: null,
        country: null,
        stats: {
          gamesPlayed: 0,
          gamesWon: 0,
          dudoCalls: 0,
          successfulDudoCalls: 0,
          timesCalledAgainst: 0,
          successfulCallsAgainst: 0,
        },
      })
    );

    const engine = new GameEngine({
      playerCount: 3,
      startingDice: 5,
      analysisEnabled: false,
      palificoEnabled: true,
      calzaEnabled: false,
    });
    const human = engine.getState().players.find((player) => player.isHuman);

    assert.ok(human);
    assert.equal(human.name, 'You');
  });
});
