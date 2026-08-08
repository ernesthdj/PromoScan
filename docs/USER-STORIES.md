# User Stories — PromoScan

> Agent : Product Owner (#1) — Phase 1 (Fondation) du pipeline Hub & Spoke
> Date : 2026-08-08
> Source unique : `docs/FOUNDATION.md` §9-10, `docs/brainstorm/L2-f1-collecte-promotions.md`, `docs/brainstorm/L3-f1-collecte-promotions.md`
> Périmètre : **F1 (Collecte & structuration des promotions) détaillée intégralement**, y compris son interface de contrôle. F2/F3/F4 en stub — non détaillées à ce stade.

---

## Légende

- **Priorité** : P0 (bloquant MVP F1) / P1 (important mais non bloquant) / P2 (nice-to-have)
- Chaque story référence le(s) UC (Use Case) et règle(s) métier (RG) du L2-f1 dont elle découle, pour traçabilité vers l'agent Architecte/Backend/Frontend suivant.

---

## F1 — Collecte & structuration des promotions

### US-F1-01 — Déclenchement planifié hebdomadaire de la collecte
**Priorité :** P0
**Référence :** UC-1 (L2), RG-1, RG-2, RG-3 (L2), séquence §3 (L3)

En tant que **système (Vercel Cron)**,
je veux **déclencher automatiquement une collecte des promotions une fois par semaine sur les 4 enseignes configurées (Colruyt, Delhaize, Aldi, Lidl)**,
afin de **maintenir le catalogue interne à jour sans intervention manuelle**.

**Definition of Done :**
- [ ] Un Vercel Cron Job appelle `POST /api/cron/collect-promotions` avec le header `Authorization: Bearer <CRON_SECRET>` selon une fréquence hebdomadaire configurée
- [ ] La requête est rejetée avec `401` si le `CRON_SECRET` est absent ou invalide
- [ ] Avant de démarrer, le système vérifie qu'aucun `CollectionRun` n'est en statut `running` (garde en base, pas en mémoire) ; si un run est en cours, la requête retourne `409`
- [ ] Un run bloqué en `running` au-delà d'un délai raisonnable (ex. 2x la durée max attendue) est considéré comme échoué et n'empêche pas un nouveau run de démarrer
- [ ] Un `CollectionRun` est créé en statut `running` au lancement, avec `startedAt` horodaté
- [ ] La liste des `StoreChain` actives (`isActive = true`) est itérée ; chaque enseigne inactive est ignorée sans erreur
- [ ] Le `crawl-delay` propre à chaque enseigne est respecté entre les requêtes vers un même site (5s minimum chez Colruyt, valeur par défaut raisonnable pour les autres)
- [ ] Aucun chemin/paramètre interdit par le `robots.txt` de chaque enseigne n'est requêté (voir table FOUNDATION.md §9.1)

---

### US-F1-02 — Extraction structurée via API interne (Colruyt)
**Priorité :** P0
**Référence :** UC-2 (L2), faisabilité technique §9.1 (FOUNDATION), contrat `StoreAdapter` §10.1 (FOUNDATION) / §1 (L3)

En tant que **système**,
je veux **récupérer les promotions Colruyt via son API JSON interne (`ecgproductmw.colruyt.be`) en utilisant la clé `X-CG-APIKEY` extraite dynamiquement**,
afin de **structurer les promotions de cette enseigne sans dépendre d'un rendu de navigateur (stratégie la plus légère des 4)**.

**Definition of Done :**
- [ ] Le `StoreAdapter` Colruyt implémente l'interface commune (`chainSlug: "colruyt"`, `strategy: "api"`, `fetchPromotions(): Promise<RawPromotion[]>`)
- [ ] La clé `X-CG-APIKEY` est extraite à la volée à chaque run (jamais codée en dur) ; un échec d'extraction marque l'enseigne en échec pour ce cycle sans bloquer les autres
- [ ] Chaque `RawPromotion` extraite contient au minimum : `rawProductName`, `promoPrice`, `validFrom`, `validTo`, `sourceUrl` ; les autres champs (`category`, `unitLabel`, `regularPrice`, `discountPercent`, `pricePerUnit`, `originLabel`) sont renseignés si disponibles ou `null` sinon
- [ ] Les données sont validées par un schéma Zod avant tout upsert
- [ ] Une entrée avec un champ obligatoire manquant est rejetée et loguée (statut, pas contenu brut), sans bloquer les autres entrées de la même enseigne
- [ ] L'upsert utilise la clé d'idempotence `(storeChainId, rawProductName, validFrom)` — un rejeu de la même collecte met à jour, ne duplique jamais
- [ ] La pagination de l'API est gérée si le volume de résultats dépasse une seule page
- [ ] Testé de bout en bout avec des données Colruyt réelles, vérifiées manuellement

---

### US-F1-03 — Extraction structurée via scraping HTML (Aldi)
**Priorité :** P0
**Référence :** UC-2 (L2), faisabilité technique §9.1 (FOUNDATION)

En tant que **système**,
je veux **récupérer les promotions Aldi par scraping HTML direct de `aldi.be/fr/offres.html` (HTML server-rendered, pas de rendu JS nécessaire)**,
afin de **structurer les promotions de cette enseigne avec l'approche la plus simple techniquement**.

**Definition of Done :**
- [ ] Le `StoreAdapter` Aldi implémente l'interface commune (`chainSlug: "aldi"`, `strategy: "html"`)
- [ ] Le parsing HTML respecte les mêmes garanties de champs minimum, validation Zod, gestion des rejets et idempotence que US-F1-02
- [ ] Aucun chemin/paramètre interdit par le `robots.txt` Aldi (`/mds/`, `?*filters`, `?*jobId=`) n'est requêté
- [ ] Testé de bout en bout avec des données Aldi réelles, vérifiées manuellement

---

### US-F1-04 — Extraction via rendu headless (Delhaize et/ou Lidl)
**Priorité :** P0
**Référence :** UC-2 (L2), faisabilité technique §9.1 (FOUNDATION), volumétrie §10.1/cas limites (L3)

En tant que **système**,
je veux **récupérer les promotions Delhaize et Lidl via un navigateur headless (Playwright + `@sparticuz/chromium`, compatible serverless)**,
afin de **capturer les données chargées dynamiquement en JS (non présentes dans le HTML brut initial), sans exécuter de script tiers non contrôlé**.

**Definition of Done :**
- [ ] Les `StoreAdapter` Delhaize et Lidl implémentent l'interface commune avec `strategy: "headless"`
- [ ] Le navigateur headless capture les données produit via l'appel interne observé (`delhaize.be/api/v1/...` pour Delhaize) ou via lecture du DOM rendu (Lidl), avec un timeout explicite par enseigne
- [ ] Aucun script arbitraire n'est injecté dans la page ; seule la lecture des données est effectuée
- [ ] La pagination/volumétrie est gérée (Delhaize a montré ~1062 produits sur une seule catégorie) ; si le temps d'exécution dépasse la capacité d'une seule invocation de fonction, la collecte est découpée (cron par enseigne ou par catégorie — décision technique laissée à l'Architecte/Backend)
- [ ] Mêmes garanties de champs minimum, validation Zod, gestion des rejets et idempotence que US-F1-02
- [ ] Au moins une des deux enseignes (Delhaize ou Lidl) est testée de bout en bout avec des données réelles, vérifiées manuellement (DoD FOUNDATION §9.1 — l'autre peut suivre en itération suivante du même sprint)

---

### US-F1-05 — Fallback d'extraction par IA pour documents non structurés (PDF/image)
**Priorité :** P1
**Référence :** UC-3 (L2)

En tant que **système**,
je veux **envoyer tout document promo non-HTML (PDF ou image) à Claude Vision avec un prompt d'extraction structurée, et valider sa réponse contre le schéma de promotion**,
afin de **couvrir le cas où une enseigne future (ou un contenu ponctuel) n'expose pas ses promotions dans une page HTML/API exploitable**.

**Definition of Done :**
- [ ] Un document non-HTML déclenche l'appel à Claude Vision avec un prompt d'extraction dédié
- [ ] La réponse JSON de Claude est validée contre le même schéma Zod que les autres adaptateurs avant toute insertion
- [ ] Une réponse non conforme au schéma est rejetée et loguée, sans insertion de données invalides
- [ ] Un timeout ou une erreur de l'API Claude déclenche un retry avec backoff, puis l'abandon de cette page pour ce cycle sans bloquer la collecte globale
- [ ] Au moins un cas PDF/image réel est traité de bout en bout et produit un résultat structuré valide (DoD FOUNDATION §9.1)

**Note priorité :** classée P1 (et non P0) car aucune des 4 enseignes actuelles ne nécessite ce fallback en usage nominal (toutes exposent du HTML/API exploitable) — cf. décision de pivot documentée en FOUNDATION §9.1. Reste nécessaire pour couvrir le DoD explicite du L2 et anticiper une 5e enseigne.

---

### US-F1-06 — Tolérance de panne partielle par enseigne
**Priorité :** P0
**Référence :** UC-4 (L2), RG-3 (L2), cas limites transactions (L3)

En tant que **système**,
je veux **isoler l'échec d'une enseigne (site down, blocage, format cassé) sans affecter la collecte des autres enseignes**,
afin de **garantir que le catalogue reste toujours partiellement à jour même en cas de défaillance d'une source externe**.

**Definition of Done :**
- [ ] L'upsert des promotions d'une enseigne se fait dans une transaction unique par enseigne (tout ou rien pour cette enseigne) ; aucune transaction globale inter-enseignes
- [ ] Un échec sur une enseigne (timeout, erreur réseau, erreur de parsing) marque cette enseigne en `failed` dans `resultsByChain` du `CollectionRun`, sans interrompre le traitement des autres enseignes du même cycle
- [ ] Les dernières données valides connues pour l'enseigne en échec sont conservées telles quelles (aucune suppression silencieuse)
- [ ] Le `CollectionRun` se clôture en statut `partial` si au moins une enseigne a échoué, `complete` si toutes ont réussi, `failed` uniquement si aucune enseigne n'a pu être traitée
- [ ] Testé par simulation : une panne forcée sur une enseigne n'empêche pas la collecte réussie des autres (DoD FOUNDATION §9.1)

---

### US-F1-07 — Détection de dérive de format
**Priorité :** P0
**Référence :** UC-2 (L2, scénario alternatif), RG-4 (L2)

En tant que **système**,
je veux **détecter qu'une enseigne renvoie 0 résultat (ou un résultat anormalement bas) alors que le run précédent en avait significativement plus**,
afin de **ne jamais écraser silencieusement le catalogue existant à cause d'un changement de structure de page non anticipé côté enseigne**.

**Definition de Done :**
- [ ] Le nombre de promotions extraites pour une enseigne est comparé au nombre du dernier `CollectionRun` réussi pour cette même enseigne
- [ ] Si le résultat est à 0 (ou significativement inférieur — seuil exact à définir par l'Architecte, voir section Selfdoubt) alors que le run précédent était > 0, l'enseigne est marquée en anomalie de type "dérive de format" dans `resultsByChain`, et **aucun upsert n'est effectué** pour cette enseigne sur ce cycle
- [ ] Le catalogue existant pour cette enseigne reste inchangé (dernières données valides conservées)
- [ ] L'anomalie est visible dans l'historique des runs (US-F1-10) pour permettre une investigation manuelle
- [ ] Testé par simulation : un run retournant 0 résultat sur une enseigne qui en avait précédemment déclenche l'anomalie sans vider le catalogue (DoD FOUNDATION §9.1)

---

### US-F1-08 — Respect du `robots.txt` et du `crawl-delay` par enseigne
**Priorité :** P0
**Référence :** RG-1, RG-2 (L2), table robots.txt §9.1 (FOUNDATION)

En tant que **système**,
je veux **ne jamais requêter un chemin ou paramètre explicitement interdit par le `robots.txt` de chaque enseigne, et respecter le `crawl-delay` quand il est spécifié**,
afin de **rester dans un usage légal et non abusif du scraping, et éviter un blocage IP par les enseignes**.

**Definition of Done :**
- [ ] Chaque `StoreAdapter` documente explicitement (commentaire ou config) les chemins/paramètres interdits vérifiés pour son enseigne (table FOUNDATION §9.1)
- [ ] Aucune requête n'est émise vers un chemin disallow (`/content/clp` HTML chez Colruyt hors JSON autorisé, `*/search/*` et `*/customerhub/quick-shop/*` chez Delhaize, `/mds/`, `?*filters`, `?*jobId=` chez Aldi, `*search?q=*`, `?offset=*`, `*sort=*`, `*id=*`, `*pageId=*` chez Lidl)
- [ ] Le délai de 5s minimum est respecté entre requêtes successives vers Colruyt ; un délai par défaut raisonnable est appliqué aux autres enseignes en l'absence de `crawl-delay` explicite
- [ ] Un User-Agent identifiable est utilisé sur toutes les requêtes sortantes
- [ ] Un seul run hebdomadaire par défaut (pas de sur-fréquence sans changement explicite de configuration)

---

### US-F1-09 — Consultation de la liste des promotions collectées
**Priorité :** P0
**Référence :** UC-5 (L2), contrat `/api/promotions` (L3)

En tant qu'**utilisateur authentifié (mentalyas)**,
je veux **consulter la liste des promotions collectées, filtrable par enseigne et par catégorie**,
afin de **vérifier visuellement ce qui a été collecté sans avoir besoin d'un accès direct à la base de données**.

**Definition of Done :**
- [ ] La page `/dashboard/collecte` est accessible uniquement à un utilisateur authentifié via Supabase Auth (redirection ou `401` sinon)
- [ ] `GET /api/promotions` accepte les query params optionnels `storeChain`, `category`, `page`, `limit` et retourne `{ success, data: { items, total, page } }`
- [ ] Un accès non authentifié à l'endpoint retourne `401`
- [ ] La liste affiche au minimum : produit, enseigne, prix normal, prix promo, catégorie, dates de validité
- [ ] Les filtres enseigne et catégorie combinés retournent uniquement les résultats correspondants
- [ ] La pagination fonctionne correctement (page/limit) même avec un grand volume de promotions (Delhaize a montré ~1000+ produits)

---

### US-F1-10 — Consultation de l'historique des runs de collecte
**Priorité :** P0
**Référence :** UC-5 (L2), contrat `/api/collection-runs` (L3)

En tant qu'**utilisateur authentifié (mentalyas)**,
je veux **consulter l'historique des `CollectionRun` (date, statut, nombre d'items par enseigne)**,
afin de **repérer rapidement un échec ou une dérive de format sans devoir interroger la base directement**.

**Definition of Done :**
- [ ] `GET /api/collection-runs` accepte la pagination (`page`, `limit`) et retourne `{ success, data: { items, total } }`
- [ ] Un accès non authentifié retourne `401`
- [ ] Chaque entrée affiche : date de début/fin, statut global (`running`/`partial`/`complete`/`failed`), et le détail par enseigne (`resultsByChain` : statut, nombre d'items, erreur éventuelle)
- [ ] Une anomalie de dérive de format (US-F1-07) est visuellement distinguable d'un échec technique classique (US-F1-06)
- [ ] Les runs sont triés du plus récent au plus ancien par défaut

---

### US-F1-11 — Déclenchement manuel d'une collecte
**Priorité :** P0
**Référence :** UC-5 (L2), contrat `/api/collections/trigger` (L3)

En tant qu'**utilisateur authentifié (mentalyas)**,
je veux **déclencher une collecte manuelle à la demande, sans attendre le cron hebdomadaire**,
afin de **valider un correctif ou tester une enseigne pendant le développement/debug, sans devoir attendre le prochain cycle planifié**.

**Definition of Done :**
- [ ] `POST /api/collections/trigger` nécessite une session utilisateur valide (cookie Supabase) ; `401` sinon
- [ ] Le déclenchement manuel réutilise exactement la même logique métier que le cron (`/api/cron/collect-promotions`), seul le mécanisme d'authentification diffère
- [ ] Si une collecte est déjà en cours (`running`), la requête retourne `409` avec un message clair affiché côté UI (pas juste un code d'erreur brut)
- [ ] Le déclenchement manuel est visible dans l'historique des runs (US-F1-10) au même titre qu'un run planifié
- [ ] Un bouton/action de déclenchement est présent sur `/dashboard/collecte`, désactivé pendant qu'un run est en cours (feedback immédiat < 200ms sur l'état du bouton)

---

### US-F1-12 — Garantie d'idempotence de la collecte
**Priorité :** P0
**Référence :** cas limites idempotence (L3), contrainte `Promotion` unique (FOUNDATION §3/§10.1)

En tant que **système**,
je veux **garantir qu'un rejeu de la même collecte (même enseigne, même produit, même période de validité) met à jour l'entrée existante plutôt que d'en créer un doublon**,
afin de **maintenir un catalogue propre même en cas de retry après échec partiel ou de déclenchement manuel répété**.

**Definition of Done :**
- [ ] La contrainte unique `(storeChainId, rawProductName, validFrom)` est appliquée en base sur la table `Promotion`
- [ ] Un upsert (et non un insert brut) est utilisé pour toute écriture de promotion
- [ ] Un test vérifie qu'un rejeu identique de la même collecte ne crée pas de duplicata et ne fait que mettre à jour `collectedAt` et les champs modifiés

---

## F2 — Profil alimentation *(stub — non détaillé)*

### US-F2-STUB — Définir un profil alimentaire (type général ou recettes précises)
> **Non détaillé — à approfondir via `/brainstorm niveau2` avant implémentation.** Vision uniquement disponible (FOUNDATION §2, §3 — entité `DietProfile` provisoire).

## F3 — Budget *(stub — non détaillé)*

### US-F3-STUB — Définir une enveloppe budgétaire pour la période de courses
> **Non détaillé — à approfondir via `/brainstorm niveau2` avant implémentation.** Vision uniquement disponible (FOUNDATION §2, §3 — entité `Budget` provisoire).

## F4 — Recommandation de circuit de magasins *(stub — non détaillé)*

### US-F4-STUB — Recommander un circuit de magasins optimisé selon profil + budget + région
> **Non détaillé — à approfondir via `/brainstorm niveau2` (et niveau 3, signal fort anticipé) avant implémentation.** Vision uniquement disponible (FOUNDATION §2, §3, §6 — entité `Circuit` provisoire, algorithmes d'allocation/circuit anticipés mais non conçus).

---

## Selfdoubt — Audit d'incertitude sur les hypothèses métier

| # | Affirmation | Niveau | Action |
|---|-------------|--------|--------|
| 1 | Traduction fidèle des UC-1 à UC-5 et RG-1 à RG-5 du L2-f1 en stories, sans ajout de scope | ✅ Certain | Vérifié ligne à ligne contre L2-f1 et L3-f1 avant rédaction |
| 2 | Priorisation P0 de US-F1-01 à US-F1-04, US-F1-06 à US-F1-12 (cœur de la collecte + interface) | ✅ Certain | Découle directement du DoD explicite de FOUNDATION §9.1, qui les liste toutes comme critères d'acceptation non cochés |
| 3 | US-F1-05 (fallback Claude Vision) classée P1 plutôt que P0 | ⚠️ Probable | Aucune des 4 enseignes actuelles ne le nécessite en usage nominal (toutes ont une source HTML/API exploitable confirmée) — mais le DoD FOUNDATION §9.1 l'exige explicitement ("Au moins un cas PDF/image traité"). Signalé à l'Architecte/Backend : à confirmer si ce test peut être fait sur un document de test synthétique plutôt qu'une vraie page enseigne, faute de cas réel disponible actuellement |
| 4 | Seuil numérique exact de "dérive de format" (US-F1-07) — "0 ou significativement inférieur" | ❌ Hypothèse | Le L2/L3 ne fixe aucun pourcentage/seuil précis, seulement "0 résultat inattendu". J'ai volontairement laissé le seuil ouvert dans le DoD plutôt que d'inventer un chiffre (ex. "-50%") non validé par le brainstorm — **à trancher par l'Architecte (#2)** lors de la conception technique détaillée, avec idéalement une valeur configurable par enseigne plutôt qu'un seuil global fixe |
| 5 | US-F1-04 : DoD accepte qu'une seule des deux enseignes headless (Delhaize OU Lidl) soit livrée en premier | ✅ Certain | Reprend explicitement le DoD FOUNDATION §9.1 ("Au moins une enseigne headless... collectée de bout en bout") — pas une simplification de ma part |
| 6 | Découpage architecture cron (un seul orchestrateur vs cron par enseigne) non tranché dans les stories | ✅ Certain (délibéré) | Le L3-f1 lui-même laisse ce point ouvert ("à trancher précisément lors de l'implémentation selon les temps mesurés") — je n'invente pas de décision technique qui revient à l'Architecte |
| 7 | Absence de story dédiée "matching Product ↔ Promotion" (résolution de `productId`) | ⚠️ Probable | Le L2/L3-f1 mentionne `productId` comme "matching différé" et le renvoie explicitement à F4 (section 6 FOUNDATION : "à trancher selon le volume/qualité réel des données de F1"). Je n'ai donc pas créé de story F1 dessus pour ne pas pré-empter une décision hors périmètre F1 — à vérifier que l'Architecte est bien d'accord avec ce découpage |
| 8 | Stories F2/F3/F4 réduites à un stub d'une ligne, sans inventer de use cases | ✅ Certain | Conforme à la consigne explicite de la tâche et à FOUNDATION §2 qui marque ces features "niveau 1 seulement" |

**Ratio hedge-to-verify global : faible à modéré.** Les deux points d'incertitude réelle (seuil de dérive de format, priorité du fallback Vision) sont explicitement signalés à l'agent suivant plutôt que masqués par une valeur inventée.

---

## Prochaines étapes (pour l'agent suivant)

- **Architect (#2)** : trancher le seuil numérique de dérive de format (US-F1-07), la stratégie cron finale (orchestrateur unique vs cron par enseigne, cf. L3-f1 §4), et le schéma Prisma définitif à partir de FOUNDATION §3.
- **UI/UX (#3)** : concevoir `/dashboard/collecte` à partir de US-F1-09, US-F1-10, US-F1-11 (liste filtrable, historique des runs, déclenchement manuel avec état désactivé pendant un run en cours).
