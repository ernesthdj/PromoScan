/**
 * Navbar — Navigation desktop (sidebar gauche).
 * Affichee uniquement a partir de 768px (sm breakpoint).
 * Repliable de 240px a 64px (icones seules).
 */

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  Home,
  ClipboardList,
  Flame,
  Map,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface NavItem {
  to: string;
  icon: typeof Home;
  label: string;
}

const mainNavItems: NavItem[] = [
  { to: '/dashboard', icon: Home, label: 'Accueil' },
  { to: '/lists', icon: ClipboardList, label: 'Ma liste' },
  { to: '/promos', icon: Flame, label: 'Promos' },
  { to: '/route', icon: Map, label: 'Carte' },
];

export function Navbar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();

  return (
    <nav
      aria-label="Navigation principale"
      className={clsx(
        'hidden sm:flex flex-col h-screen sticky top-0',
        'bg-white border-r border-neutral-200',
        'transition-all duration-normal',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-neutral-100">
        <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold text-sm">
          PS
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-neutral-800">PromoScan</span>
        )}
      </div>

      {/* Nav items */}
      <div className="flex-1 flex flex-col gap-1 px-2 py-4">
        {mainNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                'text-sm font-medium transition-colors duration-fast',
                'min-h-[44px]',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800',
              )
            }
          >
            <item.icon size={20} aria-hidden="true" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </div>

      {/* Bottom section */}
      <div className="border-t border-neutral-100 px-2 py-4 flex flex-col gap-1">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg',
              'text-sm font-medium transition-colors duration-fast min-h-[44px]',
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-neutral-600 hover:bg-neutral-50',
            )
          }
        >
          <Settings size={20} aria-hidden="true" />
          {!collapsed && <span>Profil</span>}
        </NavLink>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-600 hover:bg-red-50 hover:text-error-500 transition-colors min-h-[44px]"
        >
          <LogOut size={20} aria-hidden="true" />
          {!collapsed && <span>Deconnexion</span>}
        </button>

        {/* Toggle collapse */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Developper le menu' : 'Replier le menu'}
          className="flex items-center justify-center mt-2 p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 transition-colors"
        >
          {collapsed ? (
            <ChevronRight size={18} aria-hidden="true" />
          ) : (
            <ChevronLeft size={18} aria-hidden="true" />
          )}
        </button>
      </div>
    </nav>
  );
}
