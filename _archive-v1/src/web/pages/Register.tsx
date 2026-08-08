/**
 * Register — Formulaire d'inscription avec zone geo + consentement RGPD.
 * React Hook Form + Zod validation.
 */

import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { Checkbox } from '../components/atoms/Checkbox';

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z
    .string()
    .min(8, 'Minimum 8 caracteres')
    .regex(/[A-Z]/, 'Au moins une majuscule')
    .regex(/[0-9]/, 'Au moins un chiffre'),
  confirmPassword: z.string(),
  zoneCodePostal: z
    .string()
    .regex(/^[1-9]\d{3}$/, 'Code postal belge invalide (4 chiffres)')
    .optional()
    .or(z.literal('')),
  rgpdConsent: z.literal(true, {
    errorMap: () => ({ message: 'Vous devez accepter la politique de confidentialite' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function Register() {
  const { register: registerUser, isRegistering, registerError } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { rgpdConsent: false as unknown as true },
  });

  function onSubmit(data: RegisterFormData) {
    registerUser({
      email: data.email,
      password: data.password,
      zoneCodePostal: data.zoneCodePostal || undefined,
      rgpdConsent: data.rgpdConsent,
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-800 mb-6">Inscription</h1>

      {registerError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert">
          {registerError instanceof Error ? registerError.message : 'Erreur d\'inscription'}
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
          autoComplete="new-password"
          helperText="Minimum 8 caracteres, 1 majuscule, 1 chiffre"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirmer le mot de passe"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Input
          label="Code postal (optionnel)"
          type="text"
          inputMode="numeric"
          maxLength={4}
          placeholder="1000"
          helperText="Code postal belge, 4 chiffres"
          error={errors.zoneCodePostal?.message}
          {...register('zoneCodePostal')}
        />

        <div className="flex flex-col gap-1">
          <Checkbox
            label="J'accepte la politique de confidentialite et le traitement de mes donnees (RGPD)"
            {...register('rgpdConsent')}
          />
          {errors.rgpdConsent && (
            <span className="text-sm text-error-600" role="alert">
              {errors.rgpdConsent.message}
            </span>
          )}
        </div>

        <Button type="submit" loading={isRegistering} className="mt-2">
          S'inscrire
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Deja membre ?{' '}
        <Link to="/login" className="text-accent-600 hover:underline font-medium">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
