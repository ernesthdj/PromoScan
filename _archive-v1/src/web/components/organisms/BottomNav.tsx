/**
 * BottomNav — Navigation mobile 4 onglets.
 * Visible uniquement en dessous de 768px.
 * Hauteur 56px (> 44px pour Fitts tactile).
 */

import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { Home, ClipboardList, Flame, Map } from 'lucide-react';

const tabs = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/lists', icon: ClipboardList, label: 'Liste' },
  { to: '/promos', icon: Flame, label: 'Promos' },
  { to: '/route', icon: Map, label: 'Carte' },
] as const;

export function BottomNav() {
  return (
    <nav
      aria-label="Navigation principale"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200"
    >
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center gap-0.5',
                'w-full h-full min-w-[44px]',
                'text-xs font-medium transition-colors duration-fast',
                isActive
                  ? 'text-primary-500'
                  : 'text-neutral-400 hover:text-neutral-600',
              )
            }
          >
            {({ isActive }) => (
              <>
                <tab.icon
                  size={22}
                  fill={isActive ? 'currentColor' : 'none'}
                  aria-hidden="true"
                />
                <span>{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
