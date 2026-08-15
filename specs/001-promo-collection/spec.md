# Feature Specification: Collecte & structuration des promotions (F1)

**Feature Branch**: `001-promo-collection`

**Created**: 2026-08-15

**Status**: Draft

**Input**: User description: "F1 — Collecte & structuration des promotions. Objectif : récupérer automatiquement,
de façon planifiée, les promotions alimentaires directement sur les sites officiels des enseignes belges
(Colruyt, Delhaize, Aldi, Lidl), et les transformer en catalogue interne structuré — socle technique de tout
le reste de l'app (profil alimentaire, budget, recommandation de circuit de magasins). Cas d'usage : (UC-1)
déclenchement planifié qui itère sur les enseignes configurées dans le respect du crawl-delay de chacune ;
(UC-2) extraction structurée à partir des pages HTML/API des enseignes — produit, prix, dates, catégorie —
avec rejet loggé si donnée obligatoire manquante ou dérive de format détectée ; (UC-3) extraction assistée
par IA en secours pour tout document non structuré (PDF/image) qu'une enseigne future pourrait publier ;
(UC-4) tolérance de panne partielle — l'échec d'une enseigne n'affecte jamais les autres et ne fait jamais
disparaître silencieusement les dernières données valides connues ; (UC-5) interface de contrôle protégée
permettant de lister les promotions collectées (filtrables par enseigne/catégorie), de consulter l'historique
des collectes, et de déclencher une collecte manuelle à la demande. Règles métier : respecter le robots.txt
et le crawl-delay de chaque enseigne ; une enseigne en échec ne bloque jamais la collecte des autres ; ne
jamais écraser le catalogue existant avec un résultat vide ou suspect."

## Clarifications

### Session 2026-08-15 (auto-resolved — no human reviewer available in this test run)

- **Q: Qui peut accéder à l'interface de contrôle de la collecte (UC-5) ?** Le récit source indique
  seulement "protégée" sans préciser si elle est réservée au propriétaire de l'app ou ouverte à tout
  utilisateur authentifié — impact direct sur la portée sécurité/RBAC (Role-Based Access Control —
  contrôle d'accès basé sur les rôles) de la fonctionnalité.
  → **Résolu (hypothèse raisonnable)** : réservée au rôle propriétaire/administrateur pour le MVP solo
  (mentalyas). Un compte utilisateur "standard" futur (F2-F4) n'y aura pas accès tant qu'un rôle
  d'administration explicite n'est pas introduit. À revalider avant tout déploiement multi-utilisateurs.
- **Q: Une promotion expirée (date de fin dépassée) reste-t-elle visible dans le catalogue consulté par
  défaut ?** Non précisé dans le récit source — impact sur l'expérience de consultation (UC-5) et sur la
  fiabilité perçue du catalogue.
  → **Résolu (hypothèse raisonnable)** : la vue par défaut du catalogue ne montre que les promotions
  actuellement valides (date du jour comprise entre début et fin) ; l'historique complet (y compris
  promotions expirées) reste consultable via un filtre explicite, car le catalogue existe pour préparer
  des courses réelles à venir, pas pour l'archivage.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Catalogue de promotions collecté et maintenu automatiquement (Priority: P1)

En tant que propriétaire de l'application, je veux qu'un catalogue interne des promotions alimentaires des
enseignes belges configurées (Colruyt, Delhaize, Aldi, Lidl) soit constitué et tenu à jour automatiquement,
sans intervention manuelle récurrente, afin que toute fonctionnalité construite par-dessus (profil
alimentaire, budget, circuit de courses) dispose toujours de données de promotion fiables et récentes.

**Why this priority**: C'est le socle : aucune autre fonctionnalité de l'app (F2-F4) ne peut exister sans un
catalogue de promotions structuré et fiable. Sans cette story, il n'y a pas de produit.

**Independent Test**: Peut être testée intégralement en déclenchant une collecte planifiée (ou son
équivalent en environnement de test) et en vérifiant que le catalogue contient des promotions structurées
et à jour pour les enseignes configurées, sans avoir besoin d'aucune autre fonctionnalité de l'app.

**Acceptance Scenarios**:

1. **Given** les 4 enseignes sont configurées et actives, **When** une collecte planifiée se déclenche,
   **Then** le système tente la collecte pour chacune des 4 enseignes et le catalogue contient, à l'issue,
   des promotions structurées (produit, prix, dates de validité, catégorie) pour chaque enseigne ayant
   répondu avec succès.
2. **Given** une enseigne renvoie une page dans un format inattendu (dérive de format), **When** la collecte
   s'exécute, **Then** l'anomalie est enregistrée (loguée) et le catalogue existant pour cette enseigne
   n'est ni vidé ni remplacé par un résultat suspect.
3. **Given** une promotion déjà présente au catalogue est re-collectée à l'identique lors d'un run
   ultérieur, **When** la collecte s'exécute à nouveau, **Then** aucune entrée en double n'apparaît au
   catalogue pour cette même promotion.

---

### User Story 2 - Consultation et déclenchement manuel via interface de contrôle (Priority: P2)

En tant que propriétaire de l'application, je veux consulter les promotions collectées et l'historique des
collectes, et pouvoir déclencher une collecte manuelle à la demande, afin de vérifier que le système
fonctionne correctement et de rafraîchir le catalogue sans attendre le prochain cycle planifié.

**Why this priority**: Nécessaire pour opérer et faire confiance au système (observabilité), mais l'app
peut délivrer de la valeur (catalogue à jour) sans cette interface — elle vient après la collecte
elle-même.

**Independent Test**: Peut être testée indépendamment en accédant à l'interface protégée avec un compte
autorisé, en filtrant les promotions par enseigne/catégorie, en consultant l'historique des collectes, et
en déclenchant une collecte manuelle — sans dépendre des autres fonctionnalités de l'app (F2-F4).

**Acceptance Scenarios**:

1. **Given** un utilisateur authentifié avec le rôle autorisé, **When** il ouvre l'interface de contrôle,
   **Then** il voit la liste des promotions actuellement valides, filtrable par enseigne et par catégorie.
2. **Given** un utilisateur authentifié avec le rôle autorisé, **When** il consulte l'historique des
   collectes, **Then** il voit chaque collecte passée avec son statut global et le résultat par enseigne.
3. **Given** un utilisateur authentifié avec le rôle autorisé, **When** il déclenche une collecte manuelle,
   **Then** une nouvelle collecte démarre et son résultat devient consultable dans l'historique une fois
   terminée.
4. **Given** un utilisateur non authentifié ou sans le rôle autorisé, **When** il tente d'accéder à
   l'interface de contrôle, **Then** l'accès lui est refusé.
5. **Given** une collecte est déjà en cours, **When** un utilisateur autorisé tente d'en déclencher une
   nouvelle, **Then** le système refuse le déclenchement et indique qu'une collecte est déjà en cours.

---

### User Story 3 - Extraction assistée par IA en secours pour formats non structurés (Priority: P3)

En tant que propriétaire de l'application, je veux qu'une enseigne future publiant ses promotions
uniquement sous forme de document non structuré (PDF ou image de folder) puisse tout de même être
intégrée au catalogue, afin que l'ajout d'une nouvelle enseigne ne soit jamais bloqué par l'absence de
source web structurée.

**Why this priority**: Aucune des 4 enseignes actuellement ciblées n'en a besoin (toutes exposent une
source HTML/API exploitable) ; c'est une capacité de résilience pour l'extensibilité future, pas un besoin
immédiat du MVP.

**Independent Test**: Peut être testée indépendamment en soumettant un document non structuré (PDF/image)
représentatif d'un folder promo et en vérifiant que les promotions qui en sont extraites respectent la même
structure de catalogue et les mêmes règles de validation que les autres enseignes.

**Acceptance Scenarios**:

1. **Given** une enseigne configurée avec une source non structurée (PDF/image), **When** la collecte
   s'exécute pour cette enseigne, **Then** les promotions extraites par le procédé assisté par IA respectent
   la même structure (produit, prix, dates, catégorie) que les promotions extraites des sources HTML/API.
2. **Given** une extraction assistée par IA produit un résultat qui ne respecte pas la structure attendue,
   **When** la validation s'exécute, **Then** le résultat est rejeté et logué comme les autres échecs de
   validation, sans corrompre le catalogue.

---

### Edge Cases

- Que se passe-t-il si deux déclenchements de collecte (planifié et manuel, ou deux manuels) se
  chevauchent dans le temps ? → Le second déclenchement est refusé tant que le premier n'est pas terminé
  (voir Acceptance Scenario US2.5).
- Que se passe-t-il si une collecte reste bloquée anormalement longtemps sans jamais se terminer ? → Elle
  doit pouvoir être détectée comme anormale plutôt que de bloquer indéfiniment tout déclenchement futur.
- Que se passe-t-il si une enseigne renvoie exactement zéro résultat alors que la collecte précédente en
  avait un nombre significatif ? → Traité comme une dérive de format suspecte (voir Acceptance Scenario
  US1.2), pas comme un catalogue légitimement vidé.
- Que se passe-t-il si une même promotion est republiée à l'identique lors d'un run suivant ? → Pas de
  doublon au catalogue (voir Acceptance Scenario US1.3).
- Que se passe-t-il si une enseigne est désactivée entre deux collectes ? → Elle est simplement ignorée par
  les collectes suivantes ; ses promotions déjà collectées restent en historique.
- Que se passe-t-il si l'extraction (structurée ou assistée par IA) obtient un produit sans prix promo ou
  sans dates de validité ? → Rejeté et logué comme donnée obligatoire manquante, jamais inséré au
  catalogue avec des valeurs incomplètes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT permettre de configurer une liste d'enseignes (au minimum Colruyt, Delhaize,
  Aldi, Lidl), chacune activable/désactivable indépendamment.
- **FR-002**: Le système DOIT déclencher automatiquement, selon une planification récurrente, une tentative
  de collecte des promotions pour chaque enseigne active.
- **FR-003**: Le système DOIT permettre à un utilisateur autorisé de déclencher une collecte manuelle à la
  demande, en plus du déclenchement planifié.
- **FR-004**: Le système DOIT refuser le déclenchement d'une nouvelle collecte tant qu'une collecte est déjà
  en cours.
- **FR-005**: Pour chaque enseigne, le système DOIT extraire au minimum : le nom du produit, son prix promo,
  son prix régulier si disponible, sa catégorie si disponible, ses dates de validité, et l'URL source.
- **FR-006**: Le système DOIT valider chaque promotion extraite avant insertion et rejeter (avec
  enregistrement de la raison) toute entrée à laquelle il manque une donnée obligatoire.
- **FR-007**: Le système DOIT respecter les règles d'exploration déclarées par chaque enseigne (chemins
  interdits, délai minimal entre requêtes) lors de toute collecte automatisée ou manuelle.
- **FR-008**: L'échec de collecte d'une enseigne NE DOIT JAMAIS empêcher ou interrompre la collecte des
  autres enseignes actives lors du même run.
- **FR-009**: Le système DOIT détecter un résultat anormal (par exemple zéro résultat alors qu'un volume
  significatif était attendu au vu de l'historique) et, dans ce cas, conserver le catalogue existant pour
  cette enseigne plutôt que de le remplacer par le résultat suspect.
- **FR-010**: Le système DOIT garantir qu'une promotion déjà connue (même enseigne, même produit tel que
  publié, même date de début) n'est jamais dupliquée au catalogue lorsqu'elle est re-collectée.
- **FR-011**: Le système DOIT conserver un historique consultable de chaque collecte, incluant : date de
  début, date de fin, statut global, et résultat par enseigne (succès, échec, nombre d'éléments).
- **FR-012**: Le système DOIT fournir une interface protégée permettant à un utilisateur autorisé de
  consulter le catalogue de promotions actuellement valides, filtrable par enseigne et par catégorie.
- **FR-013**: Le système DOIT restreindre l'accès à l'interface de contrôle de la collecte (consultation de
  l'historique, déclenchement manuel) au rôle propriétaire/administrateur ; tout autre accès est refusé.
- **FR-014**: Le système DOIT permettre, pour une enseigne future publiant ses promotions sous un format non
  structuré (PDF/image), une extraction assistée par IA produisant des promotions respectant la même
  structure et les mêmes règles de validation que les autres enseignes.
- **FR-015**: Le système NE DOIT JAMAIS supprimer silencieusement des promotions valides déjà présentes au
  catalogue en dehors d'une expiration naturelle de leur date de validité ou d'un remplacement par une
  donnée fraîche valide de la même enseigne.

### Key Entities *(include if feature involves data)*

- **Enseigne (StoreChain)** : une chaîne de magasins belge configurée comme source de promotions (ex.
  Colruyt, Delhaize, Aldi, Lidl) ; possède un statut actif/inactif.
- **Produit (Product)** : un produit alimentaire canonique auquel une ou plusieurs promotions peuvent être
  rattachées, utilisé pour regrouper des promotions équivalentes publiées différemment selon les enseignes.
- **Promotion** : une offre promotionnelle telle que publiée par une enseigne pour un produit — nom tel que
  publié, catégorie, prix régulier, prix promo, dates de validité, source, date de collecte. Rattachée à
  une enseigne, et le cas échéant à un produit canonique.
- **Collecte (CollectionRun)** : une exécution (planifiée ou manuelle) du processus de collecte, avec son
  statut global et le détail du résultat par enseigne.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Chaque collecte planifiée tente la collecte pour 100% des enseignes actives configurées, et
  le résultat par enseigne (succès/échec) est visible après coup à 100%.
- **SC-002**: L'échec d'une seule enseigne au cours d'une collecte n'entraîne la perte d'aucune promotion
  valide des autres enseignes (0% d'impact croisé mesuré sur les enseignes non défaillantes).
- **SC-003**: Une dérive de format ou un résultat vide inattendu ne vide jamais le catalogue existant de
  l'enseigne concernée (0% des runs anormaux ne doivent effacer le catalogue).
- **SC-004**: Un utilisateur autorisé peut consulter le catalogue de promotions actuellement valides et
  l'historique des collectes sans assistance technique.
- **SC-005**: Un utilisateur autorisé peut déclencher une collecte manuelle et en observer le résultat sans
  intervention d'un développeur.
- **SC-006**: Au moins une enseigne à source directement exploitable (HTML/API) et au moins une enseigne à
  rendu dynamique sont collectées de bout en bout avec succès dans les mêmes conditions que la planification
  normale.

## Assumptions

- L'interface de contrôle (US2) est réservée, pour ce MVP solo, au rôle propriétaire/administrateur — voir
  section Clarifications ci-dessus.
- La vue par défaut du catalogue n'affiche que les promotions actuellement valides ; l'historique complet
  (y compris promotions expirées) reste accessible via un filtre explicite — voir section Clarifications.
- La fréquence de la collecte planifiée est hebdomadaire par défaut (alignée sur le rythme habituel de
  publication des folders promo belges), ajustable ultérieurement sans changer la portée de cette
  fonctionnalité.
- Les 4 enseignes ciblées (Colruyt, Delhaize, Aldi, Lidl) disposent chacune d'une source web exploitable
  (API directe, HTML statique, ou rendu dynamique) ; aucune des 4 ne nécessite le mécanisme d'extraction
  assistée par IA (US3) au lancement — ce mécanisme est prévu pour une extension future, mais reste dans
  le périmètre testable de cette feature.
- Le catalogue de promotions produit par cette fonctionnalité est un prérequis consommé par les
  fonctionnalités F2 (profil alimentation), F3 (budget) et F4 (recommandation de circuit) ; leur propre
  portée n'est pas couverte par cette spécification.
