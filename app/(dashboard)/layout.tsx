// app/(dashboard)/layout.tsx
//
// Vérifie la session Supabase côté serveur, redirige vers /login sinon (docs/ARCHITECTURE.md §3).
// Défense en profondeur : le middleware.ts racine fait déjà un contrôle heuristique sur le cookie
// de présence de session pour l'UX (redirection rapide) ; ce layout fait le contrôle réel via
// `supabase.auth.getUser()`, seule source de vérité sur la validité de la session.

import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '../../lib/infrastructure/supabase/server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect('/login');
  }

  return <div>{children}</div>;
}
