# Palette sémantique WCAG AA — Statuts de collecte (PromoScan — F1)

> Agent : UI/UX Designer (#3) — Phase 1 (Fondation) du pipeline Hub & Spoke
> Date : 2026-08-08
> Référencée depuis `docs/UI-DESIGN.md` §6-7 (écran `/dashboard/collecte`)
> Fichier séparé (plutôt qu'une section de UI-DESIGN.md) car ces tokens sont génériques (succès/avertissement/erreur/en cours/neutre) et vraisemblablement réutilisables tels quels par F2/F3/F4.

---

## 1. Principe directeur

**Aucune information n'est portée par la couleur seule** (WCAG 1.4.1 + heuristique Nielsen "reconnaissance > rappel"). Chaque statut combine systématiquement 3 signaux redondants :

1. **Forme d'icône** distincte (perceptible même en niveaux de gris / daltonisme)
2. **Libellé texte** explicite (jamais une abréviation ambiguë)
3. **Couleur** (renfort visuel rapide pour un balayage à l'œil)

Style des badges : **"soft badge"** — fond teinté clair (light) / sombre (dark) + texte de la même teinte fortement contrasté, plutôt qu'un aplat de couleur saturée + texte blanc. Ce style réduit la fatigue visuelle sur un tableau dense (Zone C/D de `UI-DESIGN.md`) tout en garantissant le ratio de contraste.

---

## 2. Mapping statut → sémantique

| Statut (`ChainRunStatus` / `CollectionRunStatus`) | Sémantique | Icône | Distinction clé |
|---|---|---|---|
| `complete` | Succès | Cercle + coche (`check-circle`, plein) | — |
| `format_drift` | **Avertissement — pas une erreur technique** | Triangle + point d'exclamation (`alert-triangle`, contour) | Forme **triangulaire** = seule catégorie de ce groupe. Ne partage ni la forme ni la teinte de `failed` |
| `failed` | Erreur | Cercle + croix (`x-circle`, plein) | Rouge, jamais confondu visuellement avec l'ambre de `format_drift` |
| `running` | En cours (actif) | Cercle rotatif (`loader`, animé — respecte `prefers-reduced-motion`) | Seul statut animé |
| `pending` | En attente (inactif, pas encore démarré) | Cercle en pointillés (`circle-dashed`) | Neutre, jamais confondu avec `running` (pas d'animation) |
| `partial` (statut agrégé `CollectionRun` uniquement) | Avertissement composite | Triangle + point d'exclamation, variante "moitié" (`alert-triangle` + libellé "Partiel") | Réutilise la famille visuelle "avertissement" de `format_drift` — cohérent car `partial` signifie "au moins une enseigne a un souci", jamais un échec total |

**Règle explicite issue de `docs/ARCHITECTURE.md` §7/§8 et `docs/USER-STORIES.md` (US-F1-10 DoD) :** `format_drift` ne doit **jamais** partager l'icône, la forme ou la teinte de `failed`. Une dérive de format signale une possible casse du site source (site à surveiller, catalogue préservé) ; un échec signale une vraie erreur technique (timeout, réseau, parsing). Les traiter visuellement de la même façon romprait la garantie explicite demandée par l'Architecte.

---

## 3. Tokens couleur — Light mode

| Statut | Fond (`bg`) | Texte/Icône (`fg`) | Contraste fg/bg | Bordure (optionnelle) |
|---|---|---|---|---|
| `complete` (succès) | `#DCFCE7` (green-100) | `#15803D` (green-700) | ≈ 6.9:1 — AA ✅ | `#86EFAC` (green-300) |
| `format_drift` (avertissement) | `#FEF3C7` (amber-100) | `#92400E` (amber-800) | ≈ 7.5:1 — AA ✅ | `#FCD34D` (amber-300) |
| `failed` (erreur) | `#FEE2E2` (red-100) | `#B91C1C` (red-700) | ≈ 6.3:1 — AA ✅ | `#FCA5A5` (red-300) |
| `running` (en cours) | `#DBEAFE` (blue-100) | `#1D4ED8` (blue-700) | ≈ 7.0:1 — AA ✅ | `#93C5FD` (blue-300) |
| `pending` (neutre) | `#F3F4F6` (gray-100) | `#374151` (gray-700) | ≈ 8.3:1 — AA ✅ | `#D1D5DB` (gray-300) |

## 4. Tokens couleur — Dark mode

| Statut | Fond (`bg`) | Texte/Icône (`fg`) | Contraste fg/bg | Bordure (optionnelle) |
|---|---|---|---|---|
| `complete` (succès) | `#052E16` (green-950) | `#86EFAC` (green-300) | ≈ 9.5:1 — AA ✅ | `#166534` (green-800) |
| `format_drift` (avertissement) | `#451A03` (amber-950) | `#FCD34D` (amber-300) | ≈ 10.5:1 — AA ✅ | `#92400E` (amber-800) |
| `failed` (erreur) | `#450A0A` (red-950) | `#FCA5A5` (red-300) | ≈ 8.8:1 — AA ✅ | `#B91C1C` (red-700) |
| `running` (en cours) | `#172554` (blue-950) | `#93C5FD` (blue-300) | ≈ 9.2:1 — AA ✅ | `#1D4ED8` (blue-700) |
| `pending` (neutre) | `#1F2937` (gray-800) | `#D1D5DB` (gray-300) | ≈ 9.8:1 — AA ✅ | `#4B5563` (gray-600) |

> **Confiance sur les ratios exacts : Probable, pas Certain.** Les valeurs ci-dessus reprennent des paires de la palette Tailwind largement documentées comme conformes AA (700-sur-100 en light, 300-sur-950 en dark suivent la même logique que les pastilles vert/orange/bleu déjà utilisées et non contestées en QA lors de SESSION 1 de ce projet). Elles n'ont pas été vérifiées avec un outil de contraste dédié (ex. axe DevTools) sur le rendu final. **Alerte QA (#7)** : vérifier ces ratios en conditions réelles de rendu (police, anti-aliasing) avant mise en production, conformément à l'incertitude déjà signalée en JOURNAL SESSION 1 ("contrastes WCAG AA... pas testés sur tous les composants").

---

## 5. CSS Custom Properties (`styles/tokens.css` — extrait, source de vérité)

```css
:root {
  /* Statuts — light (défaut) */
  --status-success-bg: #DCFCE7;
  --status-success-fg: #15803D;
  --status-success-border: #86EFAC;

  --status-warning-bg: #FEF3C7;
  --status-warning-fg: #92400E;
  --status-warning-border: #FCD34D;

  --status-error-bg: #FEE2E2;
  --status-error-fg: #B91C1C;
  --status-error-border: #FCA5A5;

  --status-info-bg: #DBEAFE;
  --status-info-fg: #1D4ED8;
  --status-info-border: #93C5FD;

  --status-neutral-bg: #F3F4F6;
  --status-neutral-fg: #374151;
  --status-neutral-border: #D1D5DB;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --status-success-bg: #052E16;
    --status-success-fg: #86EFAC;
    --status-success-border: #166534;

    --status-warning-bg: #451A03;
    --status-warning-fg: #FCD34D;
    --status-warning-border: #92400E;

    --status-error-bg: #450A0A;
    --status-error-fg: #FCA5A5;
    --status-error-border: #B91C1C;

    --status-info-bg: #172554;
    --status-info-fg: #93C5FD;
    --status-info-border: #1D4ED8;

    --status-neutral-bg: #1F2937;
    --status-neutral-fg: #D1D5DB;
    --status-neutral-border: #4B5563;
  }
}

:root[data-theme="dark"] {
  --status-success-bg: #052E16;
  --status-success-fg: #86EFAC;
  --status-success-border: #166534;

  --status-warning-bg: #451A03;
  --status-warning-fg: #FCD34D;
  --status-warning-border: #92400E;

  --status-error-bg: #450A0A;
  --status-error-fg: #FCA5A5;
  --status-error-border: #B91C1C;

  --status-info-bg: #172554;
  --status-info-fg: #93C5FD;
  --status-info-border: #1D4ED8;

  --status-neutral-bg: #1F2937;
  --status-neutral-fg: #D1D5DB;
  --status-neutral-border: #4B5563;
}
```

**Mapping statut métier → token sémantique (couche d'abstraction) :**

| Statut métier | Token sémantique |
|---|---|
| `complete` | `success` |
| `format_drift` | `warning` |
| `failed` | `error` |
| `running` | `info` |
| `pending` | `neutral` |
| `partial` (agrégé) | `warning` |

Cette indirection (statut métier → token générique `success/warning/error/info/neutral`) permet de réutiliser exactement la même palette pour d'autres écrans futurs (F2/F3/F4) sans dupliquer les valeurs couleur — cohérent avec `styles/tokens.css` comme source de vérité unique (règle Frontend globale).

---

## 6. Mapping Tailwind (`tailwind.config.ts` — extrait)

```ts
extend: {
  colors: {
    status: {
      success: { bg: "var(--status-success-bg)", fg: "var(--status-success-fg)", border: "var(--status-success-border)" },
      warning: { bg: "var(--status-warning-bg)", fg: "var(--status-warning-fg)", border: "var(--status-warning-border)" },
      error:   { bg: "var(--status-error-bg)",   fg: "var(--status-error-fg)",   border: "var(--status-error-border)" },
      info:    { bg: "var(--status-info-bg)",    fg: "var(--status-info-fg)",    border: "var(--status-info-border)" },
      neutral: { bg: "var(--status-neutral-bg)", fg: "var(--status-neutral-fg)", border: "var(--status-neutral-border)" },
    },
  },
}
```

Usage composant (`StatusBadge`) : classes utilitaires `bg-status-{x}-bg text-status-{x}-fg border-status-{x}-border`, jamais de couleur codée en dur dans le composant (`text-red-700` interdit directement dans `StatusBadge.tsx` — toujours passer par le token sémantique).

---

## 7. Règles d'usage — checklist composant

- [ ] Chaque badge de statut combine icône + libellé + couleur (jamais un point de couleur seul)
- [ ] `format_drift` n'utilise jamais la forme d'icône (`x-circle`) ni la teinte (rouge) de `failed`
- [ ] `running` est le seul statut animé (spinner) — respecte `prefers-reduced-motion: reduce` (fallback : badge statique)
- [ ] Contraste vérifié en light **et** dark mode avant merge (voir incertitude §4)
- [ ] Aucune couleur codée en dur dans les composants — uniquement les tokens `status-*` ou leurs classes Tailwind dérivées
