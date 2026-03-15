# CONTRIBUTING — STRATT

Standards de développement, conventions et workflow Git.

---

## Workflow Git

### Branches

```
main              ← production (protégée, merge via PR uniquement)
develop           ← intégration continue
feature/STRATT-{n}-description
bugfix/STRATT-{n}-description
hotfix/STRATT-{n}-description
release/v{major}.{minor}.{patch}
```

**Règles** :
- `main` et `develop` : push direct interdit, PR obligatoire
- Toute branche `feature/*` part de `develop`
- Les `hotfix/*` partent de `main` et mergent sur `main` + `develop`
- Les branches doivent référencer le ticket : `feature/STRATT-42-crm-contacts-filters`

### Pull Requests

- Titre au format Conventional Commits : `feat(crm): add contact search filters`
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

**Scopes** : `crm`, `accounting`, `billing`, `inventory`, `hr`, `procurement`, `analytics`, `auth`, `rbac`, `org`, `api`, `ui`, `infra`, `workers`

**Exemples** :
```
feat(crm): add contact search with Meilisearch
fix(billing): correct tax computation for multi-line invoices
refactor(api): extract permission check into middleware
test(auth): add integration tests for JWT refresh flow
chore(infra): upgrade Go to 1.23.1
```

---

## Standards de code

### TypeScript / Next.js

```typescript
// ✅ Types stricts, pas d'any
interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  type: "person" | "company";
}

// ✅ Error handling explicite avec le client API
try {
  const contacts = await api.get<Contact[]>("/api/v1/crm/contacts", { token, orgId });
} catch (err) {
  if (err instanceof ApiError) {
    console.error("API error:", err.status, err.message);
  }
}

// ❌ Pas d'assertions non justifiées
const user = await getUser(id)!; // interdit
```

### Go (Backend — Gin + GORM)

```go
// ✅ Errors wrapped avec contexte
if err := db.Where("tenant_id = ?", orgID).Find(&contacts).Error; err != nil {
    return c.Status(500).JSON(models.Err("failed to list contacts"))
}

// ✅ Utiliser models.OK / models.Err pour les réponses
return c.JSON(models.OK(contacts))

// ✅ Extraire user_id et org_id depuis les middleware locals
userID, _ := middleware.GetUserID(c)
orgID, _ := middleware.GetOrgID(c)

// ✅ Toujours filtrer par tenant_id dans les handlers de modules
db.Where("tenant_id = ?", orgID).Find(&records)

// ❌ Pas de panic en dehors de l'init
// ❌ Pas de variables globales mutables
// ❌ Pas de requêtes SQL sans filtre tenant_id dans les modules
```

### Naming

| Contexte | Convention |
|----------|-----------|
| Fichiers TS | `kebab-case.ts` |
| Composants React | `PascalCase.tsx` |
| Fonctions/variables TS | `camelCase` |
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
Unit Tests      → logique pure (services, utils)            → 80% coverage cible
Integration     → repository + DB, handlers + HTTP           → cas nominaux + erreurs
E2E             → Playwright, parcours utilisateurs clés      → smoke tests
```

### Lancer les tests

```bash
# Backend Go
cd backend
go test ./...              # tous les tests
go test -race ./...        # avec détection de race conditions
go test -coverprofile=coverage.out ./internal/...

# Frontend
cd frontend
npm run lint               # ESLint + Next.js
```

### Conventions de test

```go
// ✅ Go : nommage explicite TestFunction_Condition_ExpectedResult
func TestAuthService_Login_WithValidCredentials_ReturnsTokens(t *testing.T) {
    // arrange
    // act
    // assert
}
```

```typescript
// ✅ TS : "should <behaviour> when <condition>"
describe("AuthStore", () => {
  it("should set user and token when login succeeds", () => {
    // arrange, act, assert
  });
});
```

---

## Linting & Formatage

```bash
# Frontend
cd frontend && npm run lint     # ESLint + Next.js

# Backend
cd backend && go vet ./...      # lint Go
cd backend && gofmt -w .        # formatage Go
```

---

## Setup environnement développeur

```bash
# 1. Cloner
git clone <repo> && cd stratt

# 2. Setup (copie .env, installe deps frontend)
make setup

# 3. Variables d'environnement
# Éditez .env si nécessaire (JWT_SECRET obligatoire en prod)

# 4. Démarrer l'infra locale
make up-infra         # postgres + redis + minio + meilisearch

# 5. Télécharger les dépendances Go
cd backend && go mod tidy

# 6. Seeding (permissions, modules, admin user)
make seed

# 7. Lancer en mode développement
make dev              # API :8080 + Frontend :3000
```

L'environnement est prêt. Accès sur http://localhost:3000.  
Login : `admin@stratt.io` / `admin1234`

---

## CI/CD

### Pull Request
- Lint Go (`go vet`) + Next.js (`npm run lint`)
- Tests unitaires + intégration Go
- Build Docker (dry-run)

### Merge sur `develop`
- Build + push image Docker → registry
- Deploy sur environnement staging

### Tag `v*` sur `main`
- Deploy sur production
- Notification Slack

---

## Commandes Makefile

```bash
make help           # Affiche toutes les commandes disponibles
make setup          # Premier lancement (copie .env, installe deps)
make up             # Lance toute la stack Docker
make up-infra       # Lance uniquement l'infra (postgres, redis, minio, meilisearch)
make down           # Stoppe les conteneurs
make dev            # Lance API Go + Frontend Next.js en parallèle
make dev-api        # Lance uniquement l'API Go
make dev-frontend   # Lance uniquement le frontend
make seed           # Peuple la DB (permissions, modules, admin)
make build          # Build de production (backend + frontend)
make test           # Lance les tests Go
make lint           # Lint Go + Next.js
make clean          # Supprime les artefacts de build
```
