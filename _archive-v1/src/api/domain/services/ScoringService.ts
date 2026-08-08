/**
 * ScoringService — Scoring pondere multi-criteres pour classer les enseignes.
 *
 * Formule : score = (savings_norm * w1) + (proximity_norm * w2) + (items_norm * w3)
 * Les valeurs sont normalisees (0-1) pour eviter qu'un critere domine.
 *
 * Aucune dependance framework — logique pure.
 */

export interface ScoringWeights {
  w1: number; // Poids economie
  w2: number; // Poids proximite
  w3: number; // Poids couverture liste
}

export interface StoreScore {
  storeId: string;
  savings: number;
  distanceKm: number;
  matchedItems: number;
  score: number;
}

export interface ScoringInput {
  storeId: string;
  savings: number;
  distanceKm: number;
  matchedItems: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  w1: 0.5,
  w2: 0.3,
  w3: 0.2,
};

/**
 * Calcule le score d'un magasin.
 * Toutes les valeurs sont normalisees par rapport aux max du set.
 */
export function scoreStore(
  savings: number,
  distanceKm: number,
  matchedItems: number,
  totalItems: number,
  maxSavings: number,
  maxDistance: number,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): number {
  const savingsNorm = maxSavings > 0 ? savings / maxSavings : 0;
  const proximityNorm = maxDistance > 0 ? 1 - distanceKm / maxDistance : 1;
  const itemsNorm = totalItems > 0 ? matchedItems / totalItems : 0;

  return savingsNorm * weights.w1 + proximityNorm * weights.w2 + itemsNorm * weights.w3;
}

/**
 * Calcule et trie les scores pour un ensemble de magasins.
 * Retourne les magasins tries par score decroissant.
 */
export function rankStores(
  inputs: ScoringInput[],
  totalListItems: number,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): StoreScore[] {
  if (inputs.length === 0) return [];

  const maxSavings = Math.max(...inputs.map((i) => i.savings), 0);
  const maxDistance = Math.max(...inputs.map((i) => i.distanceKm), 0);

  const scored = inputs.map((input) => ({
    storeId: input.storeId,
    savings: input.savings,
    distanceKm: input.distanceKm,
    matchedItems: input.matchedItems,
    score: scoreStore(
      input.savings,
      input.distanceKm,
      input.matchedItems,
      totalListItems,
      maxSavings,
      maxDistance,
      weights,
    ),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored;
}
