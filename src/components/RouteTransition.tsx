'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/** Re-keys on navigation so each page settles in instead of snapping. */
export default function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="route-enter">
      {children}
    </div>
  );
}
