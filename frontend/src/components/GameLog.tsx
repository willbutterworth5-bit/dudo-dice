import { RoundResult, Bid } from '../game/GameState';

interface GameLogProps {
  roundHistory: RoundResult[];
  currentBid: Bid | null;
}

export default function GameLog({ roundHistory, currentBid }: GameLogProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-gray-200 max-h-64 overflow-y-auto">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Game Log</h3>
      
      {currentBid && (
        <div className="mb-3 p-2 bg-blue-50 rounded border-l-4 border-blue-500">
          <p className="text-sm">
            <strong>Current Bid:</strong> {currentBid.quantity} {currentBid.faceValue === 1 ? 'ones' : `face ${currentBid.faceValue}s`}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {roundHistory.slice().reverse().map((result, index) => (
          <div key={index} className="text-sm p-2 bg-gray-50 rounded border-l-4 border-gray-400">
            <p>
              <strong>Round {result.round}:</strong> Bid was {result.challengedBid.quantity}{' '}
              {result.challengedBid.faceValue === 1 ? 'ones' : `face ${result.challengedBid.faceValue}s`}
            </p>
            <p className="text-gray-600">
              Actual count: {result.actualCount} | {result.winnerId === result.bidderId ? 'Bidder won' : 'Challenger won'}
            </p>
          </div>
        ))}
      </div>

      {roundHistory.length === 0 && (
        <p className="text-gray-500 text-sm italic">No rounds completed yet</p>
      )}
    </div>
  );
}
