// lib/infrastructure/supabase/middleware.ts
//
// Rafraîchit la session Supabase à chaque requête (nécessaire avec @supabase/ssr — les tokens
// d'accès expirent et doivent être renouvelés côté Edge avant d'atteindre les Route Handlers).
// Utilisé par middleware.ts (racine du projet).

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSupabaseSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Config manquante : on laisse passer la requête plutôt que de crasher le middleware global,
    // mais les routes protégées échoueront explicitement (401) faute de session vérifiable.
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options });
        response = NextResponse.next({ request: { headers: request.headers } });
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });

  // Force le rafraîchissement du token si nécessaire.
  await supabase.auth.getUser();

  return response;
}
