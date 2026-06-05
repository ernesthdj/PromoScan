/**
 * useAuth — Hook d'authentification (login, register, logout, refresh).
 * Utilise TanStack Query mutations + authStore Zustand.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import { useAuthStore } from '../stores/authStore';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  LogoutRequest,
} from '../../shared/types/api';

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setAuth, clearAuth, user, isAuthenticated } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) =>
      api.post<AuthResponse>('/auth/login', data),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate('/dashboard');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) =>
      api.post<AuthResponse>('/auth/register', data),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate('/dashboard');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: (data: LogoutRequest) => api.post<null>('/auth/logout', data),
    onSettled: () => {
      clearAuth();
      queryClient.clear();
      navigate('/login');
    },
  });

  function logout() {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) {
      logoutMutation.mutate({ refreshToken });
    } else {
      clearAuth();
      queryClient.clear();
      navigate('/login');
    }
  }

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    registerError: registerMutation.error,
    isRegistering: registerMutation.isPending,
    logout,
    isLoggingOut: logoutMutation.isPending,
  };
}
