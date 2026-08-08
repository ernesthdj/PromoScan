# Pipeline n8n — PromoScan

## Setup

### Prerequis
- Docker + Docker Compose installes
- Cle API Claude (Anthropic)
- Connexion PostgreSQL vers la BDD PromoScan

### Demarrage

```bash
# Depuis la racine du projet
docker compose up -d n8n

# Acceder a l'interface n8n
# http://localhost:5678
```

### Configuration

1. Ouvrir n8n dans le navigateur (`http://localhost:5678`)
2. Creer les credentials :
   - **PostgreSQL** : host, port, database, user, password (meme que DATABASE_URL)
   - **HTTP Header Auth** : `x-api-key` = `CLAUDE_API_KEY` pour l'API Anthropic
3. Importer le workflow `workflows/promo-scan-weekly.json`
4. Activer le workflow (toggle en haut a droite)

### Workflow : promo-scan-weekly

**Declenchement** : Cron chaque lundi a 6h00 UTC (`0 6 * * 1`)

**Etapes** :
1. **Cron Trigger** — Declenchement hebdomadaire
2. **Create ScanJob** — INSERT dans la table `scan_jobs` (status = running)
3. **For Each Brand** — Boucle sur les 6 enseignes (colruyt, delhaize, lidl, aldi, carrefour, action)
4. **HTTP Request** — GET sur PromoPromo.be/folders/{brand}
5. **Switch** — HTML disponible ? Oui -> parse, Non -> PDF fallback
6. **HTML Parse** — Extraction texte brut des promotions
7. **PDF Fallback** — Telecharger le PDF du folder, convertir en images
8. **Claude Vision** — OCR des images (model: claude-3-sonnet)
9. **Claude Haiku** — Extraction structuree JSON des promotions
10. **Zod Validate** — Validation du schema (product_name, prix, dates)
11. **Filter** — Exclure les promos invalides
12. **PostgreSQL Upsert** — INSERT promotions (ON CONFLICT source_url + product_name)
13. **Update ScanJob** — SET status = completed, items_found = N
14. **Error Handler** — Si erreur : log dans ScanJob.errors, status = partial/failed

### Declenchement manuel

Via l'API PromoScan :
```bash
curl -X POST http://localhost:3001/api/v1/admin/scan-jobs/trigger \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"source": "manual"}'
```

Ou directement via le bouton "Execute Workflow" dans l'interface n8n.

### Monitoring

- Les ScanJobs sont visibles via `GET /api/v1/admin/scan-jobs`
- Chaque job contient : source, status, items_found, errors
- En cas d'echec partiel (une enseigne down), le status est `partial`
- En cas d'echec total (0 items), le status est `failed`
