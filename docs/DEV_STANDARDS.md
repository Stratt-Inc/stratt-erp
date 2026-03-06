# DEV STANDARDS — Axiora

---

## Stack & tooling

| Outil | Version | Usage |
|-------|---------|-------|
| Node.js | ≥ 20 LTS | Runtime JavaScript |
| pnpm | ≥ 9 | Package manager (workspace) |
| Turborepo | latest | Monorepo build orchestration |
| Go | 1.23 | Backend runtime |
| golangci-lint | 1.57 | Linter Go |
| ESLint | 9.x | Linter TypeScript |
| Prettier | 3.x | Formatter TypeScript/CSS |
| Husky | 9.x | Git hooks |
| lint-staged | 15.x | Run linters on staged files |
| Vitest | 2.x | Tests unitaires TypeScript |
| Playwright | 1.x | Tests E2E |

---

## Architecture Decision Records (ADR)

### ADR-001 — Go pour le backend

**Décision** : Go (Gin framework) plutôt que Node.js ou Python.

**Justification** :
- Performance native : P99 < 20ms sans optimisation pour les endpoints CRUD
- Goroutines : gestion native de la concurrence pour les jobs d'import (milliers de lignes)
- Typage fort : refactoring sûr, aucun runtime error sur les types
- Binaire unique : déploiement simplifié (un seul container léger, ~10 MB)
- Écosystème mature pour API REST (Gin, GORM, Asynq)

**Alternative rejetée** : Node.js/Fastify (performances moindres sous charge), Python (trop lent pour le traitement de données en volume)

---

### ADR-002 — PostgreSQL avec RLS pour le multi-tenant

**Décision** : Une seule base de données avec Row-Level Security (RLS) plutôt que DB-per-tenant ou schema-per-tenant.

**Justification** :
- Simplicité opérationnelle : une seule instance à gérer
- RLS natif PostgreSQL : isolation garantie au niveau base de données
- Coût : pas de multiplication des connexions DB
- Migrations : une seule migration à appliquer

**Contrainte** : `SET app.current_org = '<uuid>'` doit être appelé en début de chaque transaction.

---

### ADR-003 — Claude Anthropic pour les agents IA

**Décision** : Claude (Anthropic) plutôt que GPT-4o, Mistral ou solution locale.

**Justification** :
- Qualité de raisonnement sur des tâches complexes (analyse juridique, rédaction institutionnelle)
- Contexte long (200k tokens) : nomenclature complète + dépenses dans un seul appel
- Fiabilité : SLA enterprise, GDPR compliant (data processing agreement disponible)
- API stable, SDK Go + TypeScript

**Contrainte** : anonymisation des données avant injection dans les prompts.

---

### ADR-004 — Next.js 15 avec App Router

**Décision** : Next.js 15 App Router + React Server Components (RSC).

**Justification** :
- RSC : réduction du bundle JS côté client, amélioration des performances perçues
- SSR : SEO pour les pages publiques (landing page, documentation)
- Streaming : chargement progressif des données lourdes (cartographie, exports)
- Cohérence : même framework pour web et futur mobile (Expo Router)

---

## Qualité du code

### Couverture de tests

| Couche | Type | Cible |
|--------|------|-------|
| Domain (Go) | Unit | ≥ 90% |
| Use Cases (Go) | Unit + Integration | ≥ 80% |
| Handlers (Go) | Integration | ≥ 70% |
| Components (React) | Unit | ≥ 70% |
| Agents IA | Unit (mocked) | ≥ 80% |
| E2E | Playwright | 5 parcours clés |

### Interdictions formelles

```typescript
// ❌ INTERDIT : any implicite ou explicite
function process(data: any): any { ... }

// ❌ INTERDIT : assertions non-null sans justification
const user = getUser()!;

// ❌ INTERDIT : console.log en production
console.log("debug", data);

// ❌ INTERDIT : secrets en dur
const API_KEY = "sk-ant-api03-...";

// ❌ INTERDIT : requêtes SQL manuelles (utiliser GORM)
db.Exec("SELECT * FROM users WHERE org_id = " + orgId)

// ❌ INTERDIT : ignorer les erreurs Go
result, _ := someOperation()
```

---

## Performance

### Frontend

- Images : `next/image` obligatoire (WebP, lazy loading)
- Fonts : `next/font` avec `display: swap`
- Code splitting : `dynamic()` pour les composants lourds (Recharts, PDFViewer)
- React Query : `staleTime: 60_000` pour les données statiques
- Skeleton loaders : obligatoires sur tous les appels API

### Backend (Go)

- Pagination obligatoire sur toutes les listes (max 100 items/page)
- Index PostgreSQL : sur `org_id`, `created_at`, colonnes filtrées
- Connexions DB : pool configuré (max 25 connexions)
- Timeouts : 30s max pour les handlers HTTP, 5min pour les jobs workers
- `EXPLAIN ANALYZE` sur toutes les requêtes complexes avant merge

---

## Sécurité — Checklist obligatoire

Avant chaque merge de feature :

- [ ] Aucune variable d'environnement non validée utilisée
- [ ] Tous les inputs utilisateur validés (Zod / Go validator)
- [ ] Requêtes DB paramétrées (jamais de string concatenation)
- [ ] Headers de sécurité présents (CSP, HSTS, X-Frame-Options)
- [ ] Authentification vérifiée sur TOUS les endpoints protégés
- [ ] RLS activé sur toutes les nouvelles tables
- [ ] Aucune donnée PII dans les logs
- [ ] Fichiers uploadés : type MIME validé, taille limitée (10 MB)
- [ ] Dépendances auditées (`pnpm audit`, `go mod verify`)

---

## Monitoring & Observabilité

### Logs (structurés JSON)

```json
{
  "level": "info",
  "timestamp": "2026-03-06T10:00:00Z",
  "service": "api",
  "org_id": "uuid",
  "user_id": "uuid",
  "trace_id": "uuid",
  "action": "marche.create",
  "duration_ms": 45,
  "status": 201
}
```

- **Pas de PII dans les logs** (emails, noms → remplacés par des IDs)
- **Niveaux** : `debug` (dev uniquement), `info`, `warn`, `error`

### Métriques Prometheus

- `http_request_duration_seconds` (histogram par endpoint)
- `ai_classification_confidence_avg` (qualité des agents)
- `import_rows_processed_total` (volumes traités)
- `active_organisations` (usage SaaS)

### Alertes Sentry

- Error rate > 1% sur 5 minutes → alerte Slack
- P99 latency > 2s → alerte Slack
- Worker job failure rate > 5% → alerte PagerDuty
