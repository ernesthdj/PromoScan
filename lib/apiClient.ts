// lib/apiClient.ts
//
// Client HTTP minimal côté navigateur pour consommer le format uniforme
// { success, data } / { success: false, error: { code, message } } (docs/API-ENDPOINTS.md).
// Pas de dépendance externe (axios, ky) — un fetch wrapper suffit pour 4 endpoints (YAGNI).

export interface ApiErrorBody {
  code: string;
  message: string;
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(body: ApiErrorBody, status: number) {
    super(body.message);
    this.name = 'ApiError';
    this.code = body.code;
    this.status = status;
  }
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: ApiErrorBody;
}

/**
 * Effectue une requête vers un endpoint interne `/api/*` et déballe l'enveloppe
 * `{ success, data, error }`. Lance une `ApiError` (message toujours humain, jamais un code brut
 * — cf. docs/API-ENDPOINTS.md §4 et UI-DESIGN.md §5) en cas d'échec HTTP ou applicatif.
 */
export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError(
      { code: 'NETWORK_ERROR', message: 'Impossible de contacter le serveur — vérifiez votre connexion.' },
      0,
    );
  }

  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // Corps non-JSON (ex. 504 gateway) : on retombe sur le code HTTP brut ci-dessous.
  }

  if (!response.ok || !body || !body.success) {
    throw new ApiError(
      body?.error ?? { code: 'UNKNOWN_ERROR', message: 'Une erreur est survenue.' },
      response.status,
    );
  }

  return body.data as T;
}
