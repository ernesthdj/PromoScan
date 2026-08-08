// app/api/collections/status/route.ts
//
// GET /api/collections/status — endpoint NON prévu dans docs/API-ENDPOINTS.md (contrat figé par
// l'Architecte). Ajouté ici en réponse au point ouvert signalé par l'UI/UX Designer
// (docs/UI-DESIGN.md, "Prochaines étapes" : "envisager un endpoint léger GET
// /api/collections/status si la dérivation côté frontend s'avère complexe").
//
// DÉCISION (Backend #4) : un endpoint dédié est nécessaire, pas une simple dérivation cliente.
// Justification :
//   1. TriggerControlPanel a besoin de l'état COURANT des 4 enseignes (dernier CollectionRunChain
//      connu par storeChainId, tous runs confondus), pas seulement du dernier CollectionRun.
//   2. GET /api/collection-runs retourne des runs paginés par date de run, pas par enseigne : une
//      enseigne peut être absente du run le plus récent (ex. déclenchement manuel ciblé sur une
//      seule des 4 enseignes) sans que son état antérieur soit visible sur la première page.
//      Reconstituer "le dernier état connu par enseigne" côté client obligerait à paginer
//      /api/collection-runs jusqu'à couvrir les 4 enseignes — fragile et coûteux en requêtes.
//   3. Côté serveur, la même information s'obtient en une passe avec une requête par enseigne
//      (4 enseignes fixes au MVP — YAGNI, pas de groupBy générique nécessaire), triée par
//      CollectionRun.startedAt décroissant.
// Alternative écartée : étendre /api/collection-runs avec un paramètre "latest per chain" —
// rejeté pour ne pas modifier un contrat déjà figé par l'Architecte pour un besoin différent
// (historique paginé vs état courant).
//
// Auth : session Supabase (même mécanisme que les autres endpoints de lecture protégés).
// Réponse : { success, data: { chains: [{ chainSlug, status, itemsCollected, updatedAt, runId }] } }

import { prisma } from '../../../../lib/infrastructure/prisma';
import { getAuthenticatedUser } from '../../../../lib/infrastructure/supabase/server';
import { listActiveStoreChains } from '../../../../lib/infrastructure/repositories/storeChainRepository';
import { jsonError, jsonSuccess } from '../../../../lib/infrastructure/apiResponse';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return jsonError('UNAUTHORIZED', 'Session invalide ou absente', 401);
  }

  const activeChains = await listActiveStoreChains(prisma);

  const chains = await Promise.all(
    activeChains.map(async (chain) => {
      const latest = await prisma.collectionRunChain.findFirst({
        where: { storeChainId: chain.id },
        orderBy: { collectionRun: { startedAt: 'desc' } },
        select: {
          status: true,
          itemsCollected: true,
          finishedAt: true,
          startedAt: true,
          collectionRunId: true,
        },
      });

      return {
        chainSlug: chain.slug,
        status: latest?.status ?? 'pending',
        itemsCollected: latest?.itemsCollected ?? null,
        updatedAt: (latest?.finishedAt ?? latest?.startedAt)?.toISOString() ?? null,
        runId: latest?.collectionRunId ?? null,
      };
    }),
  );

  return jsonSuccess({ chains });
}
