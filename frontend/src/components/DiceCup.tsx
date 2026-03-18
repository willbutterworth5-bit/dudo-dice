import DiceDisplay from './DiceDisplay';
import { Player } from '../game/GameState';

interface DiceCupProps {
  player: Player;
  isCurrentPlayer: boolean;
  showDice: boolean;
}

export default function DiceCup({ player, isCurrentPlayer, showDice }: DiceCupProps) {
  return (
    <div className="relative">
      <div
        className={`
          bg-white rounded-xl p-4 shadow-lg border-2 transition-all
          ${isCurrentPlayer ? 'border-blue-500 ring-4 ring-blue-200' : 'border-gray-200'}
        `}
      >
        <div className="text-center mb-2">
          <h3 className="font-semibold text-gray-800">{player.name}</h3>
          <p className="text-sm text-gray-600">{player.diceCount} dice</p>
        </div>
        {showDice || isCurrentPlayer ? (
          <DiceDisplay
            dice={player.dice}
            color={player.color}
            size="md"
            showValues={showDice || isCurrentPlayer}
          />
        ) : (
          <div className="flex gap-2 justify-center">
            {Array.from({ length: player.diceCount }).map((_, i) => (
              <div
                key={i}
                className="w-12 h-12 bg-gray-300 border-2 border-gray-400 rounded-lg flex items-center justify-center"
              >
                <span className="text-gray-500 text-xl">?</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
