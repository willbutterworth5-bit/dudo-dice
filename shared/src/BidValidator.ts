import { Bid, PalificoMode } from './GameState.js';

export class BidValidator {
  /**
   * Validate if a new bid is legal according to Perudo rules
   */
  static validateBid(
    newBid: Bid,
    currentBid: Bid | null,
    palificoMode: PalificoMode
  ): { valid: boolean; reason?: string } {
    // First bid of the round
    if (!currentBid) {
      // Check if this starts palifico mode (quantity = 1)
      if (newBid.quantity === 1) {
        return { valid: true };
      }
      // Any other first bid is valid
      return { valid: true };
    }

    // In palifico mode, face value must match the locked value
    if (palificoMode.active && palificoMode.lockedFaceValue !== null) {
      if (newBid.faceValue !== palificoMode.lockedFaceValue) {
        return {
          valid: false,
          reason: `In palifico mode, all bids must use face value ${palificoMode.lockedFaceValue}`,
        };
      }
    }

    const currentIsOnes = currentBid.faceValue === 1;
    const newIsOnes = newBid.faceValue === 1;

    // Bidding with ones
    if (newIsOnes && !currentIsOnes) {
      // Can bid ones at half quantity (rounded up)
      const minOnesQuantity = Math.ceil(currentBid.quantity / 2);
      if (newBid.quantity < minOnesQuantity) {
        return {
          valid: false,
          reason: `When bidding ones, quantity must be at least ${minOnesQuantity} (half of ${currentBid.quantity}, rounded up)`,
        };
      }
      return { valid: true };
    }

    // Bidding back from ones to non-ones
    if (!newIsOnes && currentIsOnes) {
      // Must double the quantity
      const minQuantity = currentBid.quantity * 2;
      if (newBid.quantity < minQuantity) {
        return {
          valid: false,
          reason: `When bidding back from ones, quantity must be at least ${minQuantity} (double of ${currentBid.quantity})`,
        };
      }
      return { valid: true };
    }

    // Both are ones or both are non-ones - standard rules apply
    if (newIsOnes && currentIsOnes) {
      // Bidding higher quantity of ones
      if (newBid.quantity <= currentBid.quantity) {
        return {
          valid: false,
          reason: 'New bid must have higher quantity than current bid',
        };
      }
      return { valid: true };
    }

    // Both are non-ones - standard rules
    // Can increase quantity, or increase face value with same or higher quantity
    if (newBid.quantity < currentBid.quantity) {
      return {
        valid: false,
        reason: 'New bid must have higher quantity than current bid',
      };
    }
    if (newBid.quantity === currentBid.quantity && newBid.faceValue <= currentBid.faceValue) {
      return {
        valid: false,
        reason: 'New bid must have higher quantity or higher face value',
      };
    }

    return { valid: true };
  }

  /**
   * Check if a bid starts palifico mode
   * Palifico starts when a player with only one die makes a bid with quantity 1
   */
  static checkPalificoStart(bid: Bid, playerDiceCount: number): boolean {
    return bid.quantity === 1 && playerDiceCount === 1;
  }
}
