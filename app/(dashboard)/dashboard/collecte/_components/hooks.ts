'use client';

// app/(dashboard)/dashboard/collecte/_components/hooks.ts
//
// Hooks TanStack Query spécifiques à l'écran /dashboard/collecte (UI-DESIGN.md §3.3/§4).
//
// INCOHÉRENCE DÉTECTÉE (documentée aussi dans docs/JOURNAL.md) — comportement réel de
// `POST /api/collections/trigger` vs le flux décrit par UI-DESIGN §4.1 :
// UI-DESIGN suppose un endpoint "fire-and-poll" : la requête retourne vite avec un statut
// "lancé", puis le frontend poll jusqu'à l'état terminal. En réalité (app/api/collections/
// trigger/route.ts), le handler ATTEND la fin complète de la collecte avant de répondre 200 (il
// exécute `collectChainUseCase` en direct, `await`é) — la requête peut donc rester en vol jusqu'à
// `maxDuration` (300s, notamment pour Delhaize/Lidl en headless). Adaptation retenue ici plutôt
// que de reproduire un flux qui ne correspond pas à la réalité serveur :
//   1. Le toast "Collecte X lancée" (UI-DESIGN §4.1 étape 4) est déclenché immédiatement dans
//      `onMutate`, côté client uniquement (pas d'attente d'une réponse serveur "200 = démarré").
//   2. Le polling `refetchInterval` sur `/api/collections/status` reste néanmoins utile ET
//      fonctionnel : chaque enseigne écrit son état en base dès qu'elle termine
//      (`upsertRunChainStatus` par enseigne dans une boucle `Promise.allSettled`), donc une
//      requête concurrente (ou un autre onglet) voit les statuts individuels progresser AVANT
//      que la requête POST d'origine ne se termine. Le polling garde donc sa valeur pour le
//      feedback progressif décrit par UI-DESIGN §4.1 étape 5.
//   3. Le toast final "de résultat" (étape 6) est construit directement depuis la réponse de la
//      mutation (`onSuccess`), qui contient déjà le statut terminal exact — pas besoin de
//      détecter la fin via le polling pour CE toast précis.
//
// AUTRE INCOHÉRENCE — sémantique de `pending` : voir `hasActiveChain()` ci-dessous.

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/apiClient';
import type {
  CollectionRunsResponse,
  CollectionsStatusResponse,
  PromotionsResponse,
  TriggerResponse,
} from '@/lib/types/api';
import type { ToastRequest } from '@/lib/hooks/useToastQueue';
import { chainName, STATUS_POLL_INTERVAL_MS } from './constants';

const STATUS_KEY = ['collections', 'status'] as const;
const RUNS_KEY_PREFIX = 'collection-runs';
const PROMOTIONS_KEY_PREFIX = 'promotions';

/**
 * Seul `running` est traité comme état actif/non-terminal pour le déclenchement du polling ET
 * pour la désactivation des boutons de la Zone B. `pending` est EXCLU volontairement : c'est la
 * valeur par défaut renvoyée par `GET /api/collections/status` quand AUCUN `CollectionRunChain`
 * n'existe encore pour une enseigne (jamais collectée), pas un état transitoire "en file
 * d'attente" — le backend n'écrit d'ailleurs jamais explicitement `pending` avant `running`
 * (app/api/collections/trigger/route.ts appelle `upsertRunChainStatus` directement avec
 * `status: 'running'`). Une lecture littérale de UI-DESIGN §5 ("disabled si status ∈ {running,
 * pending}") désactiverait DÉFINITIVEMENT le bouton de déclenchement de toute enseigne jamais
 * encore collectée (les 4 enseignes sont `pending` au tout premier lancement du projet) — un bug
 * bloquant plutôt qu'une simple imprécision de design. Corrigé ici, signalé au PALETTE/UI-DESIGN
 * (alerte QA dans JOURNAL.md) plutôt que reproduit silencieusement.
 */
function hasActiveChain(chains: { status: string }[] | undefined): boolean {
  return (chains ?? []).some((chain) => chain.status === 'running');
}

export function useCollectionsStatusQuery() {
  return useQuery({
    queryKey: STATUS_KEY,
    queryFn: () => apiFetch<CollectionsStatusResponse>('/api/collections/status'),
    refetchInterval: (query) => (hasActiveChain(query.state.data?.chains) ? STATUS_POLL_INTERVAL_MS : false),
  });
}

export function useCollectionRunsQuery(page: number, limit: number) {
  return useQuery({
    queryKey: [RUNS_KEY_PREFIX, page, limit] as const,
    queryFn: () => apiFetch<CollectionRunsResponse>(`/api/collection-runs?page=${page}&limit=${limit}`),
    placeholderData: keepPreviousData,
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      const active = items.some((run) => run.chains.some((chain) => chain.status === 'running'));
      return active ? STATUS_POLL_INTERVAL_MS : false;
    },
  });
}

interface PromotionsQueryParams {
  storeChain: string | null;
  category: string;
  page: number;
  limit: number;
}

export function usePromotionsQuery(params: PromotionsQueryParams) {
  return useQuery({
    queryKey: [PROMOTIONS_KEY_PREFIX, params] as const,
    queryFn: () => {
      const search = new URLSearchParams();
      if (params.storeChain) search.set('storeChain', params.storeChain);
      if (params.category) search.set('category', params.category);
      search.set('page', String(params.page));
      search.set('limit', String(params.limit));
      return apiFetch<PromotionsResponse>(`/api/promotions?${search.toString()}`);
    },
    // Équivalent v5 de `keepPreviousData: true` (UI-DESIGN §4.4) — évite un flash vide au
    // changement de filtre.
    placeholderData: keepPreviousData,
  });
}

function toastKindForChainStatus(status: string): 'success' | 'error' | 'info' {
  if (status === 'complete') return 'success';
  if (status === 'failed') return 'error';
  return 'info'; // format_drift : avertissement — ni succès plein, ni erreur technique (PALETTE §2)
}

function describeChainResult(chain: { chainSlug: string; status: string; itemsCollected: number | null }): string {
  const name = chainName(chain.chainSlug);
  if (chain.status === 'complete') return `${name} : ${chain.itemsCollected ?? 0} promotions collectées`;
  if (chain.status === 'format_drift') return `${name} : dérive de format détectée, catalogue inchangé`;
  return `${name} : échec de la collecte`;
}

/**
 * Mutation de déclenchement (US-F1-11). `onMutate` applique le feedback optimiste <200ms exigé
 * par UI-DESIGN §4.1 : bascule locale du/des statut(s) concerné(s) à `running` dans le cache
 * `/api/collections/status`, avant toute réponse serveur.
 */
export function useTriggerCollectionMutation(pushToast: (toast: ToastRequest) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chainSlug: string | undefined) => {
      const controller = new AbortController();
      // Filet de sécurité côté client : la route serveur a `maxDuration = 300s`
      // (app/api/collections/trigger/route.ts) — on abandonne proprement plutôt que de laisser
      // un fetch pendre indéfiniment si la fonction serverless est tuée sans réponse HTTP propre.
      const timeoutId = setTimeout(() => controller.abort(), 305_000);
      try {
        return await apiFetch<TriggerResponse>('/api/collections/trigger', {
          method: 'POST',
          body: JSON.stringify(chainSlug ? { chainSlug } : {}),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }
    },
    onMutate: async (chainSlug) => {
      await queryClient.cancelQueries({ queryKey: STATUS_KEY });
      const previousStatus = queryClient.getQueryData<CollectionsStatusResponse>(STATUS_KEY);

      queryClient.setQueryData<CollectionsStatusResponse>(STATUS_KEY, (current) => {
        if (!current) return current;
        return {
          chains: current.chains.map((chain) =>
            !chainSlug || chain.chainSlug === chainSlug ? { ...chain, status: 'running' } : chain,
          ),
        };
      });

      pushToast({
        kind: 'info',
        message: chainSlug
          ? `Déclenchement de la collecte ${chainName(chainSlug)}…`
          : 'Déclenchement de la collecte pour toutes les enseignes…',
      });

      return { previousStatus };
    },
    onError: (error, _chainSlug, context) => {
      if (context?.previousStatus) {
        queryClient.setQueryData(STATUS_KEY, context.previousStatus);
      }
      const message =
        error instanceof ApiError
          ? error.message
          : 'Erreur réseau — la collecte a peut-être échoué, vérifiez l\'historique.';
      pushToast({ kind: 'error', message });
    },
    onSuccess: (data) => {
      const chain = data.chains.length === 1 ? data.chains[0] : undefined;
      if (chain) {
        pushToast({ kind: toastKindForChainStatus(chain.status), message: describeChainResult(chain) });
        return;
      }

      const okCount = data.chains.filter((chain) => chain.status === 'complete').length;
      const driftCount = data.chains.filter((chain) => chain.status === 'format_drift').length;
      const failedCount = data.chains.filter((chain) => chain.status === 'failed').length;
      const parts = [
        okCount > 0 ? `${okCount} enseigne${okCount > 1 ? 's' : ''} OK` : null,
        driftCount > 0 ? `${driftCount} dérive${driftCount > 1 ? 's' : ''} de format` : null,
        failedCount > 0 ? `${failedCount} échec${failedCount > 1 ? 's' : ''}` : null,
      ].filter((part): part is string => Boolean(part));

      pushToast({
        kind: failedCount > 0 ? 'error' : driftCount > 0 ? 'info' : 'success',
        message: `Collecte terminée : ${parts.join(', ')}`,
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: STATUS_KEY });
      void queryClient.invalidateQueries({ queryKey: [RUNS_KEY_PREFIX] });
      void queryClient.invalidateQueries({ queryKey: [PROMOTIONS_KEY_PREFIX] });
    },
  });
}
