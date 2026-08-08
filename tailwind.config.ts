import type { Config } from 'tailwindcss';

// Tokens de statut repris tels quels de docs/PALETTE.md §6 (mapping Tailwind). Les couleurs
// "base" (fond/surface/texte/bordure/accent) sont une extension Frontend (#5) — non spécifiées
// par PALETTE.md/UI-DESIGN.md qui ne couvrent que la palette sémantique des statuts — voir
// styles/tokens.css pour la justification. Toutes les valeurs pointent vers des CSS custom
// properties (jamais de couleur codée en dur ici) : le mode sombre est géré par la bascule des
// variables dans tokens.css, pas par les classes `dark:` de Tailwind.
const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          bg: 'var(--base-bg)',
          surface: 'var(--base-surface)',
          'surface-hover': 'var(--base-surface-hover)',
          border: 'var(--base-border)',
          text: 'var(--base-text)',
          'text-secondary': 'var(--base-text-secondary)',
          'text-muted': 'var(--base-text-muted)',
          accent: 'var(--base-accent)',
          'accent-fg': 'var(--base-accent-fg)',
          'accent-hover': 'var(--base-accent-hover)',
          'focus-ring': 'var(--base-focus-ring)',
          danger: 'var(--base-danger)',
          'danger-hover': 'var(--base-danger-hover)',
        },
        status: {
          success: {
            bg: 'var(--status-success-bg)',
            fg: 'var(--status-success-fg)',
            border: 'var(--status-success-border)',
          },
          warning: {
            bg: 'var(--status-warning-bg)',
            fg: 'var(--status-warning-fg)',
            border: 'var(--status-warning-border)',
          },
          error: {
            bg: 'var(--status-error-bg)',
            fg: 'var(--status-error-fg)',
            border: 'var(--status-error-border)',
          },
          info: {
            bg: 'var(--status-info-bg)',
            fg: 'var(--status-info-fg)',
            border: 'var(--status-info-border)',
          },
          neutral: {
            bg: 'var(--status-neutral-bg)',
            fg: 'var(--status-neutral-fg)',
            border: 'var(--status-neutral-border)',
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
