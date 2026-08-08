'use client';

// components/providers/QueryProvider.tsx
//
// Provider TanStack Query racine (UI-DESIGN.md — mutation optimiste onMutate + refetchInterval
// conditionnel). Monté une seule fois dans app/layout.tsx pour être disponible à tout écran futur
// (F2/F3/F4), pas seulement /dashboard/collecte.

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Un dashboard technique solo-utilisateur ne bénéficie pas d'un cache long — on
            // privilégie la fraîcheur des statuts de collecte à l'économie de requêtes.
            staleTime: 10_000,
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
