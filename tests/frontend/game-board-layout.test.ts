import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BOARD_BASE,
  getBoardScale,
  getBoardSizeForAvailableSpace,
  getResponsiveBoardSize,
} from '../../frontend/src/components/game-board/layout.ts';

describe('getResponsiveBoardSize', () => {
  it('keeps the existing mobile width-driven sizing', () => {
    assert.equal(getResponsiveBoardSize(390, 844), 342);
    assert.equal(getResponsiveBoardSize(412, 915), 364);
  });

  it('still allows the full board size on taller desktop screens', () => {
    assert.equal(getResponsiveBoardSize(1440, 980), BOARD_BASE);
  });
});

describe('getBoardSizeForAvailableSpace', () => {
  it('fits the board to the remaining desktop slot', () => {
    assert.equal(getBoardSizeForAvailableSpace(900, 340), 340);
    assert.equal(getBoardSizeForAvailableSpace(420, 500), 420);
  });

  it('never returns a negative board size', () => {
    assert.equal(getBoardSizeForAvailableSpace(-10, 300), 0);
    assert.equal(getBoardSizeForAvailableSpace(300, -10), 0);
  });
});

describe('getBoardScale', () => {
  it('scales exactly to the computed board size with no minimum floor', () => {
    assert.equal(getBoardScale(340), 340 / BOARD_BASE);
    assert.equal(getBoardScale(0), 0);
  });
});
