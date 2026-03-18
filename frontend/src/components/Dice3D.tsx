import { useEffect, useState } from 'react';

interface Dice3DProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  isRolling?: boolean;
}

export default function Dice3D({ value, size = 'md', isRolling = false }: Dice3DProps) {
  const [rotation, setRotation] = useState({ x: -20, y: 20, z: 0 });

  useEffect(() => {
    if (isRolling) {
      // Random rotation for rolling effect
      const interval = setInterval(() => {
        setRotation({
          x: Math.random() * 360,
          y: Math.random() * 360,
          z: Math.random() * 360,
        });
      }, 100);
      return () => clearInterval(interval);
    } else {
      // Return to default 3D view
      setRotation({ x: -20, y: 20, z: 0 });
    }
  }, [isRolling]);

  const sizeClasses = {
    sm: { size: 28, dot: 'w-1 h-1', container: 'w-7 h-7' },
    md: { size: 48, dot: 'w-1.5 h-1.5', container: 'w-12 h-12' },
    lg: { size: 64, dot: 'w-2 h-2', container: 'w-16 h-16' },
  };

  const dimensions = sizeClasses[size];
  const cubeSize = dimensions.size;
  const halfSize = cubeSize / 2;

  // Dot patterns for each dice value (1-6)
  const dotPatterns: { [key: number]: Array<{ x: string; y: string }> } = {
    1: [{ x: '50%', y: '50%' }],
    2: [{ x: '25%', y: '25%' }, { x: '75%', y: '75%' }],
    3: [{ x: '25%', y: '25%' }, { x: '50%', y: '50%' }, { x: '75%', y: '75%' }],
    4: [{ x: '25%', y: '25%' }, { x: '75%', y: '25%' }, { x: '25%', y: '75%' }, { x: '75%', y: '75%' }],
    5: [{ x: '25%', y: '25%' }, { x: '75%', y: '25%' }, { x: '50%', y: '50%' }, { x: '25%', y: '75%' }, { x: '75%', y: '75%' }],
    6: [{ x: '25%', y: '20%' }, { x: '75%', y: '20%' }, { x: '25%', y: '50%' }, { x: '75%', y: '50%' }, { x: '25%', y: '80%' }, { x: '75%', y: '80%' }],
  };

  const dots = dotPatterns[value] || [];
  const backDots = dotPatterns[7 - value] || [];

  return (
    <div 
      className={`${dimensions.container} relative flex items-center justify-center`}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        className="relative"
        style={{
          width: `${cubeSize}px`,
          height: `${cubeSize}px`,
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`,
          transition: isRolling ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {/* Front face (shows the value) */}
        <div
          className="absolute bg-white border-2 border-gray-300 rounded-sm"
          style={{
            width: `${cubeSize}px`,
            height: `${cubeSize}px`,
            transform: `translateZ(${halfSize}px)`,
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.2)',
            backfaceVisibility: 'hidden',
          }}
        >
          <div className="relative w-full h-full">
            {dots.map((dot, index) => (
              <div
                key={index}
                className={`absolute ${dimensions.dot} bg-black rounded-full`}
                style={{
                  left: dot.x,
                  top: dot.y,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Back face (opposite side) */}
        <div
          className="absolute bg-white border-2 border-gray-300 rounded-sm"
          style={{
            width: `${cubeSize}px`,
            height: `${cubeSize}px`,
            transform: `translateZ(-${halfSize}px) rotateY(180deg)`,
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.2)',
            backfaceVisibility: 'hidden',
          }}
        >
          <div className="relative w-full h-full">
            {backDots.map((dot, index) => (
              <div
                key={index}
                className={`absolute ${dimensions.dot} bg-black rounded-full`}
                style={{
                  left: dot.x,
                  top: dot.y,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Top face */}
        <div
          className="absolute bg-white border-2 border-gray-200 rounded-sm"
          style={{
            width: `${cubeSize}px`,
            height: `${cubeSize}px`,
            transform: `rotateX(90deg) translateZ(${halfSize}px)`,
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
            backfaceVisibility: 'hidden',
          }}
        />

        {/* Bottom face */}
        <div
          className="absolute bg-white border-2 border-gray-400 rounded-sm"
          style={{
            width: `${cubeSize}px`,
            height: `${cubeSize}px`,
            transform: `rotateX(-90deg) translateZ(${halfSize}px)`,
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
            backfaceVisibility: 'hidden',
          }}
        />

        {/* Right face */}
        <div
          className="absolute bg-white border-2 border-gray-300 rounded-sm"
          style={{
            width: `${cubeSize}px`,
            height: `${cubeSize}px`,
            transform: `rotateY(90deg) translateZ(${halfSize}px)`,
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
            backfaceVisibility: 'hidden',
          }}
        />

        {/* Left face */}
        <div
          className="absolute bg-white border-2 border-gray-300 rounded-sm"
          style={{
            width: `${cubeSize}px`,
            height: `${cubeSize}px`,
            transform: `rotateY(-90deg) translateZ(${halfSize}px)`,
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
            backfaceVisibility: 'hidden',
          }}
        />
      </div>
    </div>
  );
}