/**
 * AuthLayout — Layout pour les pages d'authentification (login, register).
 * Centrage vertical, card, logo.
 */

import { Outlet, Link } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold text-lg">
            PS
          </div>
          <span className="text-2xl font-bold text-neutral-800">PromoScan</span>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-md border border-neutral-200 p-6 sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
