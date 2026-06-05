# Frontend — PromoScan
> Agent #5 — Frontend Developer
> Date : 2026-06-05
> Source : FONDATION-PROMOSCAN.md + ui.md + archi.md

---

## A. Stack technique

| Technologie | Version | Role |
|------------|---------|------|
| React | 18.3+ | Librairie UI |
| TypeScript | 5.x (strict) | Type safety |
| Tailwind CSS | 3.4 | Utility-first CSS |
| Vite | 5.4 | Build et HMR |
| React Router | v6 | Routing SPA |
| TanStack Query | v5 | Server state, cache, mutations |
| Zustand | 4.5 | Client state (auth, filtres) |
| React Hook Form | 7.53 | Formulaires performants |
| Zod | 3.23 | Validation schemas (partage avec backend) |
| react-leaflet | 4.2 | Carte interactive |
| lucide-react | 0.453 | Icones |
| clsx | 2.1 | Concatenation conditionnelle de classes |

---

## B. Architecture Atomic Design

### Atoms (8 composants)
| Composant | Fichier | Description |
|-----------|---------|-------------|
| Button | `atoms/Button.tsx` | Variantes primary/secondary/ghost/danger, tailles sm/md/lg, loading state |
| Input | `atoms/Input.tsx` | Label, error, helperText, aria-describedby |
| Checkbox | `atoms/Checkbox.tsx` | Accessible, label optionnel |
| Badge | `atoms/Badge.tsx` | discount/category/success/warning/error |
| Tag | `atoms/Tag.tsx` | Selectionnable, removable, variantes store/category/day |
| Icon | `atoms/Icon.tsx` | Wrapper lucide-react, tailles 16/20/24 |
| Spinner | `atoms/Spinner.tsx` | Loading accessible (role="status"), tailles sm/md/lg |
| Toast | `atoms/Toast.tsx` | Notification avec undo, auto-dismiss, variantes |

### Molecules (9 composants)
| Composant | Fichier | Description |
|-----------|---------|-------------|
| PromoCard | `molecules/PromoCard.tsx` | Carte promo : image, prix barre, prix promo, enseigne, dates |
| ProductItem | `molecules/ProductItem.tsx` | Ligne liste de courses : checkbox, nom, quantite, delete |
| StoreChip | `molecules/StoreChip.tsx` | Chip enseigne colore par marque |
| SearchBar | `molecules/SearchBar.tsx` | Input recherche + autocompletion dropdown (combobox) |
| FilterGroup | `molecules/FilterGroup.tsx` | Groupe de chips selectionnables |
| ScoreIndicator | `molecules/ScoreIndicator.tsx` | Pastille couleur vert/jaune/rouge + score numerique |
| PriceDisplay | `molecules/PriceDisplay.tsx` | Prix barre + prix promo + pourcentage |
| EmptyState | `molecules/EmptyState.tsx` | Etat vide parametrable : icone, titre, description, CTA |
| RouteStopCard | `molecules/RouteStopCard.tsx` | Etape itineraire : magasin, articles, economies |

### Organisms (9 composants)
| Composant | Fichier | Description |
|-----------|---------|-------------|
| Navbar | `organisms/Navbar.tsx` | Sidebar desktop repliable (240px / 64px) |
| BottomNav | `organisms/BottomNav.tsx` | Bottom tab bar 4 onglets mobile (56px) |
| PromoGrid | `organisms/PromoGrid.tsx` | Grille responsive 2/3/4 colonnes + pagination |
| ShoppingList | `organisms/ShoppingList.tsx` | Liste complete : ajout + items groupes par categorie |
| SuggestionPanel | `organisms/SuggestionPanel.tsx` | Recommandations par enseigne avec accordeons |
| MapView | `organisms/MapView.tsx` | Carte Leaflet : markers colores, polyline, popup, auto-fit |
| RouteSummary | `organisms/RouteSummary.tsx` | Resume itineraire : stops, distances, economies, save |
| FilterBar | `organisms/FilterBar.tsx` | Filtres repliables (mobile) / sidebar (desktop) |
| HeroSection | `organisms/HeroSection.tsx` | Hero landing page |

### Templates (2 layouts)
| Template | Fichier | Description |
|----------|---------|-------------|
| AppLayout | `templates/AppLayout.tsx` | Layout principal : Navbar + Outlet + BottomNav |
| AuthLayout | `templates/AuthLayout.tsx` | Layout auth : centrage + card + logo |

---

## C. Pages (10 ecrans)

| Route | Composant | Auth | Description |
|-------|-----------|------|-------------|
| `/` | Landing | Non | Page d'accueil marketing |
| `/login` | Login | Non | Formulaire connexion (RHF + Zod) |
| `/register` | Register | Non | Inscription + code postal + RGPD |
| `/dashboard` | Dashboard | Oui | Vue d'ensemble : promos, liste, economies |
| `/lists` | ShoppingListPage | Oui | Liste des listes de courses |
| `/lists/:id` | ShoppingListPage | Oui | Detail et CRUD items d'une liste |
| `/promos` | PromotionsPage | Oui | Grille de promos avec filtres |
| `/suggestions` | SuggestionsPage | Oui | Matching promos vs liste, scoring |
| `/route` | MapPage | Oui | Carte + resume itineraire |
| `/profile` | ProfilePage | Oui | Zone geo, preferences, compte |
| `*` | NotFound | Non | Page 404 |

---

## D. Hooks TanStack Query

| Hook | Fichier | Endpoints consommes | Pattern |
|------|---------|---------------------|---------|
| useAuth | `hooks/useAuth.ts` | POST /auth/login, /register, /logout | Mutations avec redirect |
| useShoppingLists | `hooks/useShoppingList.ts` | GET /shopping-lists, CRUD complet | Queries + mutations + optimistic updates |
| usePromotions | `hooks/usePromotions.ts` | GET /promotions, /products/search | Queries avec filtres, cache 5min |
| useSuggestions | `hooks/useSuggestions.ts` | POST /suggestions/match, /recommend | Mutations (donnees dynamiques) |
| useRoutes | `hooks/useRoutes.ts` | POST /routes/calculate, CRUD /routes/saved | Mutation calcul + queries historique |
| useGeolocation | `hooks/useGeolocation.ts` | GET /geo/postal-codes, /geocode | Queries + mutation update profil |

---

## E. Stores Zustand

| Store | Fichier | Donnees | Persistance |
|-------|---------|---------|-------------|
| authStore | `stores/authStore.ts` | user, accessToken, refreshToken, isAuthenticated | localStorage (persist) |
| listStore | `stores/listStore.ts` | activeListId, selectedItems | Memoire seule |
| filterStore | `stores/filterStore.ts` | selectedBrands, selectedCategories, sortBy | Memoire seule |

---

## F. Design Tokens

Fichier source : `styles/tokens.css`

- **Couleurs** : primary (vert), secondary (orange), accent (bleu), neutral, success, warning, error
- **Typographie** : Inter, tailles xs a 3xl
- **Espacements** : grille 8px (space-1 a space-16)
- **Bordures** : radius sm/md/lg/xl/full, widths thin/medium/thick
- **Ombres** : sm/md/lg
- **Animations** : fast 150ms, normal 250ms, slow 400ms
- **Dark mode** : prevu via `[data-theme="dark"]`, pas implemente au MVP
- **Breakpoints** : 768px (sm/tablette), 1440px (lg/desktop)

---

## G. Guide de demarrage local

```bash
# Prerequis : Node.js 20+, npm 10+

# 1. Installer les dependances
cd src/web
npm install

# 2. Configurer l'environnement
# Creer .env dans src/web/ :
# VITE_API_BASE_URL=http://localhost:3000/api/v1

# 3. Lancer le serveur de dev
npm run dev
# -> http://localhost:5173

# 4. Build production
npm run build

# 5. Preview production
npm run preview
```

---

## H. Conventions de code

1. **TypeScript strict** : pas de `any`, types explicites sur les retours publics
2. **Imports** : types partages depuis `../../shared/`, jamais redeclares
3. **Composants** : `export function` nomme (pas de default export), props typees via `interface`
4. **Fichiers** : PascalCase pour les composants, camelCase pour les hooks/utils/stores
5. **Barrel exports** : chaque dossier de composants a un `index.ts`
6. **Tailwind** : utility-first, extraire en composant si 3+ repetitions
7. **Responsive** : mobile-first (375 -> 768 -> 1440), classes sm: et lg:
8. **Accessibilite** : aria-labels sur les boutons icones, role="alert" sur les erreurs, focus visible
9. **Grille 8px** : tous les espacements en multiples de 8 (ou 4 pour micro)
10. **Pas de logique metier** dans les composants — deleguer aux hooks et stores
