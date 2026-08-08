/**
 * API Configuration — client HTTP pour communiquer avec le backend Express.
 * Gere le base URL, les headers auth (JWT), et le refresh token automatique.
 */

import { useAuthStore } from '../stores/authStore';
import type { ApiResponse } from '../../shared/types/api';

/** Base URL API — utilise la variable d'env ou le proxy Vite en dev */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

/** Timeout par defaut (ms) */
const DEFAULT_TIMEOUT = 15_000;

/**
 * Client fetch type-safe avec gestion JWT automatique.
 * Intercepte les 401 pour tenter un refresh token.
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const { accessToken } = useAuthStore.getState();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 401 : tenter un refresh
    if (response.status === 401 && accessToken) {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        return request<T>(endpoint, options);
      }
      useAuthStore.getState().clearAuth();
      throw new ApiError('Session expiree. Veuillez vous reconnecter.', 401);
    }

    const body: ApiResponse<T> = await response.json();

    if (!body.success || body.data === null) {
      throw new ApiError(body.error ?? 'Erreur inconnue', response.status);
    }

    return body.data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ApiError) throw error;
    if ((error as Error).name === 'AbortError') {
      throw new ApiError('La requete a expire. Verifiez votre connexion.', 408);
    }
    throw new ApiError('Erreur reseau. Verifiez votre connexion.', 0);
  }
}

/** Tente de rafraichir le access token via le refresh token */
async function attemptTokenRefresh(): Promise<boolean> {
  const { refreshToken, setTokens } = useAuthStore.getState();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const body: ApiResponse<{ accessToken: string; refreshToken: string }> =
      await response.json();

    if (body.success && body.data) {
      setTokens(body.data.accessToken, body.data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Erreur API typee avec code HTTP */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Methodes HTTP raccourcies */
export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    }),
};
