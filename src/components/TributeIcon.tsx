export type TributeKind = 'note' | 'candle' | 'flower';

export const TRIBUTE_KINDS: { id: TributeKind; label: string; verb: string }[] = [
  { id: 'flower', label: 'Lay a flower', verb: 'laid a flower' },
  { id: 'candle', label: 'Light a candle', verb: 'lit a candle' },
  { id: 'note', label: 'Leave a note', verb: 'left a note' },
];

export default function TributeIcon({ kind, size = 44 }: { kind: string; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 44 44', 'aria-hidden': true as const };

  // A rose in bud, on a leafed stem.
  if (kind === 'flower') {
    return (
      <svg {...common} fill="none">
        <g stroke="#0077B6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 25.5V40" />
          <path d="M22 30.5c-1.2-3.3-4-5.2-7.6-5.2-.3 3.9 2.6 6.9 7.6 6.9" fill="#CAF0F8" />
          <path d="M22 35.5c1.1-2.9 3.7-4.6 6.9-4.6.3 3.5-2.4 6.2-6.9 6.2" fill="#CAF0F8" />
        </g>

        <g stroke="#0077B6" strokeWidth="1.5" strokeLinejoin="round">
          <path
            d="M22 5.5c5.4 0 9.6 4 9.6 9.4 0 6-4.6 10.6-9.6 10.6s-9.6-4.6-9.6-10.6c0-5.4 4.2-9.4 9.6-9.4z"
            fill="#90E0EF"
          />
          <path
            d="M22 9c3.2 0 5.7 2.3 5.7 5.4 0 3.6-2.6 6.5-5.7 6.5s-5.7-2.9-5.7-6.5C16.3 11.3 18.8 9 22 9z"
            fill="#CAF0F8"
          />
          <path d="M22 12.3c1.7 0 3 1.2 3 2.8 0 1.9-1.4 3.4-3 3.4s-3-1.5-3-3.4c0-1.6 1.3-2.8 3-2.8z" fill="#FFB454" />
        </g>

        <g stroke="#0077B6" strokeWidth="1.2" strokeLinecap="round" opacity="0.75">
          <path d="M14.6 11.6c1.8-2.4 4.4-3.8 7.4-3.8" />
          <path d="M29.4 18.4c-1.6 2.6-4.2 4.2-7.4 4.2" />
        </g>
      </svg>
    );
  }

  // A tall taper, burning, with wax gathered at the base.
  if (kind === 'candle') {
    return (
      <svg {...common} fill="none">
        <path
          d="M15.5 21c0-1.1.9-2 2-2h9c1.1 0 2 .9 2 2v15.5c0 1.4-1.1 2.5-2.5 2.5h-8c-1.4 0-2.5-1.1-2.5-2.5z"
          fill="#CAF0F8"
          stroke="#0077B6"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M15.5 24.5c2.2 1.2 4.4 1.2 6.5 0s4.3-1.2 6.5 0" stroke="#0077B6" strokeWidth="1.1" opacity="0.55" />
        <path d="M28.5 26.5c1.6 1 2.2 2.6 1.8 4.8-1.6-.6-2.5-2.2-1.8-4.8z" fill="#90E0EF" stroke="#0077B6" strokeWidth="1" strokeLinejoin="round" />

        <line x1="22" y1="15.5" x2="22" y2="19" stroke="#03045E" strokeWidth="1.5" strokeLinecap="round" />

        <path
          d="M22 2.5c4.6 4.3 6.9 7.9 6.9 11.4 0 3.9-3.1 6.7-6.9 6.7s-6.9-2.8-6.9-6.7c0-3.5 2.3-7.1 6.9-11.4z"
          fill="#FFB454"
        />
        <path
          d="M22 8.8c2.2 2.4 3.3 4.3 3.3 6.1 0 2.1-1.5 3.6-3.3 3.6s-3.3-1.5-3.3-3.6c0-1.8 1.1-3.7 3.3-6.1z"
          fill="#FFF3D6"
        />
      </svg>
    );
  }

  // A folded note.
  return (
    <svg {...common} fill="none">
      <path
        d="M10.5 8.5A2.5 2.5 0 0 1 13 6h14.5L34 12.5V36a2.5 2.5 0 0 1-2.5 2.5H13A2.5 2.5 0 0 1 10.5 36z"
        fill="#CAF0F8"
        stroke="#0077B6"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M27.5 6v6.5H34" stroke="#0077B6" strokeWidth="1.4" strokeLinejoin="round" fill="#90E0EF" />
      <g stroke="#0077B6" strokeWidth="1.3" strokeLinecap="round" opacity="0.75">
        <line x1="16" y1="20" x2="28" y2="20" />
        <line x1="16" y1="25" x2="28" y2="25" />
        <line x1="16" y1="30" x2="23" y2="30" />
      </g>
    </svg>
  );
}
