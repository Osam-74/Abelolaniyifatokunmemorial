/**
 * A single candle. Flicker timing is derived from the candle's id so that
 * no two flames on the wall move in step, and so the animation is identical
 * on the server and the client.
 */
export default function Flame({ seed, size = 46 }: { seed: number; size?: number }) {
  const duration = 2.1 + ((seed * 37) % 90) / 100;
  const delay = ((seed * 53) % 200) / 100;

  return (
    <svg
      width={size}
      height={size * 1.9}
      viewBox="0 0 40 76"
      aria-hidden="true"
      style={
        {
          '--flick-dur': `${duration}s`,
          '--flick-delay': `${delay}s`,
        } as React.CSSProperties
      }
    >
      <defs>
        <linearGradient id={`wax-${seed}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#CAF0F8" />
          <stop offset="45%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#90E0EF" />
        </linearGradient>
        <radialGradient id={`glow-${seed}`}>
          <stop offset="0%" stopColor="#FFB454" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FFB454" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle className="flame-glow" cx="20" cy="20" r="19" fill={`url(#glow-${seed})`} />
      <rect x="13" y="30" width="14" height="42" rx="3" fill={`url(#wax-${seed})`} />
      <ellipse cx="20" cy="30.5" rx="7" ry="2.2" fill="#ffffff" opacity="0.85" />
      <line x1="20" y1="26" x2="20" y2="30" stroke="#2a2c78" strokeWidth="1.2" />
      <g className="flame">
        <path d="M20 8c4.4 4.2 6.6 7.6 6.6 11.2 0 3.9-3 6.8-6.6 6.8s-6.6-2.9-6.6-6.8C13.4 15.6 15.6 12.2 20 8z" fill="#FFB454" />
        <path d="M20 14c2.2 2.4 3.2 4.2 3.2 6 0 2.1-1.5 3.6-3.2 3.6s-3.2-1.5-3.2-3.6c0-1.8 1-3.6 3.2-6z" fill="#FFF3D6" />
      </g>
    </svg>
  );
}
