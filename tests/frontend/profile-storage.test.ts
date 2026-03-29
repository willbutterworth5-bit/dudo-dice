import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { ProfileStorage } from '../../frontend/src/utils/profileStorage.ts';
import { installLocalStorageMock } from '../helpers/localStorage.ts';

describe('ProfileStorage', () => {
  beforeEach(() => {
    installLocalStorageMock();
  });

  it('returns the default profile when nothing is stored', () => {
    const profile = ProfileStorage.getProfile();

    assert.equal(profile.name, 'You');
    assert.equal(profile.country, null);
    assert.equal(profile.stats.gamesPlayed, 0);
  });

  it('migrates older stored profiles and trims the player name', () => {
    localStorage.setItem(
      'dudo-player-profile',
      JSON.stringify({
        name: '  Will  ',
        photo: null,
        stats: {
          gamesPlayed: 2,
          gamesWon: 1,
          dudoCalls: 4,
          successfulDudoCalls: 2,
        },
      })
    );

    const profile = ProfileStorage.getProfile();

    assert.equal(profile.name, 'Will');
    assert.equal(profile.country, null);
    assert.equal(profile.stats.timesCalledAgainst, 0);
    assert.equal(profile.stats.successfulCallsAgainst, 0);
  });

  it('updates stored stats and rate helpers', () => {
    ProfileStorage.recordGame(true);
    ProfileStorage.recordGame(false);
    ProfileStorage.recordDudoCall(true);
    ProfileStorage.recordCalledAgainst(false);

    assert.equal(ProfileStorage.getWinRate(), 50);
    assert.equal(ProfileStorage.getDudoSuccessRate(), 100);
    assert.equal(ProfileStorage.getCalledAgainstSuccessRate(), 0);
  });
});
