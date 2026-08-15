# Journal — PromoScan

## Regles apprises

| # | Regle | Fichier(s) | Date |
|---|-------|-----------|------|
| 1 | fuse.js dans domain/ viole Clean Architecture -- extraire l'interface dans domain, l'impl dans infrastructure | `domain/services/MatchingService.ts` | 2026-06-05 |
| 2 | Logger pino doit etre configure avant deploiement prod -- console.log garde par NODE_ENV ne suffit pas | `server.ts` | 2026-06-05 |
| 3 | Les composants documentes dans ui.md doivent correspondre au code reel -- 9 composants fantomes detectes | `ui.md` vs `src/web/components/` | 2026-06-05 |
| 4 | Render free tier Frankfurt = meilleur choix gratuit EU pour backend Node.js depuis la Belgique | `render.yaml` | 2026-06-08 |
| 5 | Separer tsconfig backend (NodeNext) et frontend (ESNext/bundler) dans un monorepo | `tsconfig.node.json` / `tsconfig.json` | 2026-06-08 |
| 6 | Ne jamais inventer un seuil metier (ex. % de derive de format) absent du brainstorm -- le laisser explicitement ouvert dans le DoD et le signaler a l'agent suivant plutot que de fixer une valeur non validee | `docs/USER-STORIES.md` | 2026-08-08 |
| 7 | Quand un champ JSON agrege (ex. resultsByChain) doit etre ecrit par plusieurs processus independants (crons distincts), le normaliser en table enfant avec contrainte unique plutot que de risquer une race condition sur un blob JSON partage | `docs/ARCHITECTURE.md` (CollectionRunChain) | 2026-08-08 |
| 8 | Reappliquer la lecon Clean Architecture v1 (fuse.js dans domain/) des la conception : StoreAdapter (interface pure) va dans domain/, les implementations concretes (Playwright/Cheerio/fetch) vont dans infrastructure/ | `docs/ARCHITECTURE.md` (arborescence) | 2026-08-08 |
| 9 | Une relation Prisma un-a-plusieurs doit toujours declarer les deux cotes (champ scalaire + relation cote "plusieurs", tableau de back-relation cote "un") -- `prisma generate` echoue sinon avec une erreur de validation de schema, meme si un seul cote semble suffire a la lecture. Toujours executer `prisma generate` immediatement apres avoir ecrit/copie un schema, avant de continuer l'implementation | `prisma/schema.prisma` (StoreChain.storeLocations) | 2026-08-08 |
| 10 | Une valeur "par defaut" renvoyee par une API pour signifier "aucune donnee encore" (ex. `pending` dans `GET /api/collections/status` = "jamais collecte") ne doit jamais etre confondue avec un etat transitoire reel du meme enum (`pending` = "en file d'attente avant `running`") sans verifier comment le backend l'ecrit reellement -- suivre UI-DESIGN.md a la lettre ("disabled si status in {running, pending}") aurait bloque de facon permanente le bouton de declenchement de toute enseigne jamais encore executee. Toujours tracer l'origine exacte (quel code ecrit quelle valeur, quand) avant de coder une regle d'etat derivee d'un enum partage | `app/(dashboard)/dashboard/collecte/_components/hooks.ts` (`hasActiveChain`) | 2026-08-08 |
| 11 | Un endpoint de type "trigger" peut etre synchrone (bloquer jusqu'a la fin du traitement, ex. `POST /api/collections/trigger` qui `await`e la collecte complete avant de repondre) alors que le design UI a ete pense pour un flux asynchrone "fire-and-poll" -- toujours verifier le code reel du endpoint consomme (pas seulement son contrat documente) avant d'implementer le flux de mutation cote frontend, et adapter le feedback utilisateur (toast optimiste local plutot que tie a la reponse serveur) sans re-signaler un flux qui ne correspond pas a la realite | `app/(dashboard)/dashboard/collecte/_components/hooks.ts` (`useTriggerCollectionMutation`) | 2026-08-08 |
| 12 | `/speckit-analyze` (GitHub Spec Kit) est en lecture seule -- il ne persiste jamais son rapport sur disque, contrairement aux autres skills speckit-*. Toujours le sauvegarder manuellement (ex. `specs/<NNN>-<slug>/analysis-report.md`) immediatement apres execution, sinon le contenu est perdu des la fin de la session | `.claude/skills/speckit-analyze/SKILL.md` | 2026-08-15 |

## Historique

### SESSION 4 — 2026-08-15 (Test global : integration Spec Kit dans le workflow mentalyas)

### [SPEC KIT TEST] — 2026-08-15 22:52
**Phase :** Test d'integration (hors pipeline Hub & Spoke — validation de la nouvelle etape optionnelle entre `/brainstorm export` et `/pipeline init` documentee dans `~/.claude/CLAUDE.md`)
**Iteration :** 1
**Entree consommee :** `docs/FOUNDATION.md` integral, section 9.1/10.1 (F1 uniquement — seule feature detaillee L2+L3) ; `docs/ARCHITECTURE.md` et `docs/API-ENDPOINTS.md` (issus du pipeline Hub & Spoke SESSION 3, deja implemente en code reel)
**Output produit :** `specify-cli` installe globalement (`uv tool install specify-cli`) ; `specify init --here --integration claude --script ps` execute dans ce projet (`.specify/`, `.claude/skills/speckit-*` crees) ; sequence `/speckit-constitution` -> `/speckit-specify` -> `/speckit-plan` -> `/speckit-tasks` -> `/speckit-analyze` executee a la main pour F1 (skills natifs indisponibles cette session car installes apres le figeage du registre) : `.specify/memory/constitution.md`, `specs/001-promo-collection/{spec.md, checklists/requirements.md, plan.md, research.md, data-model.md, contracts/promo-collection-api.md, quickstart.md, tasks.md, analysis-report.md}`
**Decisions cles :**
- Feature F1 choisie car seule assez detaillee (L2+L3) dans FOUNDATION.md pour un test representatif ; F2/F3/F4 ignorees (niveau 1 seulement)
- 2 marqueurs [NEEDS CLARIFICATION] de `/speckit-specify` resolus par hypothese documentee plutot que bloquants (acces page de controle, visibilite des promos expirees) — a valider par mentalyas avant implementation
- Tests inclus dans `tasks.md` malgre le flag "optionnel" du skill, car `plan.md` a lui-meme detecte un vrai gap Principle V (Test Discipline : aucun test runner configure) — juge plus important de tenir cet engagement que la lettre du skill
**Selfdoubt applique :**
- Confiance haute sur la mecanique globale (chaine constitution -> spec -> plan -> tasks -> analyze coherente, FR-IDs traces bout en bout)
- Incertitude reelle et non resolue : `/speckit-analyze` a detecte une contradiction (voir Alerte ci-dessous) entre le spec genere et le comportement documente existant — decision humaine requise, non tranchee ici
**Impact :** Confirme que l'etape Spec Kit documentee dans `~/.claude/CLAUDE.md` (§ Pipeline de developpement) fonctionne reellement et produit des artefacts exploitables. A revele 3 corrections necessaires a la doc globale (notation des commandes en tiret, portee par feature et non par projet, `/speckit-analyze` sans persistance disque) — corrigees dans `~/.claude/CLAUDE.md`, `~/.claude/agents-workflow.md`, `~/.claude/skills/pipeline/SKILL.md`, `~/.claude/skills/pipeline/agents/it/{01-product-owner,02-architect}.md`, `~/.claude/skills/brainstorm/SKILL.md`.
**Alerte agent suivant :**
- **A trancher avec mentalyas avant tout code lie a F1** : `specs/001-promo-collection/spec.md` (FR-013) suppose que la page de controle `/dashboard/collecte` requiert un role owner/admin, alors que `docs/API-ENDPOINTS.md:71` dit explicitement qu'aucun role particulier n'est requis (session suffit). Un des deux documents (ou le code reel) doit etre corrige — voir `specs/001-promo-collection/analysis-report.md` finding I1 pour le detail complet.
- Findings mineurs egalement documentes dans `analysis-report.md` (C1, U1, A1) — corrections rapides de `tasks.md`/`plan.md`, non bloquantes.

---

### SESSION 3 — 2026-08-08 (Pipeline v2 — F1 uniquement)

### [PRODUCT OWNER] — 2026-08-08 14:00
**Phase :** Phase 1 — Fondation (nouveau pipeline Hub & Spoke post-pivot)
**Iteration :** 1
**Entree consommee :** `docs/FOUNDATION.md` integral (12 sections, perimetre F1 detaille niveaux 1+2+3 ; F2/F3/F4 niveau 1 seulement) + `docs/brainstorm/L2-f1-collecte-promotions.md` (5 UC, 5 regles metier, tables robots.txt/faisabilite, DoD) + `docs/brainstorm/L3-f1-collecte-promotions.md` (contrat API, schema donnees, sequence Mermaid, cas limites, securite)
**Output produit :** `docs/USER-STORIES.md` — 12 user stories completes pour F1 (US-F1-01 a US-F1-12 : cron hebdomadaire, adaptateur Colruyt/API, adaptateur Aldi/HTML, adaptateur Delhaize+Lidl/headless, fallback Claude Vision, tolerance panne partielle, detection derive de format, respect robots.txt/crawl-delay, liste promotions filtrable, historique runs, declenchement manuel, idempotence upsert), chacune avec DoD mesurable tracable a un UC/regle metier du L2/L3 ; 3 stories stub (F2/F3/F4) marquees explicitement non detaillees ; section Selfdoubt (8 affirmations, 2 incertitudes reelles signalees)
**Decisions cles :**
- Toutes les stories F1 core (collecte 4 enseignes + tolerance panne + derive format + robots.txt + idempotence + interface de controle) classees P0, conformement au DoD non coche de FOUNDATION §9.1 qui les liste explicitement comme criteres d'acceptation restants
- US-F1-05 (fallback Claude Vision) classee P1 car aucune des 4 enseignes actuelles ne le necessite en usage nominal (toutes ont une source HTML/API confirmee faisable) — mais conservee car le DoD FOUNDATION l'exige explicitement
- Pas de story dediee au matching Product<->Promotion (productId) : explicitement renvoye a F4 par FOUNDATION section 6, hors perimetre F1
- Seuil numerique de "derive de format" (US-F1-07) volontairement laisse ouvert dans le DoD plutot qu'invente — renvoye a l'Architecte
- Decision d'architecture cron (orchestrateur unique vs cron par enseigne) non tranchee dans les stories, conformement au L3-f1 qui la laisse explicitement ouverte ("a trancher a l'implementation selon les temps mesures")
- F2/F3/F4 reduites a un stub d'une ligne chacune, sans inventer de use cases, conformement au perimetre de la tache et a FOUNDATION §2
**Selfdoubt applique :**
- Confiance haute sur la traduction fidele des UC-1 a UC-5 et regles 1-5 du L2-f1 en stories (verifie ligne a ligne, aucun ajout de scope)
- Confiance haute sur la priorisation P0 des stories core (decoule directement du DoD explicite FOUNDATION §9.1)
- Incertitude moyenne sur le seuil exact de derive de format (US-F1-07) — le L2/L3 ne fixe aucun pourcentage, seulement "0 resultat inattendu" ; signale explicitement a l'Architecte plutot que de fixer une valeur arbitraire (ex. -50%)
- Incertitude moyenne sur la faisabilite du test du fallback Claude Vision (US-F1-05) faute de cas PDF/image reel disponible parmi les 4 enseignes actuelles — signale que ce test pourrait devoir se faire sur un document synthetique
**Impact :** Le perimetre exact de l'implementation F1 est fixe : 12 stories P0/P1 couvrant la collecte planifiee multi-strategie (API/HTML/headless), la resilience (panne partielle, derive de format, idempotence), la conformite (robots.txt/crawl-delay) et l'interface de controle complete (liste, historique, declenchement manuel). Rien hors de ce perimetre ne doit etre implemente pour ce spike. F2/F3/F4 restent explicitement hors scope de ce pipeline.
**Alerte agent suivant :**
- **Architect (#2)** : trancher le seuil numerique de derive de format (US-F1-07, idealement configurable par enseigne plutot qu'un seuil global fixe) et la strategie cron finale (orchestrateur unique vs 4 crons distincts, cf. L3-f1 section 4 "cas limites techniques"). Le schema Prisma doit reprendre exactement les 4 tables de FOUNDATION §3 (StoreChain, Product, Promotion, CollectionRun) sans ajouter les entites F2/F3/F4 qui restent provisoires.
- **UI/UX (#3)** : concevoir `/dashboard/collecte` a partir de US-F1-09 (liste promotions filtrable enseigne/categorie), US-F1-10 (historique runs avec distinction visuelle derive-de-format vs echec technique), US-F1-11 (bouton declenchement manuel desactive pendant un run en cours, message clair sur 409).

---

## [ARCHITECT] — 2026-08-08 15:00
**Phase :** Phase 2 — Fondation (Architecture technique, pipeline Hub & Spoke post-pivot)
**Iteration :** 1
**Entree consommee :** `docs/FOUNDATION.md` integral (perimetre F1, §3/§5/§6/§7/§9.1/§10.1 en priorite) + `docs/brainstorm/L3-f1-collecte-promotions.md` (contrat API, schema provisoire, sequence, cas limites, securite) + `docs/USER-STORIES.md` (12 stories F1 + section Selfdoubt PO) + entree JOURNAL PRODUCT OWNER SESSION 3
**Output produit :** `docs/ARCHITECTURE.md` (schema Prisma definitif 6 tables F1 + squelettes F2-F4, ERD Mermaid, arborescence Next.js App Router avec Clean Architecture domain/application/infrastructure, 2 decisions tranchees avec selfdoubt dedie, sequence Mermaid mise a jour, complements securite) + `docs/API-ENDPOINTS.md` (4 endpoints definitifs avec methode/entree/sortie/codes erreur/mecanisme auth exact)
**Decisions cles :**
- **Seuil de derive de format (US-F1-07)** : seuil relatif configurable par enseigne, colonne `StoreChain.formatDriftThreshold` (defaut 0.5 = -50% vs dernier run reussi). Cas "0 resultat" toujours absolu et non desactivable par la config. Aucune baseline (1er run d'une enseigne) = pas de detection possible, resultat accepte comme nouvelle baseline.
- **Strategie cron (L3 §4)** : 4 crons Vercel distincts (un par enseigne) plutot qu'un orchestrateur sequentiel unique, pour eviter le depassement de `maxDuration` sur les enseignes headless (Delhaize/Lidl). Consequence architecturale majeure : `/api/cron/collect-promotions` devient une route dynamique `[chain]`, et le champ JSON `resultsByChain` (FOUNDATION/L3) est remplace par une table normalisee `CollectionRunChain` (contrainte unique `(collectionRunId, storeChainId)`) pour eliminer tout risque de race condition entre les 4 processus independants ecrivant concurremment. Un champ `weekKey` (unique, nullable) sur `CollectionRun` permet de joindre les 4 crons hebdomadaires sous un meme run tout en gardant les declenchements manuels totalement independants (`weekKey: null`, `trigger: "manual"`).
- `/api/collections/trigger` etendu avec un `chainSlug` optionnel (declenchement cible d'une seule enseigne) — raffinement justifie directement par l'intention de US-F1-11 ("tester une enseigne pendant le debug"), pas une extension de perimetre arbitraire.
- Arborescence Next.js organisee en `lib/domain` (StoreAdapter interface pure + Zod + politique de derive, zero import framework) / `lib/application` (use cases) / `lib/infrastructure` (adapters concrets, Prisma, Supabase) — reapplication deliberee de la lecon Clean Architecture v1 (regle JOURNAL #1 : fuse.js importe a tort dans domain/).
- F2/F3/F4 laissees en squelettes Prisma minimaux (User/DietProfile/Budget/Circuit/StoreLocation) sans aucune regle metier, conformement au perimetre strict de la tache.
**Selfdoubt applique :**
- Confiance haute sur la necessite d'un seuil relatif plutot qu'absolu (volumes tres heterogenes entre enseignes, un seul chiffre absolu serait soit trop permissif soit trop strict).
- Confiance moyenne (Probable) sur la valeur par defaut de -50% : raisonnable et conservatrice mais non calibree sur donnees reelles (aucun run n'a encore eu lieu) — signale explicitement au QA (#7) pour reevaluation post-premiers-runs.
- Incertitude reelle (Hypothese) sur la compatibilite du tier Vercel actuel (suppose Hobby/gratuit par FOUNDATION §5) avec 4 cron jobs distincts et leurs `maxDuration` respectifs — les limites exactes de Vercel evoluent regulierement et ne sont pas verifiables depuis ce document. Un plan de repli explicite (regroupement en 2 crons, ou passage Pro) est documente en ARCHITECTURE.md §5.4 plutot que de presenter la faisabilite comme certaine.
- Confiance haute sur la normalisation resultsByChain -> CollectionRunChain : consequence logique directe et necessaire du passage a des processus independants, pas une sur-ingenierie (le risque de race condition sur un JSON partage par 4 fonctions concurrentes est reel et documente).
**Impact :** L'architecture technique complete de F1 est figee : schema Prisma pret a implementer, 4 endpoints avec auth exacte specifies, strategie cron qui resout le risque de timeout identifie par le brainstorm sans casser le modele "un run = une vue agregee" attendu par les stories UI. Le Backend (#4) peut demarrer l'implementation directement sur la base de ces deux documents. Un risque de dimensionnement (tier Vercel) est explicitement transmis a DevOps plutot que suppose resolu.
**Alerte agent suivant :**
- **UI/UX (#3)** : le statut `format_drift` (CollectionRunChain) doit etre visuellement distinct de `failed` et `complete` sur `/dashboard/collecte` (US-F1-10). Le bouton de declenchement manuel (US-F1-11) doit permettre de cibler une enseigne unique via `chainSlug`, pas seulement "toutes les enseignes" — prevoir un selecteur ou une action par ligne d'enseigne en plus du bouton global.
- **Backend (#4)** : implementer `formatDriftPolicy.ts` comme fonction pure testable isolement (recoit la baseline en parametre, ne touche pas la DB directement). Respecter strictement domain/ sans import Playwright/Prisma. Mesurer en conditions reelles la duree d'execution des adaptateurs Delhaize/Lidl des les premiers tests pour valider que le decoupage "1 enseigne = 1 invocation" suffit avant d'envisager un decoupage par categorie (non implemente par defaut, YAGNI tant que non mesure necessaire).
- **DevOps (#8)** : confirmer explicitement le tier Vercel du compte (Hobby vs Pro) et le nombre de cron jobs / `maxDuration` disponibles avant de figer `vercel.json` — voir plan de repli ARCHITECTURE.md §5.4 si le compte reste Hobby.
- **QA (#7)** : le seuil `formatDriftThreshold = 0.5` est une valeur de depart non calibree — a reevaluer avec les donnees des premiers runs de production reels.

---

## [UI/UX DESIGNER] — 2026-08-08 16:00
**Phase :** Phase 1 — Fondation (pipeline Hub & Spoke post-pivot)
**Iteration :** 1
**Entree consommee :** `docs/FOUNDATION.md` (§2, §5, §9.1) + `docs/USER-STORIES.md` (US-F1-09/10/11 en detail) + `docs/ARCHITECTURE.md` (§5.2 declenchement manuel avec ciblage par enseigne, §7 distinction format_drift/failed, §8 alertes UI/UX explicites) + `docs/API-ENDPOINTS.md` (4 endpoints, formats de reponse exacts) + entree JOURNAL Architect SESSION 3
**Output produit :** `docs/UI-DESIGN.md` (architecture 3 zones verticales A-D, wireframes textuels 1440/768/375, composants Atomic Design complets atoms/molecules/organisms, 4 flux UX detailles avec feedback optimiste <200ms, tableau regles de validation/etat, accessibilite WCAG AA, section Selfdoubt 7 points) + `docs/PALETTE.md` (fichier separe — palette semantique 5 statuts avec tokens light/dark, ratios de contraste documentes, CSS custom properties + mapping Tailwind, checklist d'usage)
**Decisions cles :**
- Layout en 3 zones empilees verticalement (Controle -> Historique -> Promotions) plutot qu'un split colonnes/carte-liste (pas de contenu visuel dominant qui justifierait un ratio phi ici) — ordre workflow-first (agir -> consulter historique -> auditer detail)
- Panneau de controle (declenchement) separe visuellement de l'historique des runs — deux intentions differentes (agir maintenant vs consulter le passe), evite qu'une ligne d'historique paraisse actionnable
- `format_drift` recoit sa propre famille visuelle (icone triangle, teinte ambre) strictement distincte de `failed` (icone croix, teinte rouge) — reponse directe a l'exigence explicite Architecte §7/§8
- Style badge "soft" (fond teinte clair/sombre + texte contraste eleve) plutot qu'aplat sature, pour reduire la fatigue visuelle sur tableaux denses (1000+ lignes Delhaize)
- Feedback de declenchement <200ms via mutation optimiste locale (TanStack Query onMutate) avant reponse serveur, conforme a la regle ergonomie globale et au DoD explicite US-F1-11
- Bouton global disabled si >=1 enseigne running/pending ; bouton par enseigne disabled independamment des 3 autres — reflete exactement la semantique 409 documentee par l'Architecte (scope global vs scope enseigne)
- Filtre categorie en champ texte libre (pas de Select a options fixes) car aucun endpoint ne fournit la liste des categories distinctes — evite une liste figee qui deviendrait fausse
- Exception documentee a la regle globale "1 CTA par ecran" : 5 boutons visibles (1 global + 4 par enseigne) assumee car dashboard technique avec exigence explicite de controle granulaire par enseigne (Architecte §8), hierarchie maintenue par le style (primary vs secondary)
- `docs/PALETTE.md` en fichier separe (pas une section) car les tokens succes/avertissement/erreur/en cours/neutre sont generiques et reutilisables tels quels par F2/F3/F4
**Selfdoubt applique :**
- Confiance haute sur l'empilement vertical et la separation controle/historique (aucun contenu visuel ne justifie un split, deux intentions cognitives distinctes)
- Confiance haute sur le format_drift visuellement distinct de failed (exigence explicite tracee a deux documents sources)
- Incertitude moyenne (Probable) sur le filtre categorie en texte libre plutot qu'un Select — signale a Backend/Frontend (#4/#5) : si besoin d'autocomplete apparait, deriver cote client plutot que creer un nouvel endpoint (YAGNI)
- Incertitude moyenne (Probable) sur l'intervalle de polling propose (5s) pour le rafraichissement live des statuts running — non calibre sur les durees reelles d'execution des adaptateurs headless (Delhaize/Lidl), qui restent a mesurer par Backend (#4) selon l'alerte deja presente dans ARCHITECTURE §8
- Incertitude moyenne (Probable) sur les ratios de contraste exacts de PALETTE.md — bases sur des paires Tailwind documentees comme conformes AA mais non verifiees avec un outil de contraste dedie sur le rendu final ; signale explicitement a QA (#7)
- Deviation assumee et documentee (pas une incertitude) sur la regle globale "1 CTA par ecran" — justifiee par la nature dashboard technique de l'ecran et l'exigence explicite de l'Architecte
**Impact :** L'ecran `/dashboard/collecte` est entierement specifie visuellement et fonctionnellement : wireframes pour 3 breakpoints, inventaire complet de composants Atomic Design, flux de declenchement manuel avec etats optimistes/erreur/succes, et palette de statuts accessible reutilisable au-dela de F1. Le Frontend (#4/#5) peut implementer directement sur la base de ces deux documents sans decision de design supplementaire a prendre.
**Alerte agent suivant :**
- **Backend (#4)** : envisager un endpoint leger `GET /api/collections/status` (etat courant des 4 enseignes) si la derivation cote frontend depuis `GET /api/collection-runs` s'avere complexe — signale, pas decide unilateralement, car hors du contrat d'API deja fige. Mesurer les durees reelles des adaptateurs headless pour calibrer l'intervalle de polling frontend (actuellement propose a 5s, potentiellement trop agressif).
- **Frontend (#5)** : implementer selon la table Atomic Design de UI-DESIGN.md §3 (atoms/molecules/organisms nommes explicitement) ; utiliser TanStack Query `onMutate` pour le feedback optimiste <200ms et `refetchInterval` conditionnel (actif seulement si un statut non-terminal existe a l'ecran). Tokens couleur/CSS dans PALETTE.md §5-6 a integrer dans `styles/tokens.css` et `tailwind.config.ts`.
- **QA (#7)** : verifier en conditions reelles les ratios de contraste de PALETTE.md (outil dedie, pas seulement documentation) et la perceptibilite du badge `format_drift` vs `failed` (y compris simulation daltonisme). Verifier que le polling ne sature pas l'API lors d'un run headless long.

---

## [BACKEND] — 2026-08-08 17:00
**Phase :** Phase 2 — Implementation (pipeline Hub & Spoke post-pivot)
**Iteration :** 1
**Entree consommee :** `docs/FOUNDATION.md` integral + `docs/ARCHITECTURE.md` integral (schema Prisma §2.2, arborescence §3, decisions cron/derive §4-5, patterns §6, securite §7, points ouverts §8) + `docs/API-ENDPOINTS.md` (4 endpoints, contrats exacts) + `docs/USER-STORIES.md` (12 DoD F1) + `docs/UI-DESIGN.md` §"Prochaines etapes" (point ouvert derivation d'etat) + entrees JOURNAL PO/Architect/UI-UX SESSION 3. `_archive-v1/` consulte uniquement pour reference de style, aucune reutilisation de stack (v1 = Express/Vite, non pertinent pour Next.js App Router).
**Output produit :**
- Scaffolding Next.js 14 App Router complet : `package.json`, `tsconfig.json` (strict), `next.config.js`, `.env.example` (12 variables documentees), `.gitignore` adapte Next.js, `vercel.json` (4 crons decales 03:00/03:05/03:10/03:20 UTC lundi + `maxDuration` 300s), `tailwind.config.ts`/`postcss.config.js` (squelette minimal)
- `prisma/schema.prisma` repris de ARCHITECTURE §2.2 (6 tables F1 + squelettes F2-F4) avec **une correction** : ajout de `StoreChain.storeLocations StoreLocation[]` (relation retour manquante, absente de la specification Architecte — `prisma generate` echoue sans elle, bug de schema reel detecte a la generation, pas une deviation de choix) + ajout de `datasource.directUrl` (pratique standard Supabase/PgBouncer, necessaire pour `prisma migrate`, ajout mineur non present dans la spec mais sans impact sur les modeles)
- Clean Architecture complete : `lib/domain/` (StoreAdapter.ts interface pure, formatDriftPolicy.ts fonction pure testable isolement, promotionSchema.ts schemas Zod, weekKey.ts calcul ISO semaine pur) — **zero import framework verifie** ; `lib/application/` (collectChainUseCase.ts orchestration fetch->validate->drift->upsert avec repository injecte par interface, runAggregationUseCase.ts agregation statut) — zero import Prisma/Next direct, seulement des interfaces ; `lib/infrastructure/` (prisma.ts singleton, supabase/server.ts + middleware.ts, repositories/ pour StoreChain/CollectionRun/ChainRun, adapters/ pour les 4 enseignes + claudeVisionFallback.ts pour US-F1-05)
- 4 adaptateurs StoreAdapter : ColruytAdapter (api, extraction dynamique X-CG-APIKEY), AldiAdapter (html, Cheerio), DelhaizeAdapter (headless, interception reseau des reponses API internes via Playwright), LidlAdapter (headless, lecture DOM post-rendu) — tous avec crawl-delay/User-Agent identifiable (US-F1-08) et tolerance de panne isolee
- `lib/infrastructure/claudeVisionFallback.ts` (US-F1-05, P1) : appel Claude Vision (`claude-opus-5`, structured outputs via `output_config.format` + JSON schema, retry/backoff delegue au `maxRetries` du SDK officiel plutot que reimplemente)
- 5 endpoints : les 4 requis par API-ENDPOINTS.md (`/api/cron/collect-promotions/[chain]`, `/api/promotions`, `/api/collection-runs`, `/api/collections/trigger`) + **`/api/collections/status` (decision Backend, voir ci-dessous)**
- Scaffolding App Router minimal pour compiler : `app/layout.tsx`, `app/page.tsx`, `app/(auth)/login/page.tsx`, `app/(dashboard)/layout.tsx` (verification session serveur), `app/(dashboard)/dashboard/collecte/page.tsx` (placeholder — design complet hors perimetre backend, reserve a Frontend #5), `middleware.ts` racine (rafraichissement session + garde heuristique sur cookie de presence)
- Migration DB : `prisma/migrations/20260808000000_init/migration.sql` genere via `prisma migrate diff --from-empty --to-schema-datamodel` (aucune connexion DB reelle disponible dans cet environnement — SQL genere sans DB live, a appliquer via `prisma migrate deploy` au premier deploiement reel) + `migration_lock.toml`
**Decisions cles :**
- **Point ouvert UI/UX tranche : `GET /api/collections/status` cree comme endpoint dedie**, plutot qu'une derivation cote frontend depuis `/api/collection-runs`. Justification : `/api/collection-runs` est pagine par date de run, pas par enseigne — une enseigne peut etre absente du run le plus recent (declenchement manuel cible sur une seule enseigne) sans que son dernier etat connu soit visible en premiere page ; reconstituer "dernier etat par enseigne" cote client obligerait a paginer jusqu'a couvrir les 4 enseignes. Cote serveur, la meme info s'obtient en une requete par enseigne (4 fixes, YAGNI) triee par `CollectionRun.startedAt` decroissant. Ne modifie aucun contrat deja fige par l'Architecte (endpoint additionnel, pas une extension des 4 existants).
- Correction du bug de schema Prisma (`StoreLocation` sans relation retour sur `StoreChain`) documentee explicitement plutot que silencieusement corrigee — aucune regle metier ajoutee, uniquement le champ obligatoire cote Prisma.
- `formatDriftPolicy.evaluateFormatDrift` distingue 3 classifications (`accepted`/`format_drift`/`first_run_zero_failure`) plutot que 2, pour capturer fidelement la regle ARCHITECTURE §4 : un premier run a 0 resultat est un echec technique classique, jamais une "derive" (rien a comparer) — nuance absente d'une implementation booleenne simple.
- `runAggregationUseCase.computeAggregatedRunStatus` : decision non explicitement tranchee par l'Architecte sur le traitement de `format_drift` dans l'agregat. Retenu : `complete` seulement si TOUTES les enseignes sont `complete`, `failed` seulement si TOUTES sont `failed`, `partial` sinon (couvre tout melange incluant `format_drift`) — documente comme decision a valider par QA (#7) si le comportement observe surprend.
- Retry/backoff du fallback Claude Vision (US-F1-05) delegue a `maxRetries` du SDK Anthropic officiel plutot que reimplemente a la main (regle "ne pas reimplementer ce que le SDK fait deja").
- Modele Claude retenu pour le fallback Vision : `claude-opus-5` (regle du skill claude-api : ne jamais retrograder pour le cout sans decision explicite de l'utilisateur) — **signale a mentalyas** : un modele Sonnet serait probablement suffisant et moins couteux pour cette tache d'extraction mecanique rarement declenchee (P1, aucune des 4 enseignes actuelles ne l'utilise en usage nominal) ; changement d'une ligne (`FALLBACK_MODEL`) si le cout devient un sujet.
**Selfdoubt applique :**
- Confiance haute sur la Clean Architecture (verifiee : `lib/domain/` ne contient aucun import Next.js/Prisma/Playwright/Cheerio/Anthropic — grep manuel effectue sur les 4 fichiers domain/) et sur la compilation (`npx tsc --noEmit` : 0 erreur ; `npx next build` : succes complet, 5 routes API + 3 pages generees).
- Incertitude reelle (Hypothese) sur les 4 adaptateurs enseignes : **jamais executes contre les sites reels** (aucun acces reseau sortant depuis ce poste de developpement). Colruyt (chemin API exact, motif de regex d'extraction de cle), Aldi (selecteurs CSS), Delhaize (motif d'URL API interceptee), Lidl (selecteurs CSS DOM) sont des estimations raisonnables documentees avec tableaux selfdoubt dedies dans chaque fichier adaptateur — **US-F1-02/03/04 DoD ("teste de bout en bout avec donnees reelles") non cochable depuis ce poste**, a valider au premier deploiement.
- Incertitude reelle (Hypothese) sur le fallback Claude Vision : jamais teste contre un vrai document PDF/image (meme contrainte reseau). US-F1-05 DoD non cochable depuis ce poste.
- Incertitude moyenne (Probable) sur `maxDuration: 300` dans `vercel.json` et le nombre de crons supportes : point deja signale par l'Architecte a DevOps (#8, ARCHITECTURE §1/§5.4, tier Vercel non confirme) — non re-verifiable depuis ce poste, valeur documentee comme cible et non garantie.
- Incertitude moyenne sur `STALE_RUN_TIMEOUT_MS = 15 min` (garde de concurrence anti-chevauchement) : estimation de depart non calibree sur des temps d'execution reels mesures (alerte deja portee par l'Architecte a Backend, non mesurable sans acces reseau reel).
- Confiance haute sur la migration DB : SQL genere directement depuis le schema via `prisma migrate diff --from-empty --to-schema-datamodel` (pas de connexion DB requise pour cette commande), donc fidele au schema Prisma final — mais **jamais applique contre une vraie base Postgres/Supabase** dans cet environnement ; `prisma migrate deploy` reste a executer au premier deploiement reel.
**Impact :** Le backend complet de F1 est implemente et compile sans erreur (`tsc --noEmit` et `next build` verifies dans cet environnement). Les 5 endpoints (4 requis + 1 decide) sont fonctionnels contre un schema Prisma valide. La migration initiale est prete a etre appliquee. Les 4 adaptateurs enseignes et le fallback Claude Vision sont implementes selon le contrat connu mais **non verifies en conditions reelles** (contrainte d'environnement, pas de choix) — c'est le principal risque residuel avant un premier run de production.
**Alerte agent suivant :**
- **DevOps (#8)** : appliquer `prisma migrate deploy` (migration `20260808000000_init` prete dans `prisma/migrations/`) contre la base Supabase reelle au premier deploiement — jamais execute contre une DB reelle depuis ce poste. Confirmer le tier Vercel (nombre de crons, `maxDuration` reel disponible) avant de figer `vercel.json` (deja signale par l'Architecte). Configurer les 12 variables d'environnement de `.env.example` sur Vercel (dont `ANTHROPIC_API_KEY` si le fallback Vision doit etre actif).
- **Frontend (#5)** : `GET /api/collections/status` est disponible en complement des 4 endpoints figes par l'Architecte — retourne `{ chains: [{ chainSlug, status, itemsCollected, updatedAt, runId }] }` pour alimenter directement `TriggerControlPanel` sans derivation cote client. Les pages `app/(dashboard)/dashboard/collecte/page.tsx` et `app/(auth)/login/page.tsx` sont des placeholders minimaux — design complet a implementer selon `docs/UI-DESIGN.md`.
- **Test Engineer (#6)** : `formatDriftPolicy.evaluateFormatDrift` et `runAggregationUseCase.computeAggregatedRunStatus` sont des fonctions pures sans dependance DB — prioritaires pour les tests unitaires (cas limites : baseline null, 0 resultat premier run vs run suivant, melange de statuts terminaux). Les 4 adaptateurs necessitent une validation contre les sites reels (selecteurs/endpoints non verifiables depuis ce poste) avant tout test automatise fiable.
- **QA (#7)** : valider en conditions reelles les 4 adaptateurs (Colruyt en priorite — strategie API la plus simple a deboguer) et le fallback Claude Vision. Revoir la decision d'agregation `format_drift` dans `computeAggregatedRunStatus` si le comportement `partial` pour tout melange surprend a l'usage. Le modele `claude-opus-5` du fallback Vision peut etre retrograde vers `claude-sonnet-5` si le cout devient un sujet (chemin rarement emprunte, P1).

---

## [FRONTEND] — 2026-08-08 18:00
**Phase :** Phase 2 — Implementation (pipeline Hub & Spoke post-pivot)
**Iteration :** 1
**Entree consommee :** `docs/UI-DESIGN.md` integral (architecture 3 zones A-D, wireframes 1440/768/375, composants Atomic Design §3, 4 flux UX §4, regles de validation/etat §5, a11y §6, selfdoubt §8) + `docs/PALETTE.md` integral (tokens CSS statuts light/dark, mapping Tailwind) + `docs/API-ENDPOINTS.md` (4 endpoints + notes transverses) + code Backend reel : `app/api/promotions/route.ts`, `app/api/collection-runs/route.ts`, `app/api/collections/trigger/route.ts`, `app/api/collections/status/route.ts` (endpoint non prevu par l'Architecte, ajoute par Backend), `lib/domain/promotionSchema.ts`, `lib/domain/StoreAdapter.ts`, `prisma/schema.prisma` (enums ChainRunStatus/CollectionRunStatus) + entrees JOURNAL PO/Architect/UI-UX/Backend SESSION 3
**Output produit :**
- Design tokens : `styles/tokens.css` (statuts repris tels quels de PALETTE.md §5 + extension "base" neutre/accent non specifiee par les docs design, justifiee ci-dessous) importe dans `app/layout.tsx` ; `tailwind.config.ts` complete avec le mapping `colors.status.*` (PALETTE §6) + `colors.base.*`
- 11 atoms (`components/atoms/`) : StatusIcon, StatusBadge, Button, Select, TextInput, Spinner, RelativeTime, Toast, PaginationControls, EmptyState, SkeletonRow + `index.ts`
- 9 molecules (`components/molecules/`) : ChainStatusChip, RunSummaryHeader, ChainTriggerRow, RunRow, FilterBar, PromotionRow, PromotionCard, ConfirmToast, ToastViewport (ajoutee, non listee par UI-DESIGN mais necessaire pour composer les ConfirmToast) + `index.ts`
- Organismes specifiques a la page (`app/(dashboard)/dashboard/collecte/_components/`) : PageHeader, TriggerControlPanel, RunHistoryTable, PromotionsTable, CollecteScreen (composition racine cote client) + `hooks.ts` (4 hooks TanStack Query : status/runs/promotions/trigger) + `constants.ts` (mapping slug->nom des 4 enseignes, code en dur conformement a API-ENDPOINTS "Notes transverses" YAGNI)
- `app/(dashboard)/dashboard/collecte/page.tsx` remplace (Server Component minimal rendant `CollecteScreen`)
- `app/(auth)/login/page.tsx` + `app/(auth)/login/actions.ts` : formulaire de connexion fonctionnel Supabase Auth via Server Action (email/password), volontairement minimal (pas l'ecran cible de cette tache)
- Types partages : `lib/types/status.ts` (ChainStatus/RunStatus + mapping token/libellé), `lib/types/api.ts` (formes JSON exactes des 4 endpoints) ; `lib/apiClient.ts` (fetch wrapper deballant `{success,data,error}`) ; `lib/hooks/useToastQueue.ts` ; `lib/utils/cn.ts` + `format.ts` (prix/dates/temps relatif FR, sans dependance externe)
- `components/providers/QueryProvider.tsx` monte dans `app/layout.tsx`
- Dependances ajoutees : `@tanstack/react-query@^5.101.4` (mutation optimiste + polling conditionnel, exige par UI-DESIGN §4) et `lucide-react@^0.427.0` (les noms d'icones de PALETTE.md §2 — `check-circle`, `alert-triangle`, `x-circle`, `loader`, `circle-dashed` — correspondent exactement aux icones Lucide, choix direct plutot que reinventer des SVG)
**Decisions cles :**
- **Incoherence detectee et corrigee (§ "Regles apprises" #10) : semantique de `pending`.** UI-DESIGN §5 dit "bouton disabled si status in {running, pending}". Or `GET /api/collections/status` (code reel Backend) renvoie `pending` comme valeur par defaut quand AUCUN `CollectionRunChain` n'existe encore pour une enseigne (jamais collectee) -- le backend n'ecrit d'ailleurs jamais explicitement `pending` avant `running` (`app/api/collections/trigger/route.ts` appelle `upsertRunChainStatus` directement avec `status: 'running'`). Suivre UI-DESIGN litteralement aurait desactive DE FACON PERMANENTE le bouton de declenchement des 4 enseignes au tout premier lancement du projet (toutes `pending` par defaut). Corrige : seul `running` est traite comme etat actif/bloquant cote frontend (bouton + condition de polling) ; `pending` est affiche avec le libelle "Jamais execute" mais reste declenchable. Documente en commentaire directement dans `hooks.ts` plutot que corrige silencieusement.
- **Incoherence detectee et documentee (§ "Regles apprises" #11) : `POST /api/collections/trigger` est synchrone.** Le code reel (`app/api/collections/trigger/route.ts`) `await`e `collectChainUseCase` (ou les 4 en `Promise.allSettled`) et ne repond 200 qu'une fois la collecte COMPLETE (jusqu'a 300s, `maxDuration`), alors que UI-DESIGN §4.1 decrit un flux "la reponse 200 confirme le lancement, puis on poll jusqu'a l'etat terminal". Adaptation : le toast "Collecte X lancee" est declenche localement dans `onMutate` (avant tout appel reseau, feedback <200ms toujours respecte) plutot que sur une reponse serveur qui n'arrivera que bien plus tard ; le toast de resultat final est construit directement depuis la reponse de la mutation (qui contient deja le statut terminal exact) plutot que detecte via le polling. Le polling `refetchInterval` sur `/api/collections/status` garde neanmoins sa valeur : chaque enseigne ecrit son etat en base des qu'elle termine (boucle `Promise.allSettled` cote serveur), donc il reflete une progression reelle avant meme que la requete POST d'origine ne se termine.
- **Extension des tokens PALETTE.md** : `styles/tokens.css`/`tailwind.config.ts` ajoutent des tokens `base-*` (fond, surface, texte, bordure, accent) non specifies par PALETTE.md (qui ne couvre que les 5 statuts) ni par UI-DESIGN.md -- necessaire pour habiller le reste de l'interface (boutons primaires, fonds de carte, texte). Choix : gris neutre + un seul accent bleu, coherent avec le non-objectif explicite UI-DESIGN §0 ("pas de wow visuel, dashboard technique"). Contrastes verifies a l'oeil, pas avec un outil dedie (meme reserve deja signalee par PALETTE.md §4).
- **Boutons desactives via `aria-disabled` + `aria-describedby`, jamais `disabled` HTML brut** (UI-DESIGN §6) : implemente dans `Button.tsx`, le bouton reste focusable au clavier et le `title` reste accessible a la souris meme desactive.
- **Simplification assumee** : `RunRow` (molecule) utilise un layout flexbox unique qui s'adapte du desktop au mobile par `flex-wrap`, plutot que deux arborescences de markup distinctes (table stricte desktop vs carte mobile) comme le suggerent les wireframes UI-DESIGN §2.1/§2.3. Gain de maintenabilite juge superieur au gain visuel marginal sur ce dashboard technique ; `PromotionsTable`, elle, implemente bien un vrai `<table>` desktop + cartes mobiles distinctes (plus justifie vu le nombre de colonnes et le volume de lignes ~1000).
- **Page de login en Server Action (pas de client Supabase navigateur)** : evite d'ajouter des variables `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` a `.env.example` pour un simple prerequis technique hors perimetre de l'ecran cible -- `createSupabaseServerClient()` deja fourni par le Backend suffit dans une Server Action `'use server'`. Formulaire fonctionnel en progressive enhancement pure (POST natif), zero JS requis pour l'authentification.
- **`ToastViewport`** ajoute comme molecule non listee explicitement par UI-DESIGN §3.2 (qui ne liste que `ConfirmToast`) : necessaire pour composer et positionner la file de toasts a l'ecran (un composant doit bien afficher la liste quelque part) -- ajout mineur consequence directe de `ConfirmToast`, pas une extension de perimetre.
- **`useId()` a force `Button`/`TextInput`/`Select` a etre des Client Components** (`'use client'`) : ces hooks ne sont pas utilisables dans un Server Component (la page de login est un Server Component qui les importe directement) -- decision technique necessaire, pas un choix de design.
**Selfdoubt applique :**
- Confiance haute sur la compilation : `npx tsc --noEmit` (0 erreur, `strict: true` + `noUncheckedIndexedAccess: true` respectes, aucun `any` introduit — verifie par grep) et `npx next build` (succes complet, 10 pages generees, `/dashboard/collecte` et `/login` compilent) verifies dans cet environnement.
- Confiance haute sur les deux incoherences documentees ci-dessus (`pending` et endpoint synchrone) : verifiees ligne a ligne dans le code reel des routes, pas une supposition.
- Incertitude moyenne (Probable) sur l'intervalle de polling (5s, repris de UI-DESIGN, non recalibre) : toujours non calibre sur des durees reelles d'adaptateurs headless (jamais executes en conditions reelles, cf. JOURNAL Backend) -- impact juge limite car la mutation de declenchement elle-meme ne depend pas du polling pour son propre resultat (voir decision synchrone ci-dessus).
- Incertitude moyenne sur les contrastes exacts des tokens `base-*` ajoutes (non verifies avec un outil dedie type axe DevTools) -- meme reserve que PALETTE.md §4, signalee au QA.
- Incertitude reelle (Hypothese) : aucun des 4 endpoints n'a ete appele contre une vraie base de donnees/session Supabase depuis ce poste (pas d'acces reseau vers Supabase) -- le rendu reel avec des donnees (pagination, filtres, polling, toasts de resultat) n'est verifie que par lecture de code et compilation, jamais en navigateur reel. Risque principal residuel avant un premier usage reel par mentalyas.
- Incertitude faible sur le rendu visuel exact aux 3 breakpoints (1440/768/375) : verifie par lecture des classes Tailwind (`md:`/`sm:` coherents avec les seuils UI-DESIGN) mais jamais capture d'ecran reelle, faute de navigateur dans cet environnement.
**Impact :** L'ecran `/dashboard/collecte` est entierement implemente (3 zones B/C/D + header A), compile sans erreur TypeScript strict, et consomme les 4 endpoints reels du Backend (y compris `/api/collections/status` non prevu initialement). Une page de connexion minimale mais fonctionnelle debloque l'acces a la route protegee. Deux incoherences reelles entre le design documente et le code Backend reel ont ete detectees, corrigees ou adaptees explicitement (jamais silencieusement) : la semantique de `pending` (bug potentiellement bloquant si suivi a la lettre) et le caractere synchrone de l'endpoint de declenchement (impact sur le flux de toasts, pas sur la correction fonctionnelle).
**Alerte agent suivant :**
- **Test Engineer (#6)** : aucun test automatise ecrit sur ce perimetre frontend (hors scope de cette tache) -- prioriser `hooks.ts` (`hasActiveChain`, `describeChainResult`, `toastKindForChainStatus`) qui sont des fonctions pures faciles a tester unitairement, et `formatRelativeTime`/`formatPrice` (`lib/utils/format.ts`).
- **QA (#7)** : verifier en navigateur reel (jamais fait depuis ce poste, pas d'acces reseau Supabase) : (1) les contrastes des tokens `base-*` ajoutes par le Frontend (non couverts par PALETTE.md, qui ne couvre que les statuts) ; (2) le comportement du polling et de la mutation de declenchement contre un vrai run headless long (Delhaize/Lidl) pour confirmer que le flux synchrone adapte (toast optimiste + toast final base sur la reponse mutation) reste comprehensible a l'usage reel, pas seulement en theorie ; (3) la bascule table/carte de `PromotionsTable` aux 3 breakpoints reels (jamais capture d'ecran, seulement verifie par lecture de classes Tailwind) ; (4) que le formulaire de login fonctionne contre un vrai projet Supabase (jamais teste, aucun compte de test disponible depuis ce poste).
- **DevOps (#8)** : aucune nouvelle variable d'environnement requise par le frontend (la page de login reutilise `SUPABASE_URL`/`SUPABASE_ANON_KEY` serveur existants via Server Action, pas de client navigateur Supabase) -- pas d'impact sur `.env.example` ni sur la configuration Vercel deja preparee.

---

### [2026-08-08] SESSION — End
**Resume :** Pivot complet du projet (nouveau brainstorm 4 niveaux) : F1 (Collecte & structuration des promotions) detaillee en profondeur (L1+L2+L3), F2/F3/F4 restent au niveau vision. Pivot de source de collecte decouvert en cours de brainstorm (PromoPromo.be ecarte apres verification technique reelle -- donnees derriere des URLs interdites par robots.txt -- remplace par scraping direct des 4 enseignes Colruyt/Aldi/Delhaize/Lidl, verifie faisable en conditions reelles via navigateur). Pipeline Hub & Spoke Phases 1-5 executees en mode supervise : Product Owner (12 user stories F1), Architect (schema Prisma definitif, 4 crons Vercel distincts par enseigne, seuil de derive de format tranche), UI/UX Designer (ecran /dashboard/collecte, palette WCAG AA), Backend Dev (Next.js App Router, Clean Architecture, 4 StoreAdapter, 5 endpoints -- tsc/build OK, adaptateurs jamais testes contre les vrais sites faute d'acces reseau agent), Frontend Dev (ecran complet, 2 incoherences design/backend reelles trouvees et corrigees). Ancien code v1 (Express/Vite) et anciens docs (fondation a un seul niveau) archives dans `_archive-v1/` et `docs/_archive-v1/`.
**Branche :** master
**Commits pushes :** 1 (284717b -- 241 fichiers)

---

### SESSION 2 — 2026-06-08

### [2026-06-08 00:00] SESSION — End
**Resume :** Correction des 5 warnings QA (Clean Archi fuse.js, logger pino, email bienvenue, auto-categorisation, 9 composants UI). Preparation deploiement : config Vite, Tailwind, render.yaml (Render Frankfurt), vercel.json, tsconfig split. Phase 4 deploiement amorcee, a continuer prochaine session (creation compte Render + deploy).
**Branche :** master
**Commits pushes :** 2 (fix QA + chore prod config)

### [2026-06-08] CHORE — Production build config
**Fichiers :** `index.html`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`, `tsconfig.node.json`, `render.yaml`, `vercel.json`, `package.json`, `.gitignore`, `.env.example`
**Resume :** Preparation complete pour deploiement. Render (backend Frankfurt free tier) + Vercel (frontend). Split tsconfig, ajout dependances React, proxy Vite, SPA rewrites.

### [2026-06-08] FIX — 5 warnings QA resolus
**Fichiers :** `MatchingService.ts`, `FuseMatchingAdapter.ts`, `GetSuggestionsUseCase.ts`, `logger.ts`, `server.ts`, `errorHandler.ts`, `ConsoleEmailService.ts`, `RegisterUseCase.ts`, `AddItemUseCase.ts`, `Avatar.tsx`, `Divider.tsx`, `StoreRow.tsx`, `ProfileSection.tsx`, 5 templates layout
**Resume :** W1: IFuzzyMatcher interface (domain) + FuseMatchingAdapter (infra). W2: pino configure (dev/prod/test). W3: IEmailService + ConsoleEmailService fire-and-forget. W4: auto-categorisation via ProductRepository.findByName. W5: 9 composants UI crees (37/37 vs ui.md).

---

### SESSION 1 — 2026-06-05

### [2026-06-05 14:30] SESSION — End
**Resume :** Session inaugurale PromoScan. Brainstorm complet, pipeline Hub & Spoke Phases 1-3 execute (6 agents). Fondation, stories, architecture, UI/UX, backend, frontend, QA report. Verdict QA : PASS WITH WARNINGS (0 bloquant, 5 warnings mineurs).
**Branche :** master
**Commits pushes :** 2 (scaffolding + Phase 1-3)

### [2026-06-05 14:00] QA — Validation Phase 3
**Phase :** Phase 3 — Validation
**Iteration :** 1
**Entree consommee :** SPECS.md consolide (sections 1-5) + code source src/ (50+ fichiers TS/TSX) + docs detaillees (stories.md, archi.md, ui.md, api.md, front.md)
**Output produit :** docs/qa-report.md (rapport QA complet) + SPECS.md section 6 mise a jour
**Decisions cles :**
- Verdict PASS WITH WARNINGS : 0 bloquant deploiement, 5 actions P2 recommandees
- 11/13 stories P0 validees (US-001 PARTIAL car email bienvenue manquant, US-012 PARTIAL car auto-categorisation non connectee)
- 5 incoherences inter-agents detectees : PostGIS absent du schema Prisma, 9 composants UI manquants vs ui.md, fuse.js dans domain/, email bienvenue non implemente, chiffres divergents entre docs
- 1 finding securite mineur : logger pino non configure (dependance presente mais non utilisee)
- Clean Architecture respectee sauf MatchingService qui importe fuse.js dans domain/ — compromis acceptable MVP
**Selfdoubt applique :**
- Confiance haute sur la validation des schemas (Zod vs Prisma vs types — verification exhaustive fichier par fichier)
- Confiance haute sur la securite OWASP (chaque risque verifie dans le code avec references fichier:ligne)
- Incertitude faible sur le pipeline n8n : documente mais non executable — impossible de verifier les timeouts et retries Claude API en conditions reelles
- Incertitude moyenne sur le seuil fuse.js 0.4 : jamais teste avec des donnees francophones belges reelles. A calibrer au QA fonctionnel.
- Incertitude faible sur les composants frontend : le code existe mais le rendu visuel n'est pas verifiable sans execution (contrastes WCAG, responsive 375px, interactions clavier)
**Impact :** Le projet est declare deployable avec warnings. Les 5 actions P2 sont des ameliorations a planifier dans le premier sprint post-deploiement. Aucune vulnerabilite de securite critique.
**Alerte agent suivant :**
- **DevOps (#7)** : Le projet est pret pour le deploiement. Points d'attention : (1) Verifier la disponibilite de PostGIS sur Railway, sinon le fallback Haversine SQL fonctionne. (2) Configurer pino comme logger avant le deploiement prod. (3) Les variables d'environnement sont documentees dans .env.example (8 variables, toutes validees par Zod au startup). (4) Le pipeline n8n necessite un Docker VPS separe avec credentials Claude API et PostgreSQL. (5) Les seeds (stores, products, geocode-cache) doivent etre executes au premier deploiement (~20 min pour le geocode pre-seeding Nominatim).

---

### [2026-06-05 13:00] FEAT — Backend Implementation
**Phase :** Phase 2 — Implementation
**Iteration :** 1
**Entree consommee :** FONDATION-PROMOSCAN.md + archi.md (32 endpoints, 9 tables, 4 enums, 12 index, 5 patterns) + stories.md (25 US, 108 DoD)
**Output produit :** src/api/ (server.ts + 4 config + 4 middleware + 3 domain services + 7 use cases + 10 repositories + 3 external clients + 2 security utils + 9 route files) + src/shared/ (enums + types + schemas Zod) + prisma/schema.prisma (10 modeles) + n8n/ (README + prompt Claude) + docs/api.md + SPECS.md §4
**Decisions cles :**
- Clean Architecture stricte : domain/ ne contient aucun import Express ou Prisma. Les entites domain sont des interfaces pures, les repositories font la conversion Prisma -> domain.
- Repositories retournent des entites domain via methodes toDomain() explicites, pas d'objets Prisma leakes.
- Use cases instancies dans les routes (pas de DI container pour le MVP) — trade-off simplicite vs testabilite. Suffisant pour un monorepo de cette taille.
- Refresh token avec rotation : a chaque refresh, l'ancien token est supprime et un nouveau est cree. Protege contre le vol de refresh token.
- Geocoding cache table separee (geocode_cache) plutot que dans la table User — reutilisable par tous les users du meme code postal.
- StoreRepository.findNearby utilise Haversine en SQL pur (fallback) plutot que PostGIS ST_DWithin — fonctionne sans extension PostGIS si Railway ne la supporte pas.
- Error handler global attrape les erreurs Prisma (P2002 unique violation, P2025 not found) et retourne des messages generiques.
- Schemas Zod dans src/shared/ — partages entre backend (validation middleware) et frontend (validation formulaires).
**Selfdoubt applique :**
- Confiance haute sur la structure Clean Architecture et les patterns choisis (valides par archi.md).
- Confiance haute sur le schema Prisma (traduction directe de l'ERD valide par l'architecte).
- Incertitude faible sur les imports relatifs dans le monorepo (tsconfig paths non configures, imports relatifs profonds). A surveiller si les paths deviennent ingérables.
- Incertitude moyenne sur le StoreRepository.findNearby en SQL pur — la formule Haversine en SQL est correcte mais non testee avec des donnees reelles. PostGIS serait plus performant en production.
**Impact :** Le backend complet est pret pour le developpement frontend. Toutes les 25 stories P0+P1 ont leurs endpoints implementes. Le pipeline n8n est documente avec le prompt Claude.
**Alerte agent suivant :**
- **Frontend (#5)** : Les 32 endpoints sont documentes dans api.md avec exemples requete/reponse. Les types partages dans src/shared/ sont la source de verite pour les interfaces TypeScript. Les schemas Zod de src/shared/schemas/ sont reutilisables avec React Hook Form (@hookform/resolvers/zod). Le format de reponse est toujours { success, data, error }.
- **QA (#6)** : Tester le seuil de fuzzy matching (0.4) avec des noms de produits francophones reels. Verifier le rate limiting sur /auth/login (5 req/min). Tester la rotation des refresh tokens (token rotation = l'ancien expire). Verifier que les erreurs Prisma ne leakent pas de details en production. Le StoreRepository.findNearby en SQL pur doit etre valide avec des coordonnees belges reelles.

---

### [2026-06-05 12:00] DOCS — PO User Stories
**Phase :** Phase 1 — Fondation
**Iteration :** 1
**Entree consommee :** FONDATION-PROMOSCAN.md (concept, 5 features MVP F1-F5, 6 features v2+ F6-F11, 8 entites BDD, stack technique, 6 algorithmes/patterns, bloc securite RGPD)
**Output produit :** stories.md (25 user stories, 108 criteres d'acceptation) + SPECS.md §1 mis a jour
**Decisions cles :**
- Auth (inscription/connexion/profil) traitee en stories transversales P0 car prerequis a toutes les features
- Zone geographique en P0 car sans elle, F4 et F5 sont inutilisables
- Pipeline collecte (F1) et extraction IA (F2) en P0 car sans donnees, aucune feature utilisateur ne fonctionne
- OCR Vision (US-010) baissee en P1 car le HTML/scraping couvre la majorite des enseignes au lancement
- Etats vides et guidance (US-016) en P2 car non bloquant fonctionnellement
- Chaque story inclut les cas limites : liste vide, scraping echoue, aucun match, API routing down
**Selfdoubt applique :** Confiance haute sur la decomposition fonctionnelle (source unique et claire). Incertitude moyenne sur le seuil de fuzzy matching (0.4) — a valider par l'Agent QA avec des donnees reelles.
**Impact :** Les 25 stories definissent le perimetre exact du MVP. Tout ce qui n'est pas ici est hors scope.
**Alerte agent suivant :**
- **Architect (#2)** : Le scoring multi-criteres (US-018) necessite une decision sur les poids par defaut (w1/w2/w3). Le geocoding Nominatim a un rate limit — prevoir un cache. La table Product necessite un seeding initial (catalogue de reference).
- **UI/UX (#3)** : 4 etats vides a designer (US-016, US-020). Le flow principal est : liste -> suggestions -> carte. Les filtres (US-019) doivent etre accessibles sans surcharger l'ecran mobile. Le resume itineraire (US-023) doit cohabiter avec la carte.

---

### [2026-06-05 12:30] DOCS — Architect
**Phase :** Phase 1 — Fondation
**Iteration :** 1
**Entree consommee :** FONDATION-PROMOSCAN.md + stories.md (25 stories, 108 DoD)
**Output produit :** archi.md (schema archi Mermaid, ERD 9 tables, 32 endpoints, stack justifiee, 5 patterns detailles, arborescence projet) + SPECS.md section 2 mise a jour
**Decisions cles :**
- Monorepo src/api + src/web + src/shared avec types Zod partages pour garantir la coherence full-stack TypeScript
- Table RefreshToken ajoutee (absente de la fondation) pour supporter l'invalidation cote serveur des sessions (US-002 deconnexion)
- PostGIS geography column sur Store pour recherche par proximite O(log n) au lieu de calcul Haversine sur toutes les lignes
- Pre-seeding des 1100 codes postaux belges dans un cache geocode pour eviter les appels Nominatim en runtime
- Scoring multi-criteres avec poids par defaut w1=0.5, w2=0.3, w3=0.2 (budget prioritaire, coherent avec le positionnement "maximiser les economies")
- Nearest neighbor TSP plutot qu'algorithme exact : pour 2-6 stops, la difference est negligeable et la complexite de dev est minimale
- Fuse.js threshold 0.4 comme point de depart, a calibrer avec donnees reelles (alerte PO US-017)
- Pipeline n8n unique avec switch HTML/PDF+Vision, erreur partielle toleree (une enseigne down ne bloque pas les autres)
- 4 enums PostgreSQL (brand, category, scan_status, user_role) pour eviter les magic strings et faciliter les migrations v2+
**Selfdoubt applique :**
- PostGIS sur Railway : hypothese probable (Railway supporte les extensions PG) mais non verifiee. Fallback : Haversine SQL pur.
- Seuil Fuse.js 0.4 : estimation empirique, a valider avec corpus reel de noms de produits francophones belges.
- Pre-seeding Nominatim ~20 min : conforme a leur politique (1 req/s + User-Agent) mais jamais teste sur ce volume exact.
- Product.aliases en array PG natif : acceptable MVP, a migrer vers table de jointure si le catalogue depasse 10k produits.
**Impact :** L'architecture definit le squelette technique complet du MVP. Le schema BDD, les endpoints et la structure de fichiers sont prets pour l'implementation. Le pipeline ETL est detaille noeud par noeud pour n8n.
**Alerte agent suivant :**
- **UI/UX (#3)** : 10 pages identifiees (Login, Register, Dashboard, ShoppingList, Suggestions, Map, Profile, RoutesHistory, Admin). Le flow principal est Login -> Dashboard -> ShoppingList -> Suggestions -> Map. Le panneau resume itineraire (US-023) doit cohabiter avec la carte Leaflet (split panel ou drawer). Les filtres (US-019) sont 3 multi-selects (categorie, enseigne, jour). Prevoir les etats de chargement TanStack Query (loading, error, empty).
- **Backend (#4)** : 32 endpoints a implementer. Commencer par Auth (4 endpoints) puis ShoppingLists (9 endpoints) car ils debloquent le frontend. Le service suggestion.service.ts est le plus complexe (Fuse.js + scoring + pagination). Le middleware validate.ts utilise les schemas Zod de src/shared. Prisma schema a ecrire depuis l'ERD. Seeds stores + products a preparer (catalogues enseignes belges).
- **Frontend (#5)** : TanStack Query hooks a generer pour les 32 endpoints. Zustand pour auth state + preferences. React Router v6 avec routes protegees (auth middleware). Leaflet integration via react-leaflet. Responsive desktop-first 1440/768/375.

---

### [2026-06-05 13:00] FEAT — Frontend Implementation
**Phase :** Phase 2 — Implementation
**Iteration :** 1
**Entree consommee :** FONDATION + ui.md (8 ecrans, 30 composants, tokens complets) + archi.md (32 endpoints, types partages, schemas Zod)
**Output produit :** src/web/ (28 composants, 10 pages, 6 hooks, 3 stores, API client, design tokens) + front.md + SPECS §5
**Decisions cles :**
- Client fetch custom plutot qu'axios : zero dependance supplementaire, gestion JWT/refresh integree, type-safe avec ApiResponse<T>
- Optimistic updates sur check/delete items (UX instantanee) avec rollback automatique en cas d'erreur
- Suggestions via useMutation (pas useQuery) car le POST /suggestions/recommend est declenche a la demande, pas en cache automatique
- MapView avec markers DivIcon custom (couleur par enseigne) plutot que des images pour eviter les assets supplementaires
- Navbar repliable (240px -> 64px) plutot que hamburger menu pour garder la navigation visible en permanence sur desktop
- Bottom nav 56px (> 44px Fitts) avec icones fill pour l'onglet actif, outline pour les inactifs
- SearchBar avec role="combobox" et gestion clavier complete (ArrowUp/Down, Enter, Escape) pour l'accessibilite
- authStore persiste dans localStorage via Zustand persist ; listStore et filterStore en memoire seule (pas de persistence necessaire)
- Toast avec auto-dismiss configurable et action undo pour les suppressions (Nielsen : prevention erreurs)
**Selfdoubt applique :**
- Confiance haute sur l'architecture Atomic Design et le routing (alignes avec ui.md et archi.md).
- Confiance haute sur le client API (pattern standard JWT refresh, teste mentalement sur les 32 endpoints).
- Incertitude faible sur MapView : les markers DivIcon custom n'ont pas ete testes en rendu reel. Peut necessiter des ajustements CSS.
- Incertitude moyenne sur les performances de PromoGrid avec 100+ cartes : la pagination devrait suffire, mais le lazy loading d'images n'est pas implemente (natif via loading="lazy").
**Impact :** Le frontend complet est pret pour l'integration avec le backend. Tous les ecrans du MVP sont couverts. Les types partages de src/shared/ sont consommes sans redefinition.
**Alerte agent suivant :**
- **QA (#6)** : Verifier les contrastes WCAG AA en conditions reelles (les ratios sont calcules mais pas testes sur tous les composants). Tester la navigation clavier complete (tab order, focus trap). Verifier le responsive sur 375px reel (pas seulement le dev tools). Le MapView necessite les tuiles OpenStreetMap — verifier le chargement en conditions reseau lentes. Les optimistic updates sur les items de liste doivent etre testes avec des erreurs serveur simulees (rollback). Le formulaire Register a 5 champs — verifier l'UX mobile (scroll, clavier virtuel).

---

### [2026-06-05 13:00] DOCS — UI/UX Designer
**Phase :** Phase 1 — Fondation
**Iteration :** 1
**Entree consommee :** FONDATION-PROMOSCAN.md + stories.md (25 stories, focus F3-F5 user-facing, 4 etats vides identifies par PO)
**Output produit :** ui.md (8 ecrans + 4 etats vides, 30 composants Atomic Design, design tokens complets, 5 user flows Mermaid, 12 routes) + SPECS.md §3 mis a jour
**Decisions cles :**
- Bottom nav 4 onglets mobile (Home/Liste/Promos/Carte) — max 5 onglets Hick-Hyman, 4 suffit car Suggestions est accessible depuis Liste et Dashboard
- Layout carte/resume en split phi 62/38 sur desktop, empile sur mobile — la carte est prioritaire visuellement mais le resume est l'info actionnable
- Filtres en panneau repliable sur mobile plutot qu'en sidebar permanente — economise l'espace ecran (Tesler : complexite absorbee par le systeme)
- Score enseigne avec pastille couleur + valeur numerique — accessibilite (pas de color-only) + comprehension rapide
- Palette vert/orange/bleu inspiree du domaine alimentaire : vert = economies (positif), orange = promos (urgence douce), bleu = navigation/carte (neutre informatif)
- CTA "Calculer l'itineraire" fixe en bas de l'ecran Suggestions — position previsible au pouce (Fitts) et toujours visible
- Autocompletion produits apres 2 caracteres — equilibre perf/utilite, evite le bruit a 1 caractere
- Toast "Annuler" 5s pour les suppressions — filet de securite (Nielsen : prevention erreurs + annulation disponible)
- Inter comme font principale — police variable, excellente lisibilite mobile, gratuite, largement supportee
- Dark mode prevu dans les tokens mais pas implemente au MVP — reduit le scope sans perdre la capacite d'extension
**Selfdoubt applique :**
- Confiance haute sur la structure de navigation (4 onglets couvrent les 4 fonctions core, pattern standard mobile).
- Confiance haute sur la palette et les tokens (aligne avec la semantique du domaine, contrastes WCAG verifies).
- Incertitude faible sur le layout carte 62/38 mobile : le drag handle pour redimensionner la carte est un nice-to-have, a valider en prototype.
- Incertitude moyenne sur le nombre de filtres par ecran : 3 filtres (categorie, enseigne, jour) est dans la limite Hick-Hyman mais a tester avec des utilisateurs reels.
**Impact :** Les wireframes, composants et tokens forment le cahier visuel complet du MVP. Le Frontend (#5) peut commencer l'implementation composant par composant en suivant l'Atomic Design.
**Alerte agent suivant :**
- **Backend (#4)** : Les endpoints de suggestions doivent renvoyer le score calcule (pas juste les donnees brutes) pour que le frontend puisse afficher les pastilles couleur directement. Le format de reponse suggestion doit inclure : score, matchCount, estimatedSavings, distance par enseigne.
- **Frontend (#5)** : 30 composants identifies (10 atoms, 10 molecules, 10 organisms). Commencer par les atoms (Button, Input, Badge) puis monter en complexite. La PromoCard est le composant le plus reutilise (Dashboard, Promos, Suggestions). Utiliser les design tokens CSS comme source de verite, les mapper dans tailwind.config.ts. Les etats vides (EmptyState molecule) sont une seule molecule parametrable avec icon/title/description/CTA. Leaflet via react-leaflet, attention au SSR (dynamic import). Le bottom nav doit etre un composant fixe avec z-index eleve, prevoir le padding-bottom sur le contenu pour eviter le chevauchement. Les filtres sont un FilterBar organism qui switch entre sidebar (desktop) et panneau repliable (mobile) selon le breakpoint.

---

### SESSION 0 — 2026-06-05

### [2026-06-05 11:30] FEAT — init
**Fichiers :** `CLAUDE.md`, `docs/JOURNAL.md`, `src/`, `tests/`
**Resume :** Scaffolding initial via `/hub new`. Coquille vide creee — stack et dependances a definir apres brainstorm.
