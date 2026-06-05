/**
 * Dashboard — Vue d'ensemble connectee.
 * Promos du moment, liste active, economies estimees.
 */

import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useShoppingLists } from '../hooks/useShoppingList';
import { Button } from '../components/atoms/Button';
import { Spinner } from '../components/atoms/Spinner';

export function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { data: lists, isLoading } = useShoppingLists();

  const activeList = lists?.[0];

  return (
    <div className="flex flex-col gap-6">
      {/* Salutation */}
      <h1 className="text-2xl font-bold text-neutral-800">
        Bonjour{user?.email ? `, ${user.email.split('@')[0]}` : ''} !
      </h1>

      {/* Bandeau zone */}
      <div className="flex items-center justify-between px-4 py-3 bg-accent-50 rounded-lg border border-accent-100">
        <div className="flex items-center gap-2 text-sm text-accent-700">
          <MapPin size={16} aria-hidden="true" />
          <span>
            {user?.zoneCodePostal
              ? `${user.zoneCodePostal} ${user.zoneCommune ?? ''}`
              : 'Zone non definie'}
          </span>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="text-sm text-accent-600 hover:underline font-medium"
        >
          Modifier
        </button>
      </div>

      {/* Promos du moment */}
      <section aria-labelledby="promos-title" className="p-4 bg-white rounded-lg border border-neutral-200">
        <h2 id="promos-title" className="text-lg font-semibold text-neutral-800 mb-3">
          Promos du moment
        </h2>
        <p className="text-sm text-neutral-600 mb-4">
          Consultez les promotions actives et trouvez les meilleures offres.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/suggestions')}
          icon={<ArrowRight size={16} />}
        >
          Voir toutes les suggestions
        </Button>
      </section>

      {/* Liste active */}
      <section aria-labelledby="list-title" className="p-4 bg-white rounded-lg border border-neutral-200">
        <h2 id="list-title" className="text-lg font-semibold text-neutral-800 mb-3">
          Ma liste de courses
        </h2>
        {isLoading ? (
          <Spinner />
        ) : activeList ? (
          <div>
            <p className="text-sm text-neutral-600 mb-3">
              {activeList.name}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/lists/${activeList.id}`)}
              icon={<ArrowRight size={16} />}
            >
              Ouvrir la liste
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-neutral-500 mb-3">
              Aucune liste de courses. Creez-en une pour recevoir des suggestions !
            </p>
            <Button size="sm" onClick={() => navigate('/lists')}>
              Creer une liste
            </Button>
          </div>
        )}
      </section>

      {/* Economies */}
      <section aria-labelledby="savings-title" className="p-4 bg-primary-50 rounded-lg border border-primary-100">
        <h2 id="savings-title" className="text-lg font-semibold text-primary-800 mb-2">
          Economies estimees
        </h2>
        <p className="text-sm text-primary-700 mb-3">
          Completez votre liste et consultez les suggestions pour estimer vos economies.
        </p>
        <Button onClick={() => navigate('/route')} icon={<ArrowRight size={16} />}>
          Voir l'itineraire
        </Button>
      </section>
    </div>
  );
}
