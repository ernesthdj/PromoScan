/**
 * Config Vite — build frontend React.
 *
 * Vite est l'outil qui :
 * - En dev : lance un serveur local avec rechargement instantane
 * - En prod : compile et optimise tout le frontend en fichiers statiques
 *
 * Le proxy redirige les appels /api/v1/* vers le backend Express en dev,
 * pour eviter les problemes de CORS (Cross-Origin Resource Sharing —
 * restriction du navigateur qui bloque les requetes vers un domaine different).
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Le frontend est dans src/web/ (pas a la racine)
  root: '.',

  build: {
    outDir: 'dist-web',
    sourcemap: false,
  },

  server: {
    port: 5173,
    // En dev, redirige /api/v1/* vers le backend Express local
    proxy: {
      '/api/v1': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
