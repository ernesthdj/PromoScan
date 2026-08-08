# API Documentation — PromoScan

> Version : v1
> Base URL : `/api/v1/`
> Format reponse : `{ success: boolean, data: T | null, error: string | null }`
> Auth : Bearer token JWT dans le header `Authorization`

---

## Guide de demarrage local

### Prerequis
- Node.js >= 20
- PostgreSQL 16 (avec PostGIS recommande)
- npm ou pnpm

### Installation

```bash
# 1. Cloner et installer les dependances
cd PromoScan
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env
# Editer .env avec vos valeurs (DATABASE_URL, JWT_SECRET, etc.)

# 3. Generer le client Prisma
npm run db:generate

# 4. Appliquer les migrations
npm run db:migrate

# 5. (Optionnel) Seeder les donnees de reference
npm run db:seed

# 6. Demarrer le serveur de dev
npm run dev
# -> http://localhost:3001
```

### Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `NODE_ENV` | Environnement (development, production, test) | `development` |
| `PORT` | Port du serveur | `3001` |
| `DATABASE_URL` | URL de connexion PostgreSQL | `postgresql://user:pass@localhost:5432/promoscan` |
| `JWT_SECRET` | Secret pour les access tokens (min 32 chars) | `random-string-32+` |
| `JWT_REFRESH_SECRET` | Secret pour le hashing des refresh tokens | `another-random-string-32+` |
| `CLAUDE_API_KEY` | Cle API Anthropic (Claude) | `sk-ant-api03-...` |
| `ORS_API_KEY` | Cle API OpenRouteService | `your-ors-key` |
| `CORS_ORIGIN` | Origines autorisees (separees par virgule) | `http://localhost:5173` |

---

## Endpoints

### Health Check

```
GET /api/v1/health
```
**Response 200 :**
```json
{ "success": true, "data": { "status": "ok", "timestamp": "2026-06-05T12:00:00Z" }, "error": null }
```

---

### Auth (4 endpoints)

#### POST /auth/register

Inscription d'un nouvel utilisateur. Rate limited : 3 req/min/IP.

**Body :**
```json
{
  "email": "user@example.com",
  "password": "MyP@ssw0rd",
  "zoneCodePostal": "1000",
  "rgpdConsent": true
}
```

**Response 201 :**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "role": "user", "zoneCodePostal": "1000", "zoneCommune": "Bruxelles" },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "a1b2c3d4..."
  },
  "error": null
}
```

#### POST /auth/login

Connexion. Rate limited : 5 req/min/IP.

**Body :** `{ "email": "...", "password": "..." }`
**Response 200 :** Meme format que register.

#### POST /auth/refresh

Renouveler l'access token avec le refresh token (rotation : l'ancien refresh token est invalide).

**Body :** `{ "refreshToken": "a1b2c3d4..." }`
**Response 200 :**
```json
{ "success": true, "data": { "accessToken": "eyJ...", "refreshToken": "new-token" }, "error": null }
```

#### POST /auth/logout

Invalider le refresh token cote serveur. **Auth requise.**

**Body :** `{ "refreshToken": "a1b2c3d4..." }`
**Response 200 :** `{ "success": true, "data": null, "error": null }`

---

### Users (5 endpoints) — Auth requise

#### GET /users/me
Retourne le profil de l'utilisateur connecte (sans password_hash).

#### PATCH /users/me
Modifier la zone geographique et/ou les preferences de scoring.

**Body :**
```json
{
  "zoneCodePostal": "1050",
  "preferences": { "w1": 0.6, "w2": 0.2, "w3": 0.2 }
}
```

#### PATCH /users/me/email
Changer l'email (requiert le mot de passe).
**Body :** `{ "newEmail": "new@example.com", "password": "MyP@ssw0rd" }`

#### PATCH /users/me/password
Changer le mot de passe.
**Body :** `{ "oldPassword": "MyP@ssw0rd", "newPassword": "NewP@ss1!" }`

#### DELETE /users/me
Supprimer le compte (RGPD droit a l'oubli). Suppression en cascade de toutes les donnees.
**Body :** `{ "password": "MyP@ssw0rd" }`

---

### Shopping Lists (5 endpoints) — Auth requise

#### GET /shopping-lists
Liste de toutes les listes de courses (non archivees).

#### POST /shopping-lists
Creer une liste. Limite : 20 listes actives par utilisateur.
**Body :** `{ "name": "Courses semaine" }`

#### GET /shopping-lists/:id
Detail d'une liste avec ses articles.

#### PATCH /shopping-lists/:id
Renommer une liste.
**Body :** `{ "name": "Nouveau nom" }`

#### DELETE /shopping-lists/:id
Supprimer une liste et tous ses articles.

---

### Shopping List Items (4 endpoints) — Auth requise

#### POST /shopping-lists/:listId/items
Ajouter un article. Les doublons incrementent la quantite.
**Body :**
```json
{ "productName": "Poulet", "quantity": 2, "category": "proteines" }
```

#### PATCH /shopping-lists/:listId/items/:itemId
Modifier categorie, quantite ou statut checked.
**Body :** `{ "checked": true }`

#### DELETE /shopping-lists/:listId/items/:itemId
Supprimer un article.

#### POST /shopping-lists/:listId/items/uncheck-all
Decocher tous les articles (reinitialiser la liste).

---

### Products (1 endpoint) — Auth requise

#### GET /products/search?q=pou
Autocompletion produits. Min 2 caracteres. Retourne max 10 resultats.

---

### Promotions (2 endpoints) — Auth requise

#### GET /promotions?category=proteines&brand=colruyt&page=1&limit=20
Promotions actives (paginee). Filtrable par categorie et enseigne.

**Response 200 :**
```json
{
  "success": true,
  "data": {
    "items": [{ "id": "uuid", "productName": "Filet de poulet", "promoPrice": 3.99, "startDate": "2026-06-02", "endDate": "2026-06-08", "store": {...} }],
    "total": 42,
    "page": 1,
    "totalPages": 3
  },
  "error": null
}
```

#### GET /promotions/:id
Detail d'une promotion avec son magasin.

---

### Suggestions (2 endpoints) — Auth requise

#### POST /suggestions/match
Matching fuzzy entre une liste de courses et les promotions actives.

**Body :**
```json
{
  "listId": "uuid-de-la-liste",
  "filters": {
    "categories": ["proteines", "legumes"],
    "brands": ["colruyt", "delhaize"],
    "day": "2026-06-05"
  }
}
```

**Response 200 :**
```json
{
  "success": true,
  "data": [
    {
      "listItem": { "id": "uuid", "productName": "Poulet", "category": "proteines" },
      "matches": [
        {
          "promotion": { "id": "uuid", "productName": "Filet de poulet", "promoPrice": 3.99, "originalPrice": 5.99 },
          "store": { "id": "uuid", "name": "Colruyt Ixelles", "brand": "colruyt" },
          "fuzzyScore": 0.85
        }
      ]
    }
  ],
  "error": null
}
```

#### POST /suggestions/recommend
Recommandation par enseigne avec scoring multi-criteres (economies, distance, couverture).

**Body :** Meme format que /match.

**Response 200 :**
```json
{
  "success": true,
  "data": [
    {
      "store": { "id": "uuid", "name": "Colruyt Ixelles", "brand": "colruyt", "latitude": 50.83, "longitude": 4.37 },
      "matchedItems": 5,
      "totalSavings": 8.50,
      "distanceKm": 2.3,
      "score": 0.78,
      "promotions": [...]
    }
  ],
  "error": null
}
```

---

### Routes (4 endpoints) — Auth requise

#### POST /routes/calculate
Calcul d'itineraire optimise (TSP nearest neighbor + OpenRouteService).

**Body :**
```json
{
  "storeIds": ["uuid-1", "uuid-2", "uuid-3"],
  "origin": { "lat": 50.8503, "lng": 4.3517 }
}
```

**Response 200 :**
```json
{
  "success": true,
  "data": {
    "orderedStores": [...],
    "totalDurationMin": 35.2,
    "totalDistanceKm": 12.8,
    "geojson": { "type": "FeatureCollection", "features": [...] },
    "legs": [
      { "from": "Domicile", "to": "Colruyt Ixelles", "durationMin": 8.5, "distanceKm": 3.2 }
    ]
  },
  "error": null
}
```

#### GET /routes/saved?page=1&limit=20
Itineraires sauvegardes (pagine). Limite : 50 par utilisateur.

#### POST /routes/saved
Sauvegarder un itineraire.

#### DELETE /routes/saved/:id
Supprimer un itineraire sauvegarde.

---

### Admin — Scan Jobs (3 endpoints) — Auth Admin requise

#### GET /admin/scan-jobs?status=completed&page=1&limit=20
Liste des jobs de collecte (pagine, filtrable par statut).

#### GET /admin/scan-jobs/:id
Detail d'un job.

#### POST /admin/scan-jobs/trigger
Declencher un scan manuellement.
**Body :** `{ "source": "manual", "brands": ["colruyt", "delhaize"] }`

---

### Geocoding (2 endpoints) — Auth requise

#### GET /geo/postal-codes?q=105
Recherche de codes postaux belges (autocompletion). Rate limited : 10 req/min.

#### GET /geo/geocode?postal_code=1050
Geocoder un code postal belge. Retourne lat, lng, commune.

---

## Codes d'erreur

| Code | Signification |
|------|--------------|
| 400 | Validation echouee (Zod) |
| 401 | Token absent, invalide ou expire / Identifiants invalides |
| 403 | Acces interdit (non admin) |
| 404 | Ressource introuvable |
| 409 | Conflit (email deja utilise) |
| 429 | Rate limit depasse |
| 500 | Erreur interne |
| 503 | Service externe indisponible (ORS, Nominatim) |

## Pagination

Toutes les listes paginables suivent le pattern :
- Query params : `?page=1&limit=20`
- Reponse : `{ items: T[], total: number, page: number, totalPages: number }`
- Limit max : 100
- Defaut : page=1, limit=20
