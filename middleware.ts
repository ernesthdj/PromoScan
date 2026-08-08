// middleware.ts (racine) — rafraîchit la session Supabase et protège /dashboard/*
// (docs/ARCHITECTURE.md §3 : "middleware.ts — rafraichit la session Supabase, protege /dashboard/*")

import { NextResponse, type NextRequest } from 'next/server';
import { updateSupabaseSession } from './lib/infrastructure/supabase/middleware';

export async function middleware(request: NextRequest) {
  const response = await updateSupabaseSession(request);

  // La vérification stricte de session pour les routes /dashboard/* est également effectuée
  // côté layout serveur ((dashboard)/layout.tsx) et côté chaque Route Handler API — défense en
  // profondeur plutôt qu'une dépendance unique au middleware (qui ne fait ici que rafraîchir le
  // cookie de session, pas l'autorisation finale).
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const hasSessionCookie = request.cookies
      .getAll()
      .some((cookie) => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token'));

    if (!hasSessionCookie) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/promotions/:path*', '/api/collection-runs/:path*'],
};
