# CONTRIBUTING — Axiora

Standards de développement, conventions et workflow Git.

---

## Workflow Git

### Branches

```
main              ← production (protégée, merge via PR uniquement)
develop           ← intégration continue
feature/AXI-{n}-description
bugfix/AXI-{n}-description
hotfix/AXI-{n}-description
release/v{major}.{minor}.{patch}
```

**Règles** :
- `main` et `develop` : push direct interdit, PR obligatoire
- Toute branche `feature/*` part de `develop`
- Les `hotfix/*` partent de `main` et mergent sur `main` + `develop`
- Les branches doivent référencer le ticket Jira : `feature/AXI-42-nomenclature-import`

### Pull Requests

- Titre au format Conventional Commits : `feat(nomenclature): add threshold computation`
- Description : contexte, changements, comment tester, screenshots si UI
- Au moins 1 review requise avant merge
- CI verte obligatoire (lint + tests)
- Squash merge vers `develop`, merge commit vers `main`

---

## Conventional Commits

Format : `<type>(<scope>): <description>`

| Type | Usage |
|------|-------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `refactor` | Refactoring sans changement fonctionnel |
| `test` | Ajout ou modification de tests |
| `docs` | Documentation uniquement |
| `chore` | Maintenance (deps, config, CI) |
| `perf` | Amélioration de performance |
| `style` | Formatage, indentation (pas de logique) |

**Scopes** : `nomenclature`, `cartographie`, `planification`, `exports`, `auth`, `api`, `ui`, `infra`, `ai`

**Exemples** :
```
feat(nomenclature): add automatic code classification via AI agent
fix(cartographie): correct fractionnement detection for rolling 12m window
refactor(api): extract threshold computation into domain service
test(exports): add integration tests for PDF generation pipeline
chore(infra): upgrade Go to 1.23.1
```

---

## Standards de code

### TypeScript / Next.js

```typescript
// ✅ Types stricts, pas d'any
interface Marche {
  id: string;
  reference: string;
  montant: number;
  statut: MarcheStatut; // enum typé
}

// ✅ Zod pour la validation aux boundaries
const CreateMarcheSchema = z.object({
  objet: z.string().min(10).max(500),
  montant: z.number().positive(),
  procedure: ProcedureSchema,
});

// ✅ Error handling explicite
const result = await createMarche(data);
if (result.error) {
  logger.error('Failed to create marche', { error: result.error, data });
  return { error: 'CREATION_FAILED' };
}

// ❌ Pas d'assertions non justifiées
const marche = await getMarche(id)!; // interdit
```

### Go (Backend)

```go
// ✅ Errors wrapped avec contexte
if err := repo.Save(ctx, marche); err != nil {
    return fmt.Errorf("MarcheUseCase.Create: %w", err)
}

// ✅ Context propagé partout
func (uc *MarcheUseCase) Create(ctx context.Context, cmd CreateMarcheCmd) (*Marche, error) {

// ✅ Interfaces pour les dépendances (testabilité)
type MarcheRepository interface {
    Save(ctx context.Context, m *Marche) error
    FindByID(ctx context.Context, id uuid.UUID) (*Marche, error)
}

// ❌ Pas de panic en dehors de l'init
// ❌ Pas de variables globales mutables
```

### Naming

| Contexte | Convention |
|----------|-----------|
| Fichiers TS | `kebab-case.ts` |
| Composants React | `PascalCase.tsx` |
| Fonctions/variables | `camelCase` |
| Types/Interfaces TS | `PascalCase` |
| Fichiers Go | `snake_case.go` |
| Types Go | `PascalCase` |
| Fonctions Go | `camelCase` (unexported), `PascalCase` (exported) |
| Variables env | `SCREAMING_SNAKE_CASE` |
| Tables SQL | `snake_case` (pluriel) |
| Colonnes SQL | `snake_case` |

---

## Tests

### Stratégie

```
Unit Tests      → logique pure (domain, utils, agents)     → 80% coverage cible
Integration     → repository + DB, handlers + HTTP          → cas nominaux + erreurs
E2E             → Playwright, parcours utilisateurs clés     → smoke tests
```

### Lancer les tests

```bash
# Frontend
pnpm test              # Jest (unit)
pnpm test:e2e          # Playwright

# Backend Go
go test ./...          # tous les tests
go test -race ./...    # avec détection de race conditions
go test -coverprofile=coverage.out ./internal/...
```

### Conventions de test

```typescript
// ✅ Nommage explicite : "should <comportement> when <condition>"
describe('SeuilComputation', () => {
  it('should detect fractionnement when cumul MAPA exceeds 90k threshold', () => {
    // arrange
    const depenses = [{ montant: 50_000 }, { montant: 45_000 }];
    // act
    const result = computeSeuil(depenses, 'mapa_90k');
    // assert
    expect(result.isFractionnement).toBe(true);
  });
});
```

---

## Linting & Formatage

```bash
# Frontend
pnpm lint          # ESLint
pnpm lint:fix      # ESLint --fix
pnpm format        # Prettier

# Backend
golangci-lint run  # lint Go (installé dans CI)
gofmt -w .         # formatage Go
```

### Config ESLint (extrait)
- `@typescript-eslint/no-explicit-any` : error
- `@typescript-eslint/strict-null-checks` : error
- `no-console` : warn (utiliser logger)
- `react-hooks/exhaustive-deps` : error

---

## Pre-commit hooks

Husky + lint-staged configurés automatiquement :

```bash
pnpm prepare  # installe les hooks
```

Sur chaque `git commit` :
1. ESLint + Prettier sur les fichiers staged
2. TypeScript `tsc --noEmit`
3. Tests unitaires affectés (vitest --related)

Sur chaque `git push` :
1. Build complet
2. Tests complets

---

## CI/CD

### Pull Request (`.github/workflows/test.yml`)
- Lint TypeScript + Go
- Tests unitaires + intégration
- Build Docker (dry-run)
- Coverage report

### Merge sur `develop` (`.github/workflows/build.yml`)
- Build + push image Docker → registry
- Deploy sur environnement `staging`

### Tag `v*` sur `main` (`.github/workflows/deploy.yml`)
- Deploy sur `production` (Fly.io)
- Slack notification

---

## Setup environnement développeur

```bash
# 1. Cloner
git clone https://github.com/your-org/axiora.git && cd axiora

# 2. Installer dépendances
pnpm install

# 3. Hooks Git
pnpm prepare

# 4. Variables d'environnement
cp .env.example .env  # puis éditer

# 5. Démarrer l'infra locale
docker compose up -d postgres redis

# 6. Migrations
cd apps/api && go run ./cmd/migrate up

# 7. Seeding (données de démo)
bash infrastructure/scripts/seed.sh

# 8. Lancer
pnpm dev  # démarre web + api en parallèle (Turborepo)
```

L'environnement est prêt. Accès sur http://localhost:3000.
