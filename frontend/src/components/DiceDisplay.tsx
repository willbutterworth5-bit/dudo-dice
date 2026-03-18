import DiceFace from './DiceFace';

interface DiceDisplayProps {
  dice: number[];
  color: string;
  size?: 'sm' | 'md' | 'lg';
  showValues?: boolean;
}

export default function DiceDisplay({ dice, color, size = 'md', showValues = true }: DiceDisplayProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const colorClasses: { [key: string]: string } = {
    red: 'bg-red-500 border-red-600',
    green: 'bg-green-500 border-green-600',
    blue: 'bg-blue-500 border-blue-600',
    yellow: 'bg-yellow-400 border-yellow-500',
    orange: 'bg-orange-500 border-orange-600',
    black: 'bg-gray-800 border-gray-900',
  };

  const bgClass = colorClasses[color] || 'bg-gray-500 border-gray-600';

  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {dice.map((value, index) => (
        <div
          key={index}
          className={`
            ${sizeClasses[size]}
            ${bgClass}
            border-2
            rounded-lg
            flex
            items-center
            justify-center
            shadow-md
            transform
            transition-transform
            hover:scale-110
            relative
          `}
          style={{
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          }}
        >
          {showValues ? (
            <DiceFace value={value} size={size} />
          ) : (
            <span className="select-none text-white text-xs">?</span>
          )}
        </div>
      ))}
    </div>
  );
}
