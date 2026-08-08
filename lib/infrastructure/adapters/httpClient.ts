// lib/infrastructure/adapters/httpClient.ts
//
// Utilitaires partagés par les adaptateurs "api"/"html" (Colruyt, Aldi) : User-Agent
// identifiable (US-F1-08 DoD) et respect du crawl-delay entre requêtes successives vers une même
// enseigne (RG-2, docs/FOUNDATION.md §9.1/§10.1).

const DEFAULT_USER_AGENT =
  'PromoScanBot/1.0 (+https://promoscan.app; contact: ernest.hdj@gmail.com)';

export function getScraperUserAgent(): string {
  return process.env.SCRAPER_USER_AGENT || DEFAULT_USER_AGENT;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface FetchWithUaOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * fetch() avec User-Agent identifiable et timeout explicite. N'implémente pas de retry — un
 * échec réseau doit remonter tel quel pour que collectChainUseCase le marque `failed` sans
 * bloquer les autres enseignes (RG-3).
 */
export async function fetchWithUserAgent(
  url: string,
  options: FetchWithUaOptions = {},
): Promise<Response> {
  const { timeoutMs = 15_000, headers, ...rest } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: {
        'User-Agent': getScraperUserAgent(),
        ...headers,
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Petit limiteur de fréquence séquentiel : à utiliser entre chaque requête sortante vers la même
 * enseigne au sein d'un même adaptateur (ex. pagination Colruyt) pour respecter le crawl-delay
 * (5s minimum chez Colruyt — US-F1-08 DoD).
 */
export class CrawlDelayLimiter {
  private lastRequestAt = 0;

  constructor(private readonly delayMs: number) {}

  async wait(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestAt;
    if (elapsed < this.delayMs) {
      await sleep(this.delayMs - elapsed);
    }
    this.lastRequestAt = Date.now();
  }
}
