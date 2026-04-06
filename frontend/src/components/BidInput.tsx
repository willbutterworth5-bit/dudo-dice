import { useState, useEffect } from 'react';
import { Bid } from '../game/GameState';
import { BidValidator } from '../game/BidValidator';
import DiceFace from './DiceFace';

interface BidInputProps {
  currentBid: Bid | null;
  palificoMode: { active: boolean; lockedFaceValue: number | null };
  playerId: string;
  onBid: (bid: Bid) => void;
  onChallenge: () => void;
  calzaEnabled?: boolean;
  onCalza?: () => void;
  disabled?: boolean;
}

export default function BidInput({
  currentBid,
  palificoMode,
  playerId,
  onBid,
  onChallenge,
  calzaEnabled = false,
  onCalza,
  disabled = false,
}: BidInputProps) {
  const [quantity, setQuantity] = useState(1);
  const [faceValue, setFaceValue] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [manuallyAdjusted, setManuallyAdjusted] = useState(false);

  useEffect(() => {
    if (palificoMode.active && palificoMode.lockedFaceValue !== null) {
      setFaceValue(palificoMode.lockedFaceValue);
    }
  }, [palificoMode]);

  useEffect(() => {
    if (currentBid) {
      // Suggest a valid starting point
      if (currentBid.faceValue === 1) {
        // Current bid is ones - suggest higher quantity of ones (can continue bidding ones)
        setQuantity(currentBid.quantity + 1);
        if (!palificoMode.active) {
          setFaceValue(1); // Default to ones, but user can change to non-ones
        }
      } else {
        // Current bid is non-ones
        setQuantity(currentBid.quantity + 1);
        setFaceValue(currentBid.faceValue);
      }
    } else {
      setQuantity(1);
      setFaceValue(2);
    }
    setError(null);
    setManuallyAdjusted(false);
  }, [currentBid, palificoMode.active]);

  const handleBid = () => {
    const bid: Bid = {
      quantity,
      faceValue,
      playerId,
    };

    const validation = BidValidator.validateBid(bid, currentBid, palificoMode);
    if (!validation.valid) {
      setError(validation.reason || 'Invalid bid');
      return;
    }

    setError(null);
    onBid(bid);
  };

  const getMinQuantity = (forFaceValue: number = faceValue): number => {
    if (!currentBid) return 1;

    if (forFaceValue === 1 && currentBid.faceValue !== 1) {
      // Bidding ones: floor(n/2) + 1 (strictly more than half)
      return Math.floor(currentBid.quantity / 2) + 1;
    } else if (forFaceValue !== 1 && currentBid.faceValue === 1) {
      // Bidding back from ones: must double
      return currentBid.quantity * 2;
    } else if (forFaceValue > currentBid.faceValue) {
      // Higher face value: same quantity is valid
      return currentBid.quantity;
    } else {
      // Same or lower face value: must increase quantity
      return currentBid.quantity + 1;
    }
  };

  const getMaxQuantity = (): number => {
    return 30; // Reasonable upper limit
  };

  // Can bid ones if not in palifico mode (validation will check if quantity is high enough)
  const canBidOnes = !palificoMode.active;
  const canBidNonOnes = !palificoMode.active || (palificoMode.lockedFaceValue !== null && faceValue === palificoMode.lockedFaceValue);

  return (
    <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-xl p-1.5 sm:p-3 shadow-2xl animate-fade-slide-up">
      {error && (
        <div className="bg-red-500/30 border border-red-400/40 text-red-100 px-2 py-1 rounded mb-1.5 text-xs">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        {/* Horizontal Container for Face Value and Quantity */}
        <div className="flex items-center gap-3 justify-center">
          {/* Face Value */}
          <div className="flex flex-col items-center">
            <label className="block text-[10px] font-medium text-white mb-1 text-center">Face Value</label>
            <div className="flex gap-1 flex-wrap justify-center" style={{ maxWidth: '112px' }}>
              {[1, 2, 3, 4, 5, 6].map((value) => {
                const isDisabled = value === 1 ? !canBidOnes : !canBidNonOnes;
                const isLocked = palificoMode.active && palificoMode.lockedFaceValue !== value;

                return (
                  <button
                    key={value}
                    onClick={() => {
                      if (!isDisabled && !isLocked) {
                        const newMin = getMinQuantity(value);
                        const switchingToOrFromOnes = (value === 1) !== (faceValue === 1);
                        setFaceValue(value);
                        if (switchingToOrFromOnes) {
                          // Always reset when switching to/from ones
                          setQuantity(newMin);
                          setManuallyAdjusted(false);
                        } else if (manuallyAdjusted && quantity >= newMin) {
                          // Keep manual quantity if still valid
                          // no change to quantity
                        } else {
                          setQuantity(newMin);
                        }
                        setError(null);
                      }
                    }}
                    disabled={disabled || isDisabled || isLocked}
                    className={`
                      w-8 h-8 rounded-lg transition-colors flex items-center justify-center relative
                      ${faceValue === value
                        ? 'bg-white/30 ring-2 ring-white shadow-sm'
                        : 'bg-white/15 border border-white/25'
                      }
                      ${isDisabled || isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      ${disabled ? 'opacity-50' : ''}
                    `}
                  >
                    <div className="w-6 h-6 bg-white rounded">
                      <DiceFace value={value} size="sm" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity */}
          <div className="flex flex-col items-center">
            <label className="block text-[10px] font-medium text-white mb-1 text-center">Quantity</label>
            <div className="flex items-center justify-center gap-1.5">
              <button
                onClick={() => {
                  const minQty = getMinQuantity();
                  if (quantity > minQty) {
                    setQuantity(quantity - 1);
                    setManuallyAdjusted(true);
                  }
                }}
                disabled={disabled || quantity <= getMinQuantity()}
                className="w-8 h-8 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-base flex items-center justify-center btn-glass"
              >
                −
              </button>
              <div className="w-12 h-8 bg-white/20 border border-white/30 rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-white">{quantity}</span>
              </div>
              <button
                onClick={() => {
                  const maxQty = getMaxQuantity();
                  if (quantity < maxQty) {
                    setQuantity(quantity + 1);
                    setManuallyAdjusted(true);
                  }
                }}
                disabled={disabled || quantity >= getMaxQuantity()}
                className="w-8 h-8 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-base flex items-center justify-center btn-glass"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1.5">
          {currentBid && (
            <button
              onClick={onChallenge}
              disabled={disabled}
              className="flex-1 bg-accent-danger hover:bg-accent-danger-hover disabled:bg-gray-300 text-white font-semibold py-2 px-3 rounded-xl transition-colors text-sm btn-3d-danger"
            >
              Dudo
            </button>
          )}
          <button
            onClick={handleBid}
            disabled={disabled}
            className="flex-1 bg-accent hover:bg-accent-hover disabled:bg-gray-300 text-white font-semibold py-2 px-3 rounded-xl transition-colors text-sm btn-3d-accent"
          >
            Bid
          </button>
          {currentBid && calzaEnabled && (
            <button
              onClick={onCalza}
              disabled={disabled}
              className="px-3 py-2 text-white font-semibold rounded-xl transition-colors text-xs btn-3d-calza disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Calza
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
