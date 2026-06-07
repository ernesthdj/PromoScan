/**
 * MapLayout — Layout page carte.
 * Desktop : carte 62% + panneau lateral 38% (phi ratio).
 * Mobile : carte pleine + drawer bas.
 */

import type { ReactNode } from 'react';
import clsx from 'clsx';

interface MapLayoutProps {
  map: ReactNode;
  panel: ReactNode;
  className?: string;
}

export function MapLayout({ map, panel, className }: MapLayoutProps) {
  return (
    <div className={clsx('flex flex-col lg:flex-row h-[calc(100vh-80px)]', className)}>
      {/* Carte */}
      <div className="flex-1 lg:w-[62%] min-h-[300px]">{map}</div>

      {/* Panneau resume */}
      <div className="lg:w-[38%] overflow-y-auto border-t lg:border-t-0 lg:border-l border-neutral-200 bg-white">
        {panel}
      </div>
    </div>
  );
}
