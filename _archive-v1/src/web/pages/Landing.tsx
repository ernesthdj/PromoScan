/**
 * Landing — Page d'accueil pour visiteurs non connectes.
 * Hero + features + enseignes.
 */

import { useNavigate } from 'react-router-dom';
import { ShoppingCart, MapPin, Zap } from 'lucide-react';
import { HeroSection } from '../components/organisms/HeroSection';
import { BRAND_LABELS } from '../utils/constants';
import { Brand } from '../../shared/enums';

const features = [
  {
    icon: <Zap size={32} className="text-secondary-500" />,
    title: 'Promos automatiques',
    description: 'Les promotions de 6 enseignes belges, analysees chaque semaine par IA.',
  },
  {
    icon: <ShoppingCart size={32} className="text-primary-500" />,
    title: 'Liste personnalisee',
    description: 'Creez votre liste de courses et recevez des suggestions adaptees.',
  },
  {
    icon: <MapPin size={32} className="text-accent-500" />,
    title: 'Itineraire optimise',
    description: 'Un trajet multi-magasins calcule pour maximiser vos economies.',
  },
];

const steps = [
  { number: 1, text: 'Creez votre liste de courses' },
  { number: 2, text: 'On trouve les meilleures promos' },
  { number: 3, text: 'Suivez l\'itineraire optimise' },
];

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold text-sm">
            PS
          </div>
          <span className="text-lg font-bold text-neutral-800">PromoScan</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800"
          >
            Connexion
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-4 py-2 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            S'inscrire
          </button>
        </div>
      </header>

      {/* Hero */}
      <HeroSection
        onRegister={() => navigate('/register')}
        onLogin={() => navigate('/login')}
      />

      {/* Features */}
      <section className="px-4 py-12 sm:py-16 bg-neutral-50">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="flex flex-col items-center text-center gap-3">
              {feature.icon}
              <h3 className="text-base font-semibold text-neutral-800">{feature.title}</h3>
              <p className="text-sm text-neutral-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comment ca marche */}
      <section className="px-4 py-12 sm:py-16">
        <h2 className="text-2xl font-bold text-center text-neutral-800 mb-8">
          Comment ca marche ?
        </h2>
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          {steps.map((step) => (
            <div key={step.number} className="flex items-center gap-4">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-500 text-white font-bold">
                {step.number}
              </span>
              <p className="text-lg text-neutral-700">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Enseignes */}
      <section className="px-4 py-8 bg-neutral-50 border-t border-neutral-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-sm text-neutral-500 mb-4">
            Promotions analysees chez
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {Object.values(Brand).map((brand) => (
              <span
                key={brand}
                className="text-lg font-semibold text-neutral-400"
              >
                {BRAND_LABELS[brand]}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-6 text-center text-sm text-neutral-400 border-t border-neutral-100">
        PromoScan &copy; 2026 &mdash; A propos &middot; CGU &middot; Contact
      </footer>
    </div>
  );
}
