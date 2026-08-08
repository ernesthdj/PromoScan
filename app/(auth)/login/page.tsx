// app/(auth)/login/page.tsx
//
// Page de connexion — formulaire fonctionnel Supabase Auth (email/password) via Server Action
// (./actions.ts). Prérequis technique pour accéder à /dashboard/collecte, PAS l'écran cible de
// cette tâche (docs/UI-DESIGN.md ne le spécifie pas) — volontairement simple, sans sur-design.

import { Button, TextInput } from '../../../components/atoms';
import { loginAction } from './actions';

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields: 'Email et mot de passe requis.',
  invalid_credentials: 'Identifiants invalides.',
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const errorMessage = searchParams.error ? ERROR_MESSAGES[searchParams.error] ?? 'Une erreur est survenue.' : null;

  return (
    <main className="flex w-full items-center justify-center bg-base-bg p-4">
      <form
        action={loginAction}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-base-border bg-base-surface p-6"
      >
        <div>
          <h1 className="text-lg font-semibold text-base-text">Connexion — PromoScan</h1>
          <p className="text-sm text-base-text-secondary">Accès réservé (compte unique).</p>
        </div>

        {errorMessage && (
          <p role="alert" className="rounded-md bg-status-error-bg px-3 py-2 text-sm text-status-error-fg">
            {errorMessage}
          </p>
        )}

        <TextInput label="Email" name="email" type="email" autoComplete="username" required />
        <TextInput label="Mot de passe" name="password" type="password" autoComplete="current-password" required />

        <Button type="submit" variant="primary" className="w-full">
          Se connecter
        </Button>
      </form>
    </main>
  );
}
