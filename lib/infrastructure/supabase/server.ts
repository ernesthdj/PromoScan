// lib/infrastructure/supabase/server.ts
//
// Client Supabase côté serveur (Route Handlers, Server Components), auth par cookies httpOnly
// via @supabase/ssr — remplace le JWT custom de la v1 (docs/FOUNDATION.md §5).

import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement manquante: ${name}`);
  }
  return value;
}

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_ANON_KEY'), {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Appelé depuis un Server Component (lecture seule) : la session sera rafraîchie par
          // le middleware. Cf. doc Supabase @supabase/ssr — comportement attendu, pas une erreur.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {
          // idem set()
        }
      },
    },
  });
}

/**
 * Vérifie la session utilisateur côté serveur pour les Route Handlers protégés
 * (`/api/promotions`, `/api/collection-runs`, `/api/collections/trigger`, `/api/collections/status`).
 * Retourne `null` si aucune session valide — l'appelant répond alors 401.
 */
export async function getAuthenticatedUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }
  return user;
}
