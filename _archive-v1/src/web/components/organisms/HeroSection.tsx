/**
 * HeroSection — Section hero de la landing page.
 * "Vos courses, moins cheres, plus malin."
 */

import clsx from 'clsx';
import { Button } from '../atoms/Button';

interface HeroSectionProps {
  onRegister: () => void;
  onLogin: () => void;
  className?: string;
}

export function HeroSection({ onRegister, onLogin, className }: HeroSectionProps) {
  return (
    <section
      className={clsx(
        'flex flex-col items-center justify-center text-center',
        'px-4 py-16 sm:py-24',
        className,
      )}
    >
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 leading-tight max-w-lg">
        Vos courses,{' '}
        <span className="text-primary-500">moins cheres</span>,{' '}
        <span className="text-secondary-500">plus malin</span>.
      </h1>
      <p className="mt-4 text-lg text-neutral-600 max-w-md">
        PromoScan analyse les promos de 6 enseignes belges et optimise votre itineraire de courses.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Button size="lg" onClick={onRegister}>
          S'inscrire gratuitement
        </Button>
        <Button variant="ghost" size="lg" onClick={onLogin}>
          Se connecter
        </Button>
      </div>
    </section>
  );
}
