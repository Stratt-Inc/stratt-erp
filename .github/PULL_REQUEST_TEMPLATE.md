## Description

<!-- Décrivez clairement les changements apportés et pourquoi. -->

Fixes #<!-- numéro d'issue -->

## Type de changement

- [ ] `feat` — Nouvelle fonctionnalité
- [ ] `fix` — Correction de bug
- [ ] `refactor` — Refactoring sans changement fonctionnel
- [ ] `docs` — Documentation uniquement
- [ ] `test` — Ajout ou modification de tests
- [ ] `chore` — Build, deps, config
- [ ] `perf` — Amélioration de performance
- [ ] `ci` — Changements CI/CD

## Checklist

### Code
- [ ] Mon code respecte les conventions du projet (ESLint / gofmt)
- [ ] J'ai effectué une auto-review de mon code
- [ ] J'ai commenté les parties complexes ou non évidentes
- [ ] Pas de `console.log`, `fmt.Println` ou code de debug laissé

### Tests
- [ ] J'ai ajouté des tests couvrant mes changements
- [ ] Tous les tests existants passent (`pnpm test` / `go test ./...`)
- [ ] J'ai testé manuellement en local

### Documentation
- [ ] J'ai mis à jour la documentation si nécessaire
- [ ] Les types TypeScript sont corrects et complets
- [ ] Les endpoints API sont documentés si ajoutés/modifiés

### Sécurité
- [ ] Pas de secrets ou credentials dans le code
- [ ] Les entrées utilisateur sont validées
- [ ] Pas de vulnérabilité introduite (OWASP Top 10)

## Tests effectués

<!-- Décrivez les tests que vous avez effectués pour vérifier vos changements. -->

```
# Commandes exécutées
pnpm test
pnpm lint
```

## Screenshots (si applicable)

<!-- Avant / Après pour les changements UI -->

## Impact et risques

<!-- Y a-t-il des breaking changes ? Des migrations nécessaires ? Des impacts sur d'autres modules ? -->

- **Breaking changes** : Oui / Non
- **Migration nécessaire** : Oui / Non
- **Impact sur les performances** : Oui / Non

## Notes pour les reviewers

<!-- Tout ce qui facilite la review : points d'attention, contexte, questions. -->
