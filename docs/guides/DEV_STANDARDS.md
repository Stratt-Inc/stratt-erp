# DEV STANDARDS — Axiora

---

## Stack & tooling

| Outil | Version | Usage |
|-------|---------|-------|
| Node.js | ≥ 20 LTS | Runtime JavaScript (frontend) |
| npm | ≥ 10 | Package manager frontend |
| Go | 1.23 | Backend runtime |
| Fiber v2 | 2.52 | Framework HTTP Go |
| GORM | 1.25 | ORM Go (PostgreSQL) |
| Next.js | 15 | Framework React (App Router) |
| TanStack Query | 5.x | Data fetching / caching |
| Zustand | 5.x | State management |
| Tailwind CSS | 3.4 | Styling utilitaire |
| Radix UI | latest | Composants accessibles (via ShadCN) |
| Docker | latest | Conteneurisation |
| Docker Compose | latest | Orchestration locale |

---

## Architecture Decision Records (ADR)

### ADR-001 — Go + Fiber v2 pour le backend

**Décision** : Go avec Fiber v2 plutôt que Gin, Node.js ou Python.

**Justification** :
- Performance native : P99 < 20ms pour les endpoints CRUD
- Fiber : API express-like, familière, excellent middleware ecosystem
- Goroutines : gestion native de la concurrence pour les workers Asynq
- Typage fort : refactoring sûr, pas d'erreur runtime sur les types
- Binaire unique : déploiement simplifié (~10 MB)
- GORM : ORM mature avec AutoMigrate, relations, soft deletes

**Alternative rejetée** : Gin (API moins ergonomique), Node.js/Fastify (performance sous charge), Python (trop lent)

---

### ADR-002 — Isolation multi-tenant par tenant_id

**Décision** : Toutes les tables métier contiennent `tenant_id UUID` filtrés dans les handlers.

**Justification** :
- Simplicité opérationnelle : une seule base de données
- Pas de complexité RLS à gérer côté DB
- Filtrage applicatif via GORM : `db.Where("tenant_id = ?", orgID)`
- Migrations : une seule migration à appliquer
- Flexibilité : facile à migrer vers RLS PostgreSQL si besoin

**Contrainte** : chaque handler de module **doit** filtrer par `tenant_id` — vérifié en code review.

---

### ADR-003 — JWT propre plutôt que solution externe

**Décision** : Implémentation JWT maison (golang-jwt) plutôt que Stack Auth, Auth0 ou Supabase Auth.

**Justification** :
- Contrôle total sur le flux d'authentification
- Pas de dépendance externe pour le login/signup
- Access token (15 min) + refresh token (30 jours) en DB
- Rotation de refresh token intégrée
- Middleware Fiber personnalisé

---

### ADR-004 — Next.js 15 avec App Router

**Décision** : Next.js 15 App Router + Zustand + TanStack Query.

**Justification** :
- App Router : layouts imbriqués, route groups `(auth)` et `(app)`
- Zustand : store léger et persisté (auth state, current org)
- TanStack Query : cache, revalidation, optimistic updates
- Radix UI : composants accessibles, personnalisables via Tailwind
- Pas de SSR complexe nécessaire : SPA-like avec fetch côté client

---

### ADR-005 — Modules ERP isolés

**Décision** : Chaque module ERP dans `backend/modules/<name>/` avec models, handler, routes.

**Justification** :
- Isolation : un module ne dépend pas d'un autre
- Activable/désactivable par organisation via la table `organization_modules`
- Ajout d'un nouveau module = un nouveau package Go + routes dans `main.go`
- Chaque module gère ses propres entités et ses propres handlers

---

## Qualité du code

### Couverture de tests

| Couche | Type | Cible |
|--------|------|-------|
| Services (Go) | Unit | ≥ 80% |
| Handlers (Go) | Integration | ≥ 70% |
| Middleware (Go) | Unit | ≥ 90% |
| Components (React) | Unit | ≥ 70% |
| Store (Zustand) | Unit | ≥ 80% |
| E2E | Playwright | parcours clés |

### Interdictions formelles

```go
// ❌ INTERDIT : panic en dehors de l'init
panic("something went wrong")

// ❌ INTERDIT : ignorer les erreurs
result, _ := someOperation()

// ❌ INTERDIT : requêtes sans tenant_id dans les modules
db.Find(&contacts) // manque .Where("tenant_id = ?", orgID)

// ❌ INTERDIT : SQL brut non paramétré
db.Exec("SELECT * FROM users WHERE id = " + userID)
```

```typescript
// ❌ INTERDIT : any implicite ou explicite
function process(data: any): any { ... }

// ❌ INTERDIT : assertions non-null sans justification
const user = getUser()!;

// ❌ INTERDIT : console.log en production
console.log("debug", data);

// ❌ INTERDIT : secrets en dur
const API_KEY = "sk-...";
```

---

## Performance

### Frontend

- Code splitting : `dynamic()` pour les composants lourds
- TanStack Query : `staleTime` configuré selon la fréquence de mise à jour des données
- Client API typé : `lib/api.ts` avec gestion d'erreurs centralisée
- Zustand persist : state auth/org persisté en localStorage

### Backend (Go)

- Pagination obligatoire sur toutes les listes
- Index PostgreSQL : sur `tenant_id`, colonnes filtrées, clés étrangères
- Pool de connexions DB configuré via GORM
- Timeouts : 30s max pour les handlers HTTP
- Workers Asynq : retry avec backoff exponentiel

---

## Sécurité — Checklist obligatoire

Avant chaque merge de feature :

- [ ] Tous les inputs utilisateur validés côté handler
- [ ] Requêtes DB paramétrées (GORM, jamais de string concatenation)
- [ ] CORS configuré pour `FRONTEND_URL` uniquement
- [ ] Authentification vérifiée sur tous les endpoints protégés
- [ ] `tenant_id` filtré sur toutes les requêtes modules
- [ ] Aucune donnée sensible dans les logs
- [ ] Fichiers uploadés : type MIME validé, taille limitée
- [ ] Variables d'environnement : pas de secret en dur

---

## Variables d'environnement

| Variable | Requis | Description |
|----------|--------|-------------|
| `DATABASE_URL` | ✅ | URL de connexion PostgreSQL |
| `JWT_SECRET` | ✅ | Clé secrète pour signer les JWT |
| `PORT` | — | Port API (défaut : 8080) |
| `APP_ENV` | — | Environnement (défaut : development) |
| `REDIS_URL` | — | URL Redis (défaut : redis://localhost:6379) |
| `MEILISEARCH_URL` | — | URL Meilisearch (défaut : http://localhost:7700) |
| `S3_ENDPOINT` | — | Endpoint MinIO/S3 (défaut : http://localhost:9000) |
| `S3_ACCESS_KEY` | — | Clé d'accès S3 |
| `S3_SECRET_KEY` | — | Clé secrète S3 |
| `SMTP_HOST` | — | Serveur SMTP |
| `SMTP_PORT` | — | Port SMTP (défaut : 587) |
| `FRONTEND_URL` | — | URL frontend pour CORS (défaut : http://localhost:3000) |
