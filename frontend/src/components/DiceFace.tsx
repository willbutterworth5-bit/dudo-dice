interface DiceFaceProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function DiceFace({ value, size = 'md' }: DiceFaceProps) {
  const dotSize = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
  };

  // Dot patterns for each dice value (1-6)
  // Using percentage-based positioning for flexibility
  const dotPatterns: { [key: number]: Array<{ x: string; y: string }> } = {
    1: [{ x: '50%', y: '50%' }], // center
    2: [{ x: '25%', y: '25%' }, { x: '75%', y: '75%' }], // diagonal
    3: [{ x: '25%', y: '25%' }, { x: '50%', y: '50%' }, { x: '75%', y: '75%' }], // diagonal
    4: [{ x: '25%', y: '25%' }, { x: '75%', y: '25%' }, { x: '25%', y: '75%' }, { x: '75%', y: '75%' }], // corners
    5: [{ x: '25%', y: '25%' }, { x: '75%', y: '25%' }, { x: '50%', y: '50%' }, { x: '25%', y: '75%' }, { x: '75%', y: '75%' }], // corners + center
    6: [{ x: '25%', y: '20%' }, { x: '75%', y: '20%' }, { x: '25%', y: '50%' }, { x: '75%', y: '50%' }, { x: '25%', y: '80%' }, { x: '75%', y: '80%' }], // two columns
  };

  const dots = dotPatterns[value] || [];

  return (
    <div className="relative w-full h-full">
      {dots.map((dot, index) => (
        <div
          key={index}
          className={`absolute ${dotSize[size]} bg-black rounded-full`}
          style={{
            left: dot.x,
            top: dot.y,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
}
