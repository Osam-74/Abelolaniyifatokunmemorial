export type TributeKind = 'note' | 'candle' | 'flower';

export const TRIBUTE_KINDS: { id: TributeKind; label: string; verb: string }[] = [
  { id: 'flower', label: 'Lay a flower', verb: 'laid a flower' },
  { id: 'candle', label: 'Light a candle', verb: 'lit a candle' },
  { id: 'note', label: 'Leave a note', verb: 'left a note' },
];

export default function TributeIcon({ kind, size = 44 }: { kind: string; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 44 44', 'aria-hidden': true as const };

  if (kind === 'flower') {
    return (
      <svg {...common} fill="none">
        <g stroke="#0077B6" strokeWidth="1.4" strokeLinecap="round">
          <path d="M22 24v14" />
          <path d="M22 32c-4 0-7-2-8-5 3-1 6 0 8 5z" />
        </g>
        <g fill="#90E0EF" stroke="#0077B6" strokeWidth="1.2">
          <ellipse cx="22" cy="10" rx="4.2" ry="6" />
          <ellipse cx="22" cy="20" rx="4.2" ry="6" />
          <ellipse cx="15" cy="15" rx="6" ry="4.2" />
          <ellipse cx="29" cy="15" rx="6" ry="4.2" />
        </g>
        <circle cx="22" cy="15" r="3.2" fill="#FFB454" />
      </svg>
    );
  }

  if (kind === 'candle') {
    return (
      <svg {...common} fill="none">
        <rect x="16" y="18" width="12" height="20" rx="2.5" fill="#CAF0F8" stroke="#0077B6" strokeWidth="1.2" />
        <line x1="22" y1="14" x2="22" y2="18" stroke="#03045E" strokeWidth="1.3" />
        <path
          d="M22 4c3.6 3.4 5.4 6.2 5.4 9.1 0 3.2-2.4 5.5-5.4 5.5s-5.4-2.3-5.4-5.5C16.6 10.2 18.4 7.4 22 4z"
          fill="#FFB454"
        />
        <path d="M22 9c1.7 1.9 2.5 3.3 2.5 4.7 0 1.6-1.1 2.8-2.5 2.8s-2.5-1.2-2.5-2.8c0-1.4.8-2.8 2.5-4.7z" fill="#FFF3D6" />
      </svg>
    );
  }

  return (
    <svg {...common} fill="none">
      <rect x="9" y="7" width="26" height="30" rx="2.5" fill="#CAF0F8" stroke="#0077B6" strokeWidth="1.2" />
      <g stroke="#0077B6" strokeWidth="1.3" strokeLinecap="round" opacity="0.8">
        <line x1="15" y1="15" x2="29" y2="15" />
        <line x1="15" y1="21" x2="29" y2="21" />
        <line x1="15" y1="27" x2="24" y2="27" />
      </g>
    </svg>
  );
}
