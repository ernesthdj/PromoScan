# Specification Analysis Report — 001-promo-collection

> Généré par `/speckit-analyze` le 2026-08-15 (exécution manuelle du skill, registre de session figé avant installation de Spec Kit — voir `docs/JOURNAL.md` SESSION 4).
> `/speckit-analyze` ne persiste jamais son rapport sur disque par défaut : ce fichier est la sauvegarde manuelle obligatoire, conformément à `~/.claude/CLAUDE.md` § Pipeline de développement.

## Issues

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| I1 | Inconsistency | HIGH | `spec.md` (Clarifications, FR-013); `docs/API-ENDPOINTS.md:71`; `tasks.md:T023` | `spec.md` résout l'accès à l'interface de contrôle à owner/admin uniquement ; `docs/API-ENDPOINTS.md` affirme explicitement "Aucun rôle particulier requis... la vérification de session suffit" — conflit réel et préexistant entre le modèle d'accès voulu par le spec et le comportement documenté (et probablement implémenté). | Confirmer la réponse faisant autorité avec mentalyas avant tout changement de code ; ne pas trancher unilatéralement (déjà signalé comme tâche à part, T023). |
| C1 | Coverage Gap | MEDIUM | `spec.md` FR-002; `tasks.md` (aucune tâche) | FR-002 (déclenchement planifié récurrent) n'a aucune tâche vérifiant explicitement le mécanisme de planification réel (4 crons hebdomadaires décalés dans `vercel.json`, cohérent avec `research.md` §1) — seulement une couverture indirecte via T017 (scénario 1 du quickstart). | Ajouter une tâche vérifiant explicitement que les entrées cron de `vercel.json` correspondent à la décision "4 chaînes indépendantes" et à FR-002. |
| U1 | Underspecification | MEDIUM | `tasks.md` T013–T016 | FR-007 (respect du crawl-delay par enseigne) est couvert de façon inégale : T015/T016 (adaptateurs headless) mentionnent explicitement la vérification du crawl-delay ; T013/T014 (Colruyt/Aldi) non, alors que Colruyt a une règle explicite de 5000ms (`StoreChain.crawlDelayMs`). | Reformuler T013/T014 pour inclure explicitement la vérification du crawl-delay, à l'image de T015/T016. |
| A1 | Ambiguity / placeholder residue | LOW | `plan.md:39` | La chaîne littérale "NEEDS CLARIFICATION" apparaît dans une phrase déjà résolue ; un scan automatique naïf de ce marqueur (comme celui utilisé par la validation de `/speckit-specify`) donnerait un faux positif sur ce fichier. | Reformuler pour éviter le mot-clé littéral, ex. "gap d'outillage de test identifié → résolu en Phase 0." |

**Constitution Alignment Issues** : Principle V (Test Discipline) — gap déjà auto-déclaré dans la Constitution Check de `plan.md` et pris en charge par les tâches de remédiation (T002, T006–T012, T020–T022, T025) dans `tasks.md`. Suivi, pas une violation nouvelle ; aucune action au-delà de l'exécution de ces tâches.

**Unmapped Tasks** : aucune préoccupante — T001, T003, T005, T027–T029 sont des tâches Setup/Foundational/Polish, explicitement exemptées d'étiquette requirement/story par les règles de format de tâches.

**Coverage Summary** : les 15 FR + 6 SC ont chacun ≥1 tâche ; seule FR-002 est signalée comme faiblement/indirectement couverte (voir C1).

**Metrics** : Total Requirements 21 (15 FR + 6 SC) · Total Tasks 29 · Coverage 100% (21/21, 1 signalée indirecte) · Ambiguity Count 1 · Duplication Count 0 · Critical Issues Count 0 (sévérité la plus haute trouvée : HIGH).

**Next Actions** : Aucun problème CRITICAL — on peut en principe avancer vers `/speckit-implement`, mais I1 doit être tranché avec mentalyas d'abord (question sécurité/autorisation réelle et vivante) ; C1/U1 sont des retouches rapides de `tasks.md`. Aucune correction n'a été appliquée automatiquement — `/speckit-analyze` est en lecture seule par conception.
