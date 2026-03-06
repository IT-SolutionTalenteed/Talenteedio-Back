# Corrections TypeScript nécessaires

## Problèmes identifiés lors du déploiement

### 1. Version Node.js
- ✅ **CORRIGÉ** : Le script de déploiement force maintenant Node v20

### 2. Configuration TypeScript
- ✅ **TEMPORAIREMENT CORRIGÉ** : `strict` et `noImplicitAny` désactivés
- ⚠️ **À FAIRE** : Réactiver progressivement et corriger les types

### 3. Types manquants à corriger

#### Fichiers avec erreurs de types:
- `src/auth/controllers/index.ts` - Augmentation de module express-session invalide
- `src/controllers/creneaux.controller.ts` - Propriétés manquantes sur AuthenticatedRequest
- `src/controllers/wallet.controller.ts` - Propriétés manquantes sur AuthenticatedRequest
- `src/graphql/resources/user/matching.resolver.ts` - Propriétés manquantes sur User
- `src/database/seeds/company-plans.seed.ts` - Mauvaise utilisation de BaseEntity.create()
- `src/graphql/resources/job/new-resolvers.ts` - Problème avec ApplicationFeedback.create()

#### Actions recommandées:
1. Définir correctement l'interface `AuthenticatedRequest` avec body, params, query
2. Vérifier les propriétés de l'entité `User` (cv, competences, languages, etc.)
3. Corriger l'utilisation de `BaseEntity.create()` dans les seeds
4. Ajouter les types pour les callbacks d'erreur (err: Error)
5. Gérer correctement les erreurs avec `error: unknown` puis type guard

### 4. Prochaines étapes
1. Tester le déploiement avec la configuration actuelle
2. Créer des branches pour corriger progressivement les types
3. Réactiver `strict: true` une fois tous les types corrigés
