interface TutorialSpotlightProps {
  targetRect: DOMRect | null;
  padding?: number;
}

export default function TutorialSpotlight({ targetRect, padding = 16 }: TutorialSpotlightProps) {
  // No targetRect → no overlay (full-screen steps show the board completely undimmed)
  if (!targetRect) {
    return null;
  }

  const x = targetRect.left - padding;
  const y = targetRect.top - padding;
  const w = targetRect.width + padding * 2;
  const h = targetRect.height + padding * 2;
  const r = 14; // corner radius of the spotlight hole

  // Using SVG evenodd fill rule: outer full-screen rect minus inner rounded-rect = hole
  return (
    <svg
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 40, width: '100vw', height: '100vh', top: 0, left: 0 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Dark overlay with hole cut via evenodd */}
      <path
        fillRule="evenodd"
        fill="rgba(0,0,0,0.62)"
        d={[
          // Outer rect (full screen)
          `M 0 0 H 100000 V 100000 H 0 Z`,
          // Inner rounded-rect hole (counter-clockwise to create hole)
          `M ${x + r} ${y}`,
          `H ${x + w - r}`,
          `Q ${x + w} ${y} ${x + w} ${y + r}`,
          `V ${y + h - r}`,
          `Q ${x + w} ${y + h} ${x + w - r} ${y + h}`,
          `H ${x + r}`,
          `Q ${x} ${y + h} ${x} ${y + h - r}`,
          `V ${y + r}`,
          `Q ${x} ${y} ${x + r} ${y}`,
          `Z`,
        ].join(' ')}
      />
      {/* Glowing border around the spotlight hole */}
      <rect
        x={x} y={y} width={w} height={h} rx={r}
        fill="none"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="2"
      />
      {/* Subtle inner glow */}
      <rect
        x={x + 3} y={y + 3} width={w - 6} height={h - 6} rx={r - 2}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1"
      />
    </svg>
  );
}
