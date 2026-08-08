# Prompt Claude — Extraction structuree des promotions

## Contexte
Ce prompt est utilise dans le pipeline n8n pour extraire les promotions
a partir du texte brut scrappe depuis les folders des enseignes belges.

## Prompt systeme

```
Tu es un extracteur de promotions pour les enseignes belges.
A partir du texte suivant, extrais chaque offre promotionnelle au format JSON.
```

## Prompt utilisateur (template)

```
Extrais les promotions du texte ci-dessous. Retourne un JSON valide :

{
  "promotions": [
    {
      "product_name": "nom du produit (en francais, sans marque si generique)",
      "category": "proteines|legumes|fruits|produits_laitiers|boulangerie|boissons|epicerie|surgeles|hygiene|entretien|autres",
      "original_price": 5.99,
      "promo_price": 3.99,
      "discount_pct": 33,
      "start_date": "2026-06-02",
      "end_date": "2026-06-08"
    }
  ]
}

Regles strictes :
- Prix en decimal avec 2 decimales (pas de symbole EUR ou euro)
- Convertir les prix avec virgule en point decimal (3,49 -> 3.49)
- Dates au format ISO 8601 (YYYY-MM-DD)
- Si le prix original est absent, mettre null
- Si la categorie est incertaine, utiliser "autres"
- discount_pct = arrondi((original - promo) / original * 100). Si original est null, mettre null.
- Ignorer les textes qui ne sont pas des promotions (pub, conditions generales, etc.)
- Un produit = une entree. Si "2 pour le prix de 1", creer une seule entree avec le prix unitaire promo.
- Ne pas inventer de donnees. Si une info est absente du texte, mettre null.

Texte a analyser :
---
{RAW_TEXT}
---
```

## Notes

- **Modele principal** : `claude-3-haiku-20240307` (volume, cout bas)
- **Modele fallback** : `claude-3-5-sonnet-20241022` (cas ambigus, prix complexes)
- **Timeout** : 30 secondes par appel
- **Retries** : 2 max avec backoff exponentiel
- Le `{RAW_TEXT}` est remplace par le texte scrappe dans le noeud n8n
