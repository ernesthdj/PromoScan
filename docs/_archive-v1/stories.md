# User Stories — PromoScan (MVP)
> Agent #1 — Product Owner
> Date : 2026-06-05
> Source : FONDATION-PROMOSCAN.md

---

## Stories transversales (Auth, Profil, Zone)

### US-001 — Inscription utilisateur
**En tant que** visiteur, **je veux** creer un compte avec mon email et un mot de passe **afin de** sauvegarder ma liste de courses et mes preferences.

**Criteres d'acceptation (DoD) :**
- [ ] Le formulaire exige un email valide (format RFC 5322) et un mot de passe de 8 caracteres minimum (1 majuscule, 1 chiffre, 1 special)
- [ ] Le mot de passe est hashe avec bcrypt (cost factor >= 10) avant insertion en BDD
- [ ] Un email en doublon retourne une erreur 409 sans reveler si le compte existe (anti-enumeration)
- [ ] Le consentement RGPD (zone geo, cookies) est collecte via checkbox obligatoire
- [ ] Apres inscription, un JWT (JSON Web Token) access (15 min) + refresh (7 jours) est emis
- [ ] Un email de bienvenue est envoye (ou loggue en dev)

**Priorite :** P0
**Complexite :** M
**Feature :** Transversale (Auth)

---

### US-002 — Connexion utilisateur
**En tant que** utilisateur inscrit, **je veux** me connecter avec mon email et mot de passe **afin de** retrouver mes donnees personnelles.

**Criteres d'acceptation (DoD) :**
- [ ] Login via email + mot de passe, reponse JWT access + refresh
- [ ] En cas d'echec (email inconnu ou mot de passe faux), le message d'erreur est generique ("Identifiants invalides") — pas de distinction
- [ ] Rate limiting : max 5 tentatives par IP par minute, puis blocage temporaire 15 min
- [ ] Le refresh token permet de renouveler l'access token sans re-saisir les identifiants
- [ ] Deconnexion : le refresh token est invalide cote serveur

**Priorite :** P0
**Complexite :** M
**Feature :** Transversale (Auth)

---

### US-003 — Definir sa zone geographique
**En tant que** utilisateur connecte, **je veux** renseigner mon code postal ou ma commune **afin que** les suggestions de magasins soient pertinentes pour ma localisation.

**Criteres d'acceptation (DoD) :**
- [ ] L'utilisateur saisit un code postal belge (4 chiffres, 1000-9999) ou selectionne une commune dans une liste
- [ ] Le code postal est valide contre une liste de reference des codes postaux belges
- [ ] La zone est convertie en coordonnees GPS via geocoding (Nominatim/OpenStreetMap)
- [ ] La zone est sauvegardee dans le profil utilisateur (champs zone_code_postal + zone_commune)
- [ ] La zone peut etre modifiee a tout moment depuis le profil
- [ ] Si aucune zone n'est definie, un bandeau invite l'utilisateur a la renseigner avant d'acceder aux suggestions

**Priorite :** P0
**Complexite :** S
**Feature :** Transversale (Profil)

---

### US-004 — Consulter et modifier son profil
**En tant que** utilisateur connecte, **je veux** consulter et modifier mes informations de profil **afin de** maintenir mes donnees a jour.

**Criteres d'acceptation (DoD) :**
- [ ] L'utilisateur peut modifier : zone geographique, preferences (priorite budget vs distance)
- [ ] Le changement d'email requiert une confirmation par mot de passe
- [ ] Le changement de mot de passe requiert l'ancien mot de passe + nouveau avec les memes regles que l'inscription
- [ ] Un bouton "Supprimer mon compte" declenche la suppression de toutes les donnees (RGPD droit a l'oubli) apres confirmation explicite
- [ ] La suppression est irreversible et confirmee par un message

**Priorite :** P1
**Complexite :** M
**Feature :** Transversale (Profil)

---

## F1 — Collecte automatique des folders

### US-005 — Declenchement automatique de la collecte
**En tant que** systeme (pipeline n8n), **je veux** declencher automatiquement le scraping des folders chaque semaine **afin de** maintenir la base de promotions a jour sans intervention humaine.

**Criteres d'acceptation (DoD) :**
- [ ] Le workflow n8n se declenche automatiquement chaque semaine (cron configurable)
- [ ] La source primaire est PromoPromo.be, avec fallback vers les sites des enseignes
- [ ] Un ScanJob est cree en BDD avec status "running" au demarrage
- [ ] Les enseignes cibles sont : Colruyt, Delhaize, Lidl, Aldi, Carrefour, Action
- [ ] Le job ne bloque pas si une enseigne est indisponible — les autres sont traitees normalement

**Priorite :** P0
**Complexite :** XL
**Feature :** F1

---

### US-006 — Parsing HTML et extraction des donnees brutes
**En tant que** systeme (pipeline), **je veux** parser le HTML des pages de folders **afin d'** extraire le contenu textuel brut des promotions.

**Criteres d'acceptation (DoD) :**
- [ ] Le parser extrait le texte brut de chaque offre promotionnelle (nom produit, prix, dates)
- [ ] Les donnees scrapees sont sanitizees avant toute insertion en BDD (prevention XSS stocke)
- [ ] Si le HTML est inaccessible (timeout, 403, structure changee), le job continue avec les autres enseignes et l'erreur est logguee dans ScanJob.errors
- [ ] Le fallback OCR via Claude Vision est declenche pour les contenus PDF/image

**Priorite :** P0
**Complexite :** L
**Feature :** F1

---

### US-007 — Monitoring et logs des jobs de collecte
**En tant qu'** administrateur, **je veux** consulter l'etat des jobs de collecte (ScanJob) **afin de** detecter les erreurs et maintenir la qualite des donnees.

**Criteres d'acceptation (DoD) :**
- [ ] Chaque ScanJob enregistre : source, status (running/completed/failed/partial), started_at, completed_at, items_found, errors (JSON)
- [ ] Un endpoint API GET /api/v1/admin/scan-jobs retourne la liste paginee des jobs (auth admin requise)
- [ ] Le taux d'erreur est calculable (items_found vs erreurs) pour chaque job
- [ ] Les jobs en echec total (0 items) sont marques "failed" et non "completed"

**Priorite :** P1
**Complexite :** M
**Feature :** F1

---

## F2 — Analyse IA des offres

### US-008 — Extraction structuree via Claude API
**En tant que** systeme (pipeline), **je veux** envoyer le texte brut des promotions a Claude API pour en extraire des donnees structurees **afin de** normaliser les offres en entites Promotion exploitables.

**Criteres d'acceptation (DoD) :**
- [ ] Chaque promotion extraite contient : product_name, category (enum), original_price, promo_price, discount_pct, start_date, end_date, enseigne, source_url
- [ ] Le modele utilise est Claude Haiku pour le volume, Sonnet pour les cas ambigus
- [ ] Les prix sont extraits au format decimal avec 2 decimales (ex: 3.49, pas "3,49 EUR")
- [ ] Les dates sont normalisees au format ISO 8601 (YYYY-MM-DD)
- [ ] Si l'extraction echoue pour une promo, le raw_text est conserve et l'erreur est logguee — pas de perte de donnee
- [ ] Le timeout par appel Claude est de 30 secondes avec 2 retries max

**Priorite :** P0
**Complexite :** XL
**Feature :** F2

---

### US-009 — Categorisation automatique des produits
**En tant que** systeme, **je veux** categoriser chaque produit extrait dans une categorie alimentaire **afin de** faciliter le matching avec la liste de courses de l'utilisateur.

**Criteres d'acceptation (DoD) :**
- [ ] Les categories sont un enum fini : proteines, legumes, fruits, produits-laitiers, boulangerie, boissons, epicerie, surgeles, hygiene, entretien, autres
- [ ] Claude API assigne une categorie a chaque produit lors de l'extraction
- [ ] Si la categorie est incertaine, "autres" est assigne par defaut
- [ ] La precision de categorisation est verifiable par echantillonnage (objectif > 90%)

**Priorite :** P0
**Complexite :** M
**Feature :** F2

---

### US-010 — OCR des folders PDF/image via Claude Vision
**En tant que** systeme (pipeline), **je veux** extraire le texte des folders en format PDF ou image via Claude Vision **afin de** couvrir les enseignes qui ne publient pas de folder en HTML.

**Criteres d'acceptation (DoD) :**
- [ ] Les fichiers PDF sont convertis en images page par page avant envoi a Claude Vision
- [ ] Claude Vision retourne le texte brut, qui est ensuite traite par le meme pipeline d'extraction (US-008)
- [ ] Le cout API Vision est tracke par ScanJob (nombre d'images traitees)
- [ ] Si l'OCR echoue (image illisible, timeout), l'erreur est logguee et le job continue

**Priorite :** P1
**Complexite :** L
**Feature :** F2

---

## F3 — Liste de courses personnalisable

### US-011 — Creer une liste de courses
**En tant que** utilisateur connecte, **je veux** creer une nouvelle liste de courses nommee **afin d'** organiser mes achats par occasion (ex: "Semaine", "BBQ samedi").

**Criteres d'acceptation (DoD) :**
- [ ] L'utilisateur saisit un nom pour la liste (1-100 caracteres, pas de caracteres speciaux dangereux)
- [ ] La liste est creee vide avec un timestamp created_at
- [ ] Un utilisateur peut avoir un maximum de 20 listes actives (limite configurable)
- [ ] Si la limite est atteinte, un message explicite invite a supprimer une liste existante

**Priorite :** P0
**Complexite :** S
**Feature :** F3

---

### US-012 — Ajouter un article a la liste
**En tant que** utilisateur, **je veux** ajouter un article a ma liste de courses en specifiant le nom et la quantite **afin de** constituer ma liste d'achats.

**Criteres d'acceptation (DoD) :**
- [ ] L'utilisateur saisit le nom de l'article (1-200 caracteres) et une quantite (entier >= 1, defaut 1)
- [ ] L'autocompletion suggere des noms de produits connus (table Product) apres 2 caracteres saisis
- [ ] L'article est automatiquement categorise si le produit est connu, sinon l'utilisateur choisit la categorie manuellement
- [ ] Les doublons (meme nom dans la meme liste) incrementent la quantite au lieu de creer une nouvelle ligne
- [ ] L'ajout est instantane (< 200ms de feedback visuel)

**Priorite :** P0
**Complexite :** M
**Feature :** F3

---

### US-013 — Categoriser un article
**En tant que** utilisateur, **je veux** assigner ou modifier la categorie d'un article de ma liste **afin de** ameliorer la precision des suggestions de promos.

**Criteres d'acceptation (DoD) :**
- [ ] Un dropdown propose les categories de l'enum (proteines, legumes, fruits, etc.)
- [ ] La categorie selectionnee est sauvegardee immediatement (pas de bouton "Enregistrer" requis)
- [ ] La categorie par defaut est "autres" si non detectee automatiquement

**Priorite :** P1
**Complexite :** S
**Feature :** F3

---

### US-014 — Cocher un article achete
**En tant que** utilisateur, **je veux** cocher un article comme achete **afin de** suivre ma progression en magasin.

**Criteres d'acceptation (DoD) :**
- [ ] Un tap/clic sur la checkbox passe l'article en "checked = true" avec un effet visuel (barre/grisage)
- [ ] L'article coche reste visible dans la liste (pas supprime) mais descend en bas
- [ ] Un bouton "Decocher tout" permet de reinitialiser la liste pour une reutilisation
- [ ] Le statut checked est synchronise avec le serveur en temps reel ou au prochain sync

**Priorite :** P1
**Complexite :** S
**Feature :** F3

---

### US-015 — Supprimer un article ou une liste
**En tant que** utilisateur, **je veux** supprimer un article individuel ou une liste complete **afin de** garder mon espace organise.

**Criteres d'acceptation (DoD) :**
- [ ] La suppression d'un article est immediate avec une option "Annuler" pendant 5 secondes (undo)
- [ ] La suppression d'une liste complete requiert une confirmation ("Supprimer la liste X et ses Y articles ?")
- [ ] La suppression est definitive apres confirmation (soft delete optionnel en BDD)
- [ ] Si la liste est vide (0 articles), aucun message de confirmation n'est necessaire

**Priorite :** P1
**Complexite :** S
**Feature :** F3

---

### US-016 — Afficher une liste vide avec guidance
**En tant que** utilisateur, **je veux** voir un etat vide explicite quand ma liste n'a aucun article **afin de** comprendre comment commencer.

**Criteres d'acceptation (DoD) :**
- [ ] L'etat vide affiche une illustration ou icone + un message "Votre liste est vide. Ajoutez vos premiers articles !"
- [ ] Un bouton CTA (Call To Action) "Ajouter un article" est visible dans l'etat vide
- [ ] Si l'utilisateur n'a aucune liste, l'etat vide propose "Creer ma premiere liste"

**Priorite :** P2
**Complexite :** S
**Feature :** F3

---

## F4 — Suggestions "ou et quand"

### US-017 — Matching promos / liste de courses
**En tant que** utilisateur, **je veux** que le systeme compare ma liste de courses aux promotions actives **afin de** voir quelles promos correspondent a mes besoins.

**Criteres d'acceptation (DoD) :**
- [ ] Le matching utilise le fuzzy matching (fuse.js) entre le product_name de la liste et les product_name des promotions actives
- [ ] Le seuil de matching est configurable (defaut : score fuse.js >= 0.4)
- [ ] Les resultats sont groupes par article de la liste : pour chaque article, les promos matchees sont listees
- [ ] Si aucune promo ne matche un article, l'article est affiche avec la mention "Aucune promo trouvee"
- [ ] Seules les promotions dont la date de validite couvre la semaine en cours sont retournees

**Priorite :** P0
**Complexite :** L
**Feature :** F4

---

### US-018 — Recommandation par enseigne
**En tant que** utilisateur, **je veux** voir une synthese par enseigne indiquant combien d'articles de ma liste y sont en promo et l'economie estimee **afin de** choisir ou faire mes courses.

**Criteres d'acceptation (DoD) :**
- [ ] Pour chaque enseigne dans la zone, un resume affiche : nombre d'articles matches, economie totale estimee (somme des reductions), distance depuis la zone de l'utilisateur
- [ ] Les enseignes sont triees par score multi-criteres : score = (economie * w1) + (proximite * w2) + (nb_articles * w3)
- [ ] Les poids (w1, w2, w3) sont configurables dans les preferences utilisateur (priorite budget vs distance)
- [ ] Si aucun magasin n'a de promo pour la liste, un message explicite est affiche

**Priorite :** P0
**Complexite :** L
**Feature :** F4

---

### US-019 — Filtrage des suggestions
**En tant que** utilisateur, **je veux** filtrer les suggestions par categorie, par enseigne ou par jour de la semaine **afin de** affiner mes resultats.

**Criteres d'acceptation (DoD) :**
- [ ] Filtre par categorie : multi-select parmi l'enum des categories alimentaires
- [ ] Filtre par enseigne : multi-select parmi les enseignes disponibles dans la zone
- [ ] Filtre par jour : selection d'un jour de la semaine (affiche les promos valides ce jour-la + horaires du magasin)
- [ ] Les filtres sont combinables (AND) et appliques en temps reel (< 300ms)
- [ ] Un bouton "Reinitialiser les filtres" restaure la vue par defaut

**Priorite :** P1
**Complexite :** M
**Feature :** F4

---

### US-020 — Gestion du cas "aucun resultat"
**En tant que** utilisateur, **je veux** un feedback clair quand aucune promo ne correspond a ma liste ou a mes filtres **afin de** ne pas croire a un bug.

**Criteres d'acceptation (DoD) :**
- [ ] Si la liste est vide : message "Ajoutez des articles a votre liste pour voir les suggestions"
- [ ] Si aucune promo ne matche : message "Aucune promotion trouvee pour vos articles cette semaine"
- [ ] Si aucun magasin dans la zone : message "Aucun magasin trouve pres de [zone]. Verifiez votre code postal."
- [ ] Chaque message propose une action corrective (lien vers liste, lien vers profil)

**Priorite :** P1
**Complexite :** S
**Feature :** F4

---

## F5 — Itineraire optimise

### US-021 — Calcul d'itineraire multi-magasins
**En tant que** utilisateur, **je veux** generer un itineraire optimise entre les magasins selectionnes **afin de** minimiser mon temps de trajet.

**Criteres d'acceptation (DoD) :**
- [ ] L'itineraire part du domicile (zone geo de l'utilisateur) et y revient
- [ ] L'algorithme utilise l'heuristique du plus proche voisin (nearest neighbor TSP) pour ordonner les stops
- [ ] Le nombre de stops est limite a 2-6 magasins (au-dela, message d'avertissement)
- [ ] L'itineraire est calcule via l'API OpenRouteService (ou equivalent gratuit)
- [ ] Le temps de trajet total et la distance sont affiches

**Priorite :** P0
**Complexite :** L
**Feature :** F5

---

### US-022 — Affichage cartographique de l'itineraire
**En tant que** utilisateur, **je veux** visualiser mon itineraire sur une carte interactive **afin de** reperer les magasins et le parcours.

**Criteres d'acceptation (DoD) :**
- [ ] La carte utilise Leaflet avec des tuiles OpenStreetMap
- [ ] Le point de depart (domicile) est marque avec un marqueur distinct
- [ ] Chaque magasin est marque avec le logo/nom de l'enseigne
- [ ] Le trajet est trace en polyligne coloree sur la carte
- [ ] La carte est zoomable et pannable avec les interactions standards
- [ ] Le GeoJSON de l'itineraire est genere pour sauvegarde eventuelle

**Priorite :** P0
**Complexite :** M
**Feature :** F5

---

### US-023 — Resume de l'itineraire avec economies
**En tant que** utilisateur, **je veux** voir un resume textuel de mon itineraire (magasins, articles, economies) **afin de** valider mon plan de courses avant de partir.

**Criteres d'acceptation (DoD) :**
- [ ] Le resume liste : chaque magasin dans l'ordre de visite, les articles a acheter par magasin, l'economie par magasin, l'economie totale
- [ ] Le temps de trajet estime est affiche pour chaque troncon
- [ ] L'economie totale est la somme des reductions par rapport aux prix originaux
- [ ] Le resume est affichable en parallele de la carte (panneau lateral ou sous la carte)

**Priorite :** P0
**Complexite :** M
**Feature :** F5

---

### US-024 — Sauvegarder un itineraire
**En tant que** utilisateur, **je veux** sauvegarder un itineraire genere **afin de** le retrouver plus tard ou le consulter en magasin.

**Criteres d'acceptation (DoD) :**
- [ ] Un bouton "Sauvegarder" enregistre l'itineraire en BDD (entite SavedRoute)
- [ ] Les donnees sauvegardees incluent : date, liste des magasins, economie estimee, geojson du parcours
- [ ] L'utilisateur peut consulter ses itineraires sauvegardes dans un historique (liste triee par date)
- [ ] Un itineraire sauvegarde peut etre supprime
- [ ] Limite : max 50 itineraires sauvegardes par utilisateur

**Priorite :** P1
**Complexite :** M
**Feature :** F5

---

### US-025 — Gestion erreur de calcul d'itineraire
**En tant que** utilisateur, **je veux** un feedback clair si le calcul d'itineraire echoue **afin de** comprendre le probleme et agir en consequence.

**Criteres d'acceptation (DoD) :**
- [ ] Si l'API de routing est indisponible : message "Service de calcul d'itineraire temporairement indisponible. Reessayez dans quelques minutes."
- [ ] Si les coordonnees d'un magasin sont manquantes : le magasin est exclu de l'itineraire avec un avertissement
- [ ] Si un seul magasin est selectionne : l'itineraire est un simple aller-retour sans optimisation TSP
- [ ] Le bouton "Reessayer" est toujours propose en cas d'erreur

**Priorite :** P1
**Complexite :** S
**Feature :** F5

---

## Stories v2+ (resume)

Les fonctionnalites suivantes sont documentees dans la fondation mais **hors scope MVP**. Elles seront detaillees en user stories lors d'une iteration future.

| Feature | Description | Priorite estimee |
|---------|-------------|-----------------|
| **F6 — Historique des prix** | Tracking de l'evolution du prix d'un produit dans le temps. Necessite une table d'historisation et des graphiques (chart.js ou recharts). | v2 |
| **F7 — Alertes/notifications** | Push ou email quand une promo matche un produit de la liste. Necessite un service de notifications (web push API, Resend/Postmark pour email). | v2 |
| **F8 — Comparateur de prix temps reel** | Vue comparative inter-enseignes pour un meme produit. Necessite un matching produit plus precis (embeddings ou taxonomie). | v2 |
| **F9 — Dimension communautaire** | Partage de bons plans entre utilisateurs. Necessite moderation, signalement, systeme de reputation. | v3 |
| **F10 — PWA** | Progressive Web App installable sur mobile. Service worker, manifest, offline mode. | v2 |
| **F11 — Monetisation freemium** | 1 semaine gratuite, puis abonnement. Necessite Stripe integration, gestion plans, paywall. | v3 |
