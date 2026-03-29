import { Player, PalificoMode } from './GameState.js';

export class DiceCounter {
  /**
   * Count dice matching the bid across all players
   * @param players All players in the game
   * @param faceValue The face value to count
   * @param palificoMode Current palifico mode state
   * @returns Total count of matching dice
   */
  static countDice(
    players: Player[],
    faceValue: number,
    palificoMode: PalificoMode
  ): number {
    let count = 0;

    for (const player of players) {
      for (const die of player.dice) {
        if (palificoMode.active) {
          // In palifico mode, ones are NOT wild - only exact matches count
          if (die === faceValue) {
            count++;
          }
        } else {
          // Normal mode: ones are wild and count as any value
          if (die === faceValue || die === 1) {
            count++;
          }
        }
      }
    }

    return count;
  }

  /**
   * Count dice for a specific player
   */
  static countPlayerDice(
    player: Player,
    faceValue: number,
    palificoMode: PalificoMode
  ): number {
    let count = 0;

    for (const die of player.dice) {
      if (palificoMode.active) {
        if (die === faceValue) {
          count++;
        }
      } else {
        if (die === faceValue || die === 1) {
          count++;
        }
      }
    }

    return count;
  }
}
