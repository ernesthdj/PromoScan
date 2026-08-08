/**
 * Login — Formulaire de connexion.
 * React Hook Form + Zod validation.
 */

import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
  const { login, isLoggingIn, loginError } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  function onSubmit(data: LoginFormData) {
    login(data);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-800 mb-6">Connexion</h1>

      {loginError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert">
          {loginError instanceof Error ? loginError.message : 'Erreur de connexion'}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" loading={isLoggingIn} className="mt-2">
          Se connecter
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Pas encore de compte ?{' '}
        <Link to="/register" className="text-accent-600 hover:underline font-medium">
          S'inscrire
        </Link>
      </p>
    </div>
  );
}
