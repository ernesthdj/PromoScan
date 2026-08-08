// app/(dashboard)/dashboard/collecte/page.tsx
//
// Page de contrôle F1 (US-F1-09/10/11) — implémentation complète selon docs/UI-DESIGN.md (3 zones
// A-D, composants Atomic Design, flux UX). Server Component minimal : toute la logique
// client (TanStack Query, toasts, interactions) vit dans `_components/CollecteScreen.tsx`.

import { CollecteScreen } from './_components/CollecteScreen';

export default function CollectePage() {
  return <CollecteScreen />;
}
