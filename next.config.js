/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Playwright + le binaire Chromium serverless ne doivent jamais être bundlés par Webpack/Turbopack
  // (fichiers binaires + require dynamiques) : ils doivent rester des dépendances Node natives
  // résolues à l'exécution dans la fonction serverless. Nécessaire pour les adaptateurs headless
  // (Delhaize, Lidl) exécutés depuis app/api/cron/collect-promotions/[chain]/route.ts.
  experimental: {
    serverComponentsExternalPackages: ['playwright-core', '@sparticuz/chromium'],
  },
};

module.exports = nextConfig;
