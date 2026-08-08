// app/(dashboard)/dashboard/collecte/_components/constants.ts
//
// Liste des 4 enseignes actives — codée en dur côté frontend, conformément à
// docs/API-ENDPOINTS.md ("Notes transverses" : "la liste des enseignes valides... n'est pas
// exposée par un endpoint dédié (YAGNI — 4 enseignes fixes au MVP)"). Les endpoints ne renvoient
// que `chainSlug`, jamais de nom d'affichage — le mapping slug -> nom est donc nécessairement une
// donnée frontend (aucun endpoint ne l'expose, ce n'est pas un choix arbitraire).

export interface StoreChainOption {
  slug: string;
  name: string;
}

export const STORE_CHAINS: StoreChainOption[] = [
  { slug: 'colruyt', name: 'Colruyt' },
  { slug: 'aldi', name: 'Aldi' },
  { slug: 'delhaize', name: 'Delhaize' },
  { slug: 'lidl', name: 'Lidl' },
];

export function chainName(slug: string): string {
  return STORE_CHAINS.find((chain) => chain.slug === slug)?.name ?? slug;
}

/**
 * Intervalle de polling (ms) — proposé à 5s par UI-DESIGN.md (Selfdoubt #6), signalé comme non
 * calibré sur les durées réelles des adaptateurs headless (jamais mesurées, cf. JOURNAL Backend
 * SESSION 3). Conservé à 5s par défaut : la mutation de déclenchement bloque déjà côté client
 * jusqu'à la fin du run (voir hooks.ts), donc un polling trop agressif ici a un impact limité
 * (une seule requête GET légère toutes les 5s, pas un ré-déclenchement). À remonter à ~15-30s si
 * mesure ultérieure confirme des runs de plusieurs minutes ET qu'un coût API devient un sujet.
 */
export const STATUS_POLL_INTERVAL_MS = 5000;

export const PROMOTIONS_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
export const DEFAULT_PROMOTIONS_PAGE_SIZE = 25;
export const RUN_HISTORY_PAGE_SIZE = 20;
