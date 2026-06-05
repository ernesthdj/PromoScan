/**
 * App — Router principal + providers (QueryClient, AuthProvider).
 * React Router v6 avec routes protegees via AuthGuard.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/templates/AppLayout';
import { AuthLayout } from './components/templates/AuthLayout';
import { AuthGuard } from './guards/AuthGuard';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { ShoppingListPage } from './pages/ShoppingListPage';
import { PromotionsPage } from './pages/PromotionsPage';
import { SuggestionsPage } from './pages/SuggestionsPage';
import { MapPage } from './pages/MapPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotFound } from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Routes publiques */}
          <Route index element={<Landing />} />

          {/* Auth layout (centrage, card) */}
          <Route element={<AuthLayout />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>

          {/* Routes protegees (AppLayout avec sidebar/bottom nav) */}
          <Route element={<AuthGuard />}>
            <Route element={<AppLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="lists" element={<ShoppingListPage />} />
              <Route path="lists/:id" element={<ShoppingListPage />} />
              <Route path="promos" element={<PromotionsPage />} />
              <Route path="suggestions" element={<SuggestionsPage />} />
              <Route path="route" element={<MapPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
