'use server';

// app/(auth)/login/actions.ts
//
// Server Action de connexion — évite d'introduire un client Supabase navigateur (et donc les
// variables NEXT_PUBLIC_SUPABASE_* absentes de .env.example) pour un simple prérequis technique
// d'accès à /dashboard/collecte (pas l'écran cible de cette tâche, cf. consigne "sans
// sur-designer"). Le formulaire fonctionne en pure progressive enhancement (POST natif), aucun
// JS client requis pour l'authentification elle-même.

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '../../../lib/infrastructure/supabase/server';

export type LoginErrorCode = 'missing_fields' | 'invalid_credentials';

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    redirect('/login?error=missing_fields');
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect('/login?error=invalid_credentials');
  }

  redirect('/dashboard/collecte');
}
