/**
 * AppLayout — Layout principal pour les pages authentifiees.
 * Desktop : sidebar gauche (Navbar) + zone contenu.
 * Mobile : contenu plein + bottom nav.
 */

import { Outlet } from 'react-router-dom';
import { Navbar } from '../organisms/Navbar';
import { BottomNav } from '../organisms/BottomNav';

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Sidebar desktop */}
      <Navbar />

      {/* Zone contenu */}
      <main className="flex-1 pb-16 sm:pb-0">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav mobile */}
      <BottomNav />
    </div>
  );
}
