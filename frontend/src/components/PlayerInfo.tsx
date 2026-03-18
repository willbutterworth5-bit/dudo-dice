import { Player } from '../game/GameState';

interface PlayerInfoProps {
  player: Player;
  isCurrentPlayer: boolean;
  isEliminated: boolean;
}

export default function PlayerInfo({ player, isCurrentPlayer, isEliminated }: PlayerInfoProps) {
  const colorClasses: { [key: string]: string } = {
    red: 'bg-red-100 border-red-300',
    green: 'bg-green-100 border-green-300',
    blue: 'bg-blue-100 border-blue-300',
    yellow: 'bg-yellow-100 border-yellow-300',
    orange: 'bg-orange-100 border-orange-300',
    black: 'bg-gray-100 border-gray-300',
  };

  const bgClass = colorClasses[player.color] || 'bg-gray-100';

  return (
    <div
      className={`
        ${bgClass}
        border-2 rounded-lg p-3 transition-all
        ${isCurrentPlayer ? 'ring-2 ring-blue-500 scale-105' : ''}
        ${isEliminated ? 'opacity-50' : ''}
      `}
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-gray-800">{player.name}</h4>
          <p className="text-sm text-gray-600">
            {isEliminated ? 'Eliminated' : `${player.diceCount} dice`}
          </p>
        </div>
        {isCurrentPlayer && (
          <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
            Your Turn
          </div>
        )}
      </div>
    </div>
  );
}
