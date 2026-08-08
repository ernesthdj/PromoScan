# UI/UX Design — `/dashboard/collecte` (PromoScan — F1)

> Agent : UI/UX Designer (#3) — Phase 1 (Fondation) du pipeline Hub & Spoke
> Date : 2026-08-08
> Source : `docs/FOUNDATION.md` (§2, §5, §9.1), `docs/USER-STORIES.md` (US-F1-09, US-F1-10, US-F1-11), `docs/ARCHITECTURE.md` (§5.2, §7, §8), `docs/API-ENDPOINTS.md` (4 endpoints)
> Périmètre : **un seul écran**, `/dashboard/collecte` — interface de contrôle interne pour mentalyas (utilisateur unique, Supabase Auth). Pas d'écran F2/F3/F4.
> Plateforme cible : Web — Next.js App Router, React + TypeScript strict + Tailwind. Atomic Design. Responsive desktop-first 1440/768/375. Dark/light via `[data-theme="dark"]`. WCAG AA. Focus clavier. Animations 150/250/400ms.
> Palette sémantique détaillée : voir `docs/PALETTE.md` (fichier séparé, référencé section 6 ci-dessous).

---

## 0. Cadrage — dashboard technique, pas grand public

Cet écran est un outil de monitoring/debug pour un développeur unique vérifiant son pipeline de collecte. Priorités, dans l'ordre :

1. **Visibilité de l'état** (Nielsen #1) — savoir en un coup d'œil si tout va bien, quelle enseigne a un souci, et lequel.
2. **Prévention des erreurs** (Nielsen #5) — impossible de déclencher deux fois la même collecte, message clair sur conflit.
3. **Densité d'information utile** — pas de rendu qui charge tout, pas de décoration qui coûte de l'espace vertical sans apporter d'info.
4. **Reconnaissance > rappel** (Nielsen #6) — statuts toujours affichés avec icône + texte, jamais une couleur seule à mémoriser.

Non-objectif explicite : pas de "wow visuel", pas de storytelling produit. mentalyas est à la fois le designer et l'unique utilisateur — l'écran doit lui faire gagner du temps de debug, pas l'impressionner.

---

## 1. Architecture de la page — 3 zones verticales

L'écran est une page pleine largeur, scroll vertical, **3 zones empilées** dans cet ordre (workflow-first : de l'action la plus fréquente/urgente vers la consultation la plus large) :

```
┌───────────────────────────────────────────────────────────────┐
│ ZONE A — Header de page                                       │
│   Titre + résumé du dernier run + horodatage relatif          │
├───────────────────────────────────────────────────────────────┤
│ ZONE B — Panneau de contrôle de collecte (US-F1-11)            │
│   Bouton global "Déclencher toutes les enseignes"              │
│   + 4 lignes enseigne (statut courant + bouton individuel)     │
├───────────────────────────────────────────────────────────────┤
│ ZONE C — Historique des runs (US-F1-10)                        │
│   Tableau paginé, tri décroissant par date                     │
├───────────────────────────────────────────────────────────────┤
│ ZONE D — Promotions collectées (US-F1-09)                      │
│   Filtres (enseigne, catégorie) + tableau dense + pagination   │
└───────────────────────────────────────────────────────────────┘
```

**Pourquoi cet ordre et pas un layout split (carte/liste φ 62/38) :** il n'y a ici ni carte ni contenu visuel à mettre en vedette — 4 tableaux/panneaux de contrôle de densités différentes. Le ratio φ n'a pas de prise naturelle sur ce contenu ; empiler par ordre de fréquence d'usage (contrôler → vérifier l'historique → auditer le détail) sert mieux Tesler (absorber la complexité, pas la répartir en colonnes qui forcent l'œil à sauter) que forcer un split horizontal. Voir Selfdoubt §8.

**Pourquoi le panneau de contrôle (B) est séparé de l'historique (C) plutôt que fusionné :** B répond à "que puis-je faire maintenant ?" (état courant + action), C répond à "qu'est-il arrivé avant ?" (consultation historique). Proximité Gestalt : regrouper action-et-état-courant d'un côté, chronologie de l'autre, évite qu'un tableau à la fois actionnable et historique surcharge cognitivement la lecture (Miller : deux groupes de sens différents = deux blocs visuels différents).

---

## 2. Wireframes textuels

### 2.1 Desktop — 1440px (référence principale)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  PromoScan · Collecte                                                    │
│  Dernier run : #2026-W32 · il y a 2h · ⚠ partiel (3/4 enseignes)         │
├──────────────────────────────────────────────────────────────────────────┤
│  Contrôle de collecte                    [ ⟳ Déclencher toutes ]  ← CTA  │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ ● Colruyt    ✓ Complet · 184 items · il y a 2h      [Déclencher]  │ │
│  │ ● Aldi       ✓ Complet · 96 items · il y a 2h       [Déclencher]  │ │
│  │ ● Delhaize   ⚠ Dérive de format · 12 items · il y a 2h [Déclencher]│ │
│  │ ● Lidl       ✕ Échec (timeout) · il y a 2h          [Déclencher]  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────┤
│  Historique des runs                                          27 runs   │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Date/heure        Origine   Statut     Colruyt Aldi Delhaize Lidl │ │
│  │ 10/08 03:00       🕐 Cron   ⚠ Partiel   ✓184    ✓96   ⚠12    ✕— │ │
│  │ 08/08 16:42       ✋ Manuel  ✓ Complet   ✓181    ✓94   ✓1042  ✓— │ │
│  │ 03/08 03:00       🕐 Cron   ✓ Complet   ✓179    ✓91   ✓998   ✓87│ │
│  │ ...                                                    [< 1 2 3 >]│ │
│  └────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────┤
│  Promotions collectées                                                   │
│  [ Enseigne ▾ Toutes ]  [ Catégorie: ______ ]  [ Réinitialiser ]  1042 résultats │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Produit             Enseigne  Catégorie  Prix    Promo  Remise Val.│ │
│  │ Poulet fermier 1kg  Delhaize  Viande     9,99€   6,99€  -30%  10→16│ │
│  │ Yaourt nature x8    Colruyt   Frais      2,49€   1,79€  -28%  08→14│ │
│  │ ...                                                                │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│  Affichage 1-25 sur 1042   Lignes par page: [25 ▾]     [< Préc. Suiv. >] │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Tablette — 768px

- Zone B : les 4 lignes enseigne passent de "ligne horizontale" à "carte 2 colonnes" (grille 2×2) — le bouton `Déclencher` reste sur la même ligne que le statut (pas d'empilement supplémentaire, Fitts : cible toujours accessible sans scroll horizontal).
- Zone C : le tableau devient scrollable horizontalement dans un conteneur `overflow-x: auto` dédié (colonnes enseignes compressées en icônes seules + tooltip au tap) plutôt que de casser la mise en page.
- Zone D : filtres empilés sur 2 lignes (enseigne + catégorie), tableau en scroll horizontal contenu, colonnes secondaires (Validité) masquées par défaut derrière un bouton "détails" par ligne si l'espace manque.

### 2.3 Mobile — 375px

- Zone A : titre + résumé sur 2 lignes, horodatage relatif abrégé.
- Zone B : bouton global pleine largeur en haut (zone de pouce, Fitts) ; les 4 enseignes deviennent des **cartes empilées verticalement** (1 par ligne) : nom + badge statut sur la première ligne, bouton "Déclencher" pleine largeur en dessous (min 44px hauteur tactile).
- Zone C : chaque run devient une **carte** (pas un tableau) : date/statut global en tête, 4 badges enseigne en grille 2×2 compacte en dessous. Pagination en boutons "Précédent/Suivant" pleine largeur.
- Zone D : filtres dans un panneau repliable (bouton "Filtres (2)" avec badge de compteur actif) pour économiser l'espace vertical — pattern déjà capitalisé dans ce projet (JOURNAL SESSION 1 : "Filtres en panneau repliable sur mobile"). Le tableau devient une **liste de cartes produit** : nom + enseigne en tête, prix normal barré + prix promo en évidence, catégorie et validité en texte secondaire.

---

## 3. Composants (Atomic Design)

### 3.1 Atoms

| Composant | Rôle | Notes |
|---|---|---|
| `StatusIcon` | Icône seule par statut (`complete`/`format_drift`/`failed`/`running`/`pending`) | Forme distincte par statut (pas seulement la couleur) — voir PALETTE.md §2 |
| `StatusBadge` | Icône + libellé texte + fond coloré | Jamais de couleur seule (a11y) ; `aria-label` explicite (ex. "Statut : dérive de format détectée") |
| `Button` (primary/secondary/danger-ghost) | Actions | Min 32px hauteur desktop / 44px tactile mobile (règle Fitts globale) ; état `loading` intégré (spinner + label modifié + `disabled`) |
| `Select` | Filtre dropdown (enseigne) | Natif accessible, focus visible |
| `TextInput` | Filtre texte (catégorie) | Debounce 300ms avant requête |
| `Spinner` | Indicateur de chargement inline | Utilisé dans `Button` en état `loading` et dans les badges `running` (rotation continue, respecte `prefers-reduced-motion`) |
| `RelativeTime` | Horodatage relatif ("il y a 2h") avec `title` = date ISO complète au survol | Reconnaissance > rappel |
| `Toast` | Notification transitoire (succès/erreur de déclenchement) | Auto-dismiss 5s, dismissible manuellement, `role="status"` ou `role="alert"` selon sévérité |
| `PaginationControls` | Précédent/Suivant + indicateur page | Boutons désactivés en butée (première/dernière page) |
| `EmptyState` | Icône + titre + description | Réutilisé pour "aucune promotion", "aucun run", filtre sans résultat |
| `SkeletonRow` | Placeholder de chargement | Remplace les lignes de tableau pendant le fetch initial (jamais un spinner plein écran qui bloque toute la page) |

### 3.2 Molecules

| Composant | Composition | Comportement |
|---|---|---|
| `ChainTriggerRow` | `StatusBadge` + nom enseigne + `itemsCollected` + `RelativeTime` + `Button` "Déclencher" | Bouton `disabled` si `status ∈ {running, pending}` **pour cette enseigne uniquement** (indépendance des 4 process, cf. ARCHITECTURE §5.2). `title` du bouton désactivé explique pourquoi ("Collecte en cours pour Colruyt") |
| `RunSummaryHeader` | `StatusBadge` (statut global) + `weekKey`/"Manuel" + `RelativeTime` | Utilisé en Zone A pour le dernier run et en tête de chaque `RunRow` |
| `ChainStatusChip` | Version compacte de `StatusBadge` (icône + count seulement, libellé complet en `title`/tooltip) | Utilisée dans les colonnes enseignes du tableau d'historique pour tenir 4 statuts sur une ligne dense |
| `RunRow` | `RunSummaryHeader` + 4× `ChainStatusChip` + horodatage début/fin | Une ligne = un `CollectionRun` ; clic optionnel pour déplier le détail (`errorMessage` si présent) |
| `FilterBar` | `Select` (enseigne) + `TextInput` (catégorie) + bouton "Réinitialiser" | Réinitialiser réapparaît seulement si ≥1 filtre actif (pas de bruit visuel sinon) |
| `PromotionRow` | Cellules produit/enseigne/catégorie/prix/promo/remise/validité | Prix promo toujours visuellement dominant (poids/couleur) vs prix normal barré discret |
| `PromotionCard` (mobile) | Équivalent `PromotionRow` en carte | Utilisé <768px |
| `ConfirmToast` | `Toast` spécialisé succès/erreur de déclenchement | Message humain, jamais un code brut (409 → "Une collecte est déjà en cours pour Lidl") |

### 3.3 Organisms

| Composant | Composition | Data source |
|---|---|---|
| `PageHeader` | Titre + `RunSummaryHeader` du dernier run global | Dérivé du 1er élément de `GET /api/collection-runs` |
| `TriggerControlPanel` | Bouton global + liste de 4 `ChainTriggerRow` | État courant dérivé du dernier `CollectionRunChain` connu par enseigne (via `GET /api/collection-runs`, item le plus récent) ; mutation via `POST /api/collections/trigger` |
| `RunHistoryTable` | En-tête colonnes + liste de `RunRow` + `PaginationControls` | `GET /api/collection-runs` (page, limit ≤ 50) |
| `PromotionsTable` | `FilterBar` + liste de `PromotionRow`/`PromotionCard` + `PaginationControls` + compteur de résultats | `GET /api/promotions` (storeChain, category, page, limit ≤ 100) |

### 3.4 Export

Chaque composant exporté via `index.ts` de son dossier (`components/atoms/index.ts`, etc.), conformément au standard Frontend global. Composants spécifiques à cette page uniquement (ex. `TriggerControlPanel`) vivent dans `app/(dashboard)/dashboard/collecte/_components/` (déjà prévu par l'arborescence Architect §3) ; les atoms/molecules génériques réutilisables (Badge, Button, Toast, Pagination) vivent dans `components/` partagé, car F2/F3/F4 en auront très probablement besoin plus tard.

---

## 4. Flux UX détaillés

### 4.1 Déclenchement manuel — enseigne unique (US-F1-11)

1. État initial : `ChainTriggerRow` affiche le dernier statut connu (ex. Colruyt = `complete`, bouton actif).
2. Clic sur "Déclencher" (Colruyt) → **feedback < 200ms** : le bouton passe immédiatement en état `loading` (spinner + label "Lancement…", `disabled`), sans attendre la réponse serveur — mise à jour optimiste locale (TanStack Query `onMutate`).
3. Requête `POST /api/collections/trigger` avec `{ chainSlug: "colruyt" }` part en arrière-plan.
4. **Réponse `200`** : le badge de la ligne passe à `running` (icône spinner animée, distincte du spinner du bouton), le bouton reste `disabled` avec label "En cours…" (le run peut prendre du temps, notamment pour Delhaize/Lidl en headless). Un `Toast` discret confirme "Collecte Colruyt lancée".
5. **Polling léger** (`refetchInterval` TanStack Query, actif uniquement tant qu'au moins une enseigne est `running`/`pending`) rafraîchit `TriggerControlPanel` et `RunHistoryTable` toutes les ~5s jusqu'à état terminal — visibilité de l'état sans rechargement manuel (Nielsen #1).
6. **État terminal atteint** (`complete`/`format_drift`/`failed`) : badge mis à jour, bouton réactivé, `Toast` de résultat ("Colruyt : 184 promotions collectées" / "Colruyt : dérive de format détectée, catalogue inchangé" / "Colruyt : échec (timeout)").
7. **Réponse `409`** (conflit — run déjà en cours pour cette enseigne, race condition rare si deux onglets ouverts) : le `Button` revient à l'état `disabled`/"En cours…" (cohérent avec la réalité), `ConfirmToast` d'erreur affiche "Une collecte est déjà en cours pour Colruyt" — jamais le code brut `409` seul (US-F1-11 DoD explicite).

### 4.2 Déclenchement manuel — toutes les enseignes (US-F1-11)

- Bouton global `disabled` si **au moins une** des 4 enseignes est `running`/`pending` (reflète la sémantique `409` "sans chainSlug" côté API — ARCHITECTURE §5.2/API-ENDPOINTS §4). `title` du bouton désactivé : "Une collecte est déjà en cours pour Delhaize".
- Clic → même feedback optimiste immédiat que 4.1, mais les 4 `ChainTriggerRow` passent simultanément en `running` (celles qui étaient déjà dans un état terminal).
- `Toast` unique récapitulatif à la fin du polling ("Collecte terminée : 3 enseignes OK, 1 dérive de format") plutôt que 4 toasts qui se chevauchent (éviter la surcharge — Miller).

### 4.3 Consultation de l'historique des runs (US-F1-10)

- Chargement initial : `SkeletonRow` × 5 le temps du premier fetch, jamais un spinner plein écran (la Zone B au-dessus reste utilisable immédiatement).
- Chaque `RunRow` affiche les 4 `ChainStatusChip` **toujours visibles** (pas de clic nécessaire pour voir qu'une enseigne a un souci — reconnaissance > rappel). Un clic sur la ligne déplie un panneau de détail (uniquement si un `errorMessage` existe, sinon pas de chevron d'expansion — ne pas offrir une action qui ne mène nulle part).
- Tri fixe décroissant par `startedAt` (pas de tri configurable — YAGNI, cohérent avec le DoD US-F1-10 qui ne demande que ce tri).
- État vide (aucun run — premier lancement du projet) : `EmptyState` "Aucune collecte n'a encore été effectuée" + le bouton "Déclencher toutes les enseignes" de la Zone B reste la seule action pertinente (pas de CTA dupliqué dans l'`EmptyState`).

### 4.4 Consultation et filtrage des promotions (US-F1-09)

- Filtres appliqués **côté serveur** (query params `storeChain`/`category`), jamais un filtrage client sur les 1000+ lignes déjà chargées — évite de charger 1042 lignes juste pour en filtrer 12 côté navigateur.
- Changement de filtre → requête TanStack Query avec `keepPreviousData: true` (évite un flash vide pendant le refetch) + retour à `page: 1` automatiquement (éviter une page 5 vide après filtrage).
- Pagination par défaut `limit: 25` (lisible sans scroll excessif), sélecteur `25 / 50 / 100` (plafond serveur) — utile pour mentalyas en mode "audit rapide" du catalogue Delhaize.
- Compteur de résultats toujours visible ("1042 résultats") — donne le contexte de volume avant même de parcourir les pages (évite la surprise "encore 40 pages").
- État vide avec filtre actif : `EmptyState` "Aucune promotion pour ce filtre" + bouton "Réinitialiser les filtres" (contrairement à 4.3, ici l'action de sortie de l'état vide est pertinente et proposée).

---

## 5. Règles de validation / état — synthèse

| Élément | Condition d'état | Détail |
|---|---|---|
| Bouton global "Déclencher toutes" | `disabled` | Si ≥1 des 4 `CollectionRunChain` les plus récentes est `running`/`pending` |
| Bouton "Déclencher" par enseigne | `disabled` | Si **cette** enseigne est `running`/`pending` (indépendant des 3 autres) |
| Feedback visuel au clic | < 200ms | Mutation optimiste locale avant retour serveur (règle ergonomie globale) |
| Badge `format_drift` | Distinct de `failed` | Icône différente (triangle d'alerte vs croix), teinte différente (ambre vs rouge), libellé explicite "Dérive de format" vs "Échec" — jamais la même forme visuelle (ARCHITECTURE §7/§8, US-F1-10 DoD) |
| Filtre "Catégorie" | Requête différée | Debounce 300ms — évite une requête par frappe clavier |
| Pagination promotions | `limit` plafonné | Max 100 côté UI, aligné sur le plafond serveur (`API-ENDPOINTS §2`) — le sélecteur ne propose jamais une valeur invalide |
| Message d'erreur 409 | Jamais un code brut | Toujours reformulé en langage clair, avec l'enseigne concernée nommée (US-F1-11 DoD explicite) |
| Polling live | Actif conditionnellement | `refetchInterval` seulement si un état non-terminal existe quelque part sur l'écran — évite de solliciter l'API en continu quand tout est stable |

---

## 6. Accessibilité (WCAG AA)

- Contraste texte/fond ≥ 4.5:1 (texte normal), ≥ 3:1 (texte large/icônes) — palette détaillée dans `docs/PALETTE.md`.
- Aucune information portée par la couleur seule : chaque `StatusBadge`/`StatusIcon` combine forme d'icône + libellé texte + couleur (redondance volontaire, capitalisée depuis JOURNAL SESSION 1 : "pastille couleur + valeur numérique — accessibilité, pas de color-only").
- Navigation clavier complète : `Tab` parcourt header → panneau de contrôle (bouton global puis 4 boutons enseigne dans l'ordre du tableau) → filtres → tableau historique (lignes cliquables si détail dépliable, `role="button"` + `Enter`/`Space`) → tableau promotions → pagination. Focus visible systématique (outline 2px, couleur du thème actif).
- Boutons désactivés restent perceptibles au lecteur d'écran (`aria-disabled` + `aria-describedby` pointant vers l'explication, plutôt qu'un `disabled` HTML brut qui rendrait le `title` inaccessible au clavier/lecteur d'écran).
- `Toast` : `role="status"` (succès) ou `role="alert"` (erreur, ex. 409) pour annonce automatique par lecteur d'écran sans voler le focus.
- Animations respectent `prefers-reduced-motion: reduce` (spinner remplacé par un badge statique "En cours" sans rotation).

---

## 7. Palette sémantique — voir fichier séparé

La palette complète (tokens WCAG AA, valeurs light/dark, ratios de contraste documentés, règles d'usage) est fournie dans **`docs/PALETTE.md`**, choisi comme fichier séparé plutôt qu'une section de ce document car elle sera vraisemblablement réutilisée telle quelle par F2/F3/F4 (statuts génériques succès/avertissement/erreur/en cours ne sont pas spécifiques à la collecte).

---

## 8. Selfdoubt — hiérarchie visuelle et densité d'information

| # | Affirmation | Niveau | Action |
|---|---|---|---|
| 1 | Empilement vertical (A→D) plutôt qu'un layout en colonnes/split est le bon choix pour cet écran | ✅ Certain | Aucun contenu visuel dominant (pas de carte/image) qui justifierait un split φ 62/38 ; 4 blocs de nature différente (contrôle, historique, données) gagnent en clarté empilés plutôt que juxtaposés, ce qui forcerait l'œil à arbitrer entre colonnes en permanence |
| 2 | Séparer le panneau de contrôle (Zone B) de l'historique (Zone C) plutôt que les fusionner | ✅ Certain | Deux intentions différentes ("agir maintenant" vs "consulter le passé") ; les fusionner risquerait de faire percevoir chaque ligne d'historique comme actionnable alors que seul l'état courant l'est réellement |
| 3 | 5 boutons visibles simultanément (1 global + 4 par enseigne) déroge à la règle globale "1 CTA par écran" | ⚠️ Probable | Assumé comme exception documentée : la règle "1 CTA" cible les écrans de conversion grand public, pas un dashboard technique où le contrôle granulaire par enseigne est une exigence explicite de l'Architecte (§8 : "prévoir un sélecteur ou une action par ligne d'enseigne en plus du bouton global"). Hiérarchie maintenue par le style (bouton global = primary, boutons enseigne = secondary/plus petits) pour que l'œil identifie l'action principale en premier malgré le nombre de CTA |
| 4 | Filtre "Catégorie" en champ texte libre plutôt qu'un `Select` à options fixes | ⚠️ Probable | Aucun endpoint ne fournit la liste des catégories distinctes (API-ENDPOINTS §Notes transverses ne mentionne que le hardcode possible pour `storeChain`, pas pour `category` — les catégories viennent de données scrapées hétérogènes par enseigne). Un texte libre avec debounce évite de maintenir une liste figée qui deviendrait fausse dès qu'une enseigne change sa nomenclature. **Alerte Backend/Frontend (#4/#5)** : si un besoin de suggestions/autocomplete catégorie apparaît en usage réel, ajouter une dérivation côté client des valeurs déjà vues dans la page courante (pas un nouvel endpoint — YAGNI) |
| 5 | Densité de la table de promotions (lignes ~40px, police 14px) est appropriée pour 1000+ lignes | ✅ Certain | mentalyas est développeur et utilisateur unique de cet écran — priorité explicite de la tâche à "la clarté et la densité d'information utile" plutôt qu'un rendu grand public plus aéré. Pagination reste néanmoins obligatoire (jamais un rendu qui charge tout, cf. contrainte explicite de la tâche) |
| 6 | Le polling live (`refetchInterval`) ne crée pas de charge serveur excessive | ⚠️ Probable | Conditionné à l'existence d'un état non-terminal (pas un polling permanent) — raisonnable pour un usage solo, mais l'intervalle exact (proposé 5s) est une estimation non calibrée avec les temps réels d'exécution des adaptateurs headless (Backend #4 doit encore mesurer ces durées, cf. ARCHITECTURE §8). **Alerte Backend (#4)** : si les runs headless prennent plusieurs minutes, un intervalle de 5s est inutilement agressif — ajuster à ~15-30s serait plus raisonnable une fois les durées réelles connues |
| 7 | Le format `RunRow` compact (4 `ChainStatusChip` en ligne, pas de tableau détaillé par défaut) suffit à distinguer `format_drift` de `failed` d'un coup d'œil, sans dépliage systématique | ✅ Certain | Répond directement à l'exigence explicite ARCHITECTURE §7/§8 et US-F1-10 DoD ("visuellement distinguable... sans devoir interroger la base") — icône + couleur + libellé toujours visibles, pas cachés derrière un clic |

**Ratio hedge-to-verify global : faible à modéré.** Les deux points réellement incertains (absence d'endpoint catégories, intervalle de polling non calibré) sont signalés explicitement aux agents suivants plutôt que masqués par un choix présenté comme définitif.

---

## Prochaines étapes (pour l'agent suivant)

- **Backend (#4)** : `GET /api/collection-runs` doit permettre au frontend de dériver l'état courant de chaque enseigne (dernier `CollectionRunChain` par `storeChainId`, tous runs confondus) pour alimenter `TriggerControlPanel` — actuellement l'endpoint retourne les runs mais le frontend devra probablement croiser avec le run le plus récent contenant cette enseigne à un état terminal. Si cette dérivation s'avère complexe côté client, envisager un endpoint léger dédié `GET /api/collections/status` (état courant des 4 enseignes) plutôt que de recalculer côté frontend — signalé ici plutôt que décidé unilatéralement, car cela sort du contrat d'API déjà figé par l'Architecte.
- **Frontend (#5)** : implémenter `TriggerControlPanel`/`RunHistoryTable`/`PromotionsTable` selon la table Atomic Design §3 ; réutiliser TanStack Query avec `onMutate` pour le feedback optimiste < 200ms (§4.1) et `refetchInterval` conditionnel (§4.4, Selfdoubt #6). Le style visuel exact (tokens couleur/espacement) suit `docs/PALETTE.md` + Tailwind config à créer.
- **QA (#7)** : vérifier en conditions réelles que le badge `format_drift` reste perceptible sans daltonisme simulé (contraste + forme d'icône), et que le polling ne sature pas l'API lors d'un run headless long (Selfdoubt #6).
