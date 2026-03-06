# ARCHITECTURE — Axiora

> Clean Architecture appliquée à un SaaS de commande publique multi-tenant

---

## Vue d'ensemble

Axiora suit une **Clean Architecture** stricte : les règles métier ne dépendent jamais des frameworks ou de l'infrastructure. Chaque couche ne connaît que la couche interne.

```
┌─────────────────────────────────────────────────────────────┐
│                      EXTERNAL WORLD                         │
│         (Browser, Mobile, Progiciels financiers)            │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP / WebSocket
┌──────────────────────▼──────────────────────────────────────┐
│                   PRESENTATION LAYER                        │
│   apps/web (Next.js 15)     │   apps/api (Go / Gin)        │
│   - Server Components        │   - HTTP Handlers             │
│   - Client Components        │   - Middleware (auth, CORS)   │
│   - React Query / SWR        │   - Request validation        │
└──────────────────────┬──────────────────────────────────────┘
                       │ Use Case calls
┌──────────────────────▼──────────────────────────────────────┐
│                  APPLICATION LAYER                          │
│              apps/api/internal/usecases/                    │
│   - NomenclatureUseCase                                     │
│   - CartographieUseCase                                     │
│   - PlanificationUseCase                                    │
│   - ExportUseCase                                           │
│   - AlerteUseCase                                           │
└──────────────────────┬──────────────────────────────────────┘
                       │ Domain interfaces
┌──────────────────────▼──────────────────────────────────────┐
│                    DOMAIN LAYER                             │
│              apps/api/internal/domain/                      │
│   - Entities (Marché, Nomenclature, Code, Alerte...)       │
│   - Value Objects (Montant, Seuil, Procédure...)           │
│   - Domain Services (SeuilComputation, FractionnementCheck) │
│   - Repository Interfaces                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │ Implementations
┌──────────────────────▼──────────────────────────────────────┐
│                INFRASTRUCTURE LAYER                         │
│   - PostgreSQL / GORM repositories                          │
│   - Redis cache                                             │
│   - Anthropic Claude client                                 │
│   - PDF/XLSX generators                                     │
│   - File storage (S3-compatible)                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Structure du monorepo

```
axiora/
│
├── apps/
│   ├── web/                          # Frontend Next.js 15
│   │   ├── app/                      # App Router (pages, layouts)
│   │   ├── components/               # Composants métier (réutilisent packages/ui)
│   │   ├── lib/                      # API client, utils, hooks
│   │   └── public/                   # Assets statiques
│   │
│   └── api/                          # Backend Go
│       ├── cmd/
│       │   ├── api/main.go           # Entrypoint HTTP server
│       │   └── migrate/main.go       # Entrypoint migrations
│       └── internal/
│           ├── domain/               # Entités + interfaces (pure Go)
│           ├── usecases/             # Logique applicative
│           ├── handlers/             # HTTP handlers (Gin)
│           ├── middleware/           # Auth, CORS, rate limiting
│           ├── repository/           # Implémentations PostgreSQL
│           └── infrastructure/       # Services externes (Redis, S3, AI)
│
├── packages/
│   ├── ui/                           # Design system Axiora
│   │   ├── src/components/           # Composants ShadCN customisés
│   │   ├── src/tokens/               # Palette, typography, spacing
│   │   └── src/hooks/                # Hooks UI partagés
│   │
│   ├── core/                         # Types TypeScript partagés
│   │   ├── src/types/                # Interfaces métier (Marché, Code, etc.)
│   │   ├── src/constants/            # Seuils CCP, codes procédure
│   │   └── src/validators/           # Zod schemas partagés
│   │
│   ├── database/                     # Schéma & migrations
│   │   ├── schema/                   # Schéma Drizzle (référence)
│   │   ├── migrations/               # SQL migrations versionnées
│   │   └── seeds/                    # Données de test
│   │
│   ├── auth/                         # Wrapper Stack Auth
│   │   ├── src/client.ts             # Client-side auth hooks
│   │   └── src/server.ts             # Server-side session validation
│   │
│   ├── config/                       # Configuration centralisée
│   │   ├── src/env.ts                # Validation env (Zod)
│   │   └── src/constants.ts          # Constantes métier CCP
│   │
│   └── logger/                       # Logger structuré
│       └── src/index.ts              # Winston (web) / Zap (api)
│
├── services/
│   ├── ai/                           # Agents IA
│   │   ├── agents/
│   │   │   ├── nomenclature.ts       # Agent classification automatique
│   │   │   ├── analyse.ts            # Agent analyse cartographique
│   │   │   ├── conformite.ts         # Agent vérification réglementaire
│   │   │   └── generation.ts         # Agent génération documentaire
│   │   └── prompts/                  # System prompts versionnés
│   │
│   ├── generation/                   # Génération de documents
│   │   ├── pdf/                      # Puppeteer → PDF institutionnel
│   │   ├── xlsx/                     # ExcelJS → XLSX récapitulatif
│   │   └── templates/                # Templates Handlebars
│   │
│   └── processing/                   # Pipeline de traitement
│       ├── importers/                # Parsers CSV/XLSX dépenses mandatées
│       ├── normalizers/              # Normalisation des données
│       └── classifiers/              # Classification automatique IA
│
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile.api            # Go multi-stage build
│   │   ├── Dockerfile.web            # Next.js multi-stage build
│   │   └── Dockerfile.worker         # Worker jobs async
│   ├── ci/
│   │   ├── test.yml                  # Tests sur PR
│   │   ├── build.yml                 # Build & push Docker
│   │   └── deploy.yml                # Deploy sur Fly.io
│   └── scripts/
│       ├── setup.sh                  # Setup environnement dev
│       └── seed.sh                   # Seeding base de données
│
└── docs/
    ├── PRODUCT_VISION.md
    ├── ROADMAP.md
    ├── API.md
    ├── USER_PERSONAS.md
    └── DEV_STANDARDS.md
```

---

## Modèle de données — Entités clés

```sql
-- Organisation (tenant SaaS)
organisations
  id UUID PK
  name VARCHAR
  slug VARCHAR UNIQUE
  plan ENUM(starter, pro, enterprise)
  created_at TIMESTAMPTZ

-- Utilisateur
users
  id UUID PK
  org_id UUID FK → organisations
  email VARCHAR UNIQUE
  role ENUM(admin, acheteur, lecteur)
  created_at TIMESTAMPTZ

-- Nomenclature (arborescence)
nomenclature_codes
  id UUID PK
  org_id UUID FK
  code VARCHAR (ex: "02.01")
  label VARCHAR
  level INT (0=famille, 1=sous-famille, 2=code)
  parent_id UUID FK → self
  seuil_procédure DECIMAL
  is_active BOOLEAN
  version INT
  created_by UUID FK → users

-- Marché / Procédure
marches
  id UUID PK
  org_id UUID FK
  reference VARCHAR (ex: M2026-001)
  objet TEXT
  service VARCHAR
  montant_previsionnel DECIMAL
  procedure ENUM(mapa_40k, mapa_90k, ao_ouvert, ao_restreint, accord_cadre, negociee)
  code_id UUID FK → nomenclature_codes
  date_echeance DATE
  statut ENUM(planifie, en_cours, alerte, cloture)
  priorite ENUM(normale, haute, critique)
  charge_jh INT
  created_by UUID FK → users

-- Dépense mandatée (import)
depenses
  id UUID PK
  org_id UUID FK
  exercice INT
  montant DECIMAL
  fournisseur VARCHAR
  libelle TEXT
  code_id UUID FK → nomenclature_codes  -- nullable avant classification
  direction VARCHAR
  date_mandat DATE
  source ENUM(import_csv, import_xlsx, api_financier, manuel)

-- Alerte réglementaire
alertes
  id UUID PK
  org_id UUID FK
  type ENUM(fractionnement, seuil_depasse, renouvellement, non_classe, concentration)
  severity ENUM(critique, haute, moyenne, info)
  message TEXT
  marche_id UUID FK nullable
  code_id UUID FK nullable
  resolved_at TIMESTAMPTZ nullable
  created_at TIMESTAMPTZ

-- Document généré
documents
  id UUID PK
  org_id UUID FK
  type ENUM(pdf_institutionnel, xlsx_recap, format_progiciel)
  filename VARCHAR
  storage_key VARCHAR
  size_bytes INT
  generated_by UUID FK → users
  sections JSONB
  created_at TIMESTAMPTZ

-- Audit log
audit_logs
  id UUID PK
  org_id UUID FK
  user_id UUID FK
  action VARCHAR
  entity_type VARCHAR
  entity_id UUID
  payload JSONB
  created_at TIMESTAMPTZ
```

---

## Flux de données

### Import & Classification automatique

```
[Fichier CSV/XLSX]
      │
      ▼
[services/processing/importers]  → Parse, validation format
      │
      ▼
[services/processing/normalizers] → Normalisation montants, dates, libellés
      │
      ▼
[services/ai/agents/nomenclature] → Claude : classification IA par code
      │
      ├──► [Confiance > 90%] → Auto-affectation code_id
      └──► [Confiance < 90%] → Queue révision manuelle
      │
      ▼
[PostgreSQL: depenses table]
      │
      ▼
[services/ai/agents/conformite] → Détection fractionnement, seuils
      │
      ▼
[PostgreSQL: alertes table] → Notification temps réel WebSocket
```

### Génération documentaire

```
[User: POST /api/exports]
      │
      ▼
[ExportUseCase] → Validation sections, métadonnées
      │
      ▼
[Redis Queue: job_generation] → Async (Asynq worker)
      │
      ▼
[services/ai/agents/generation] → Claude : rédaction narrative sections
      │
      ▼
[services/generation/pdf] → Puppeteer + template Handlebars
      │
      ▼
[S3 Storage] → Upload PDF/XLSX
      │
      ▼
[WebSocket] → Notification "document prêt" → URL signée
```

---

## Multi-tenancy

Axiora utilise un modèle **Row-Level Security (RLS)** PostgreSQL.

- Chaque table contient `org_id UUID NOT NULL`
- RLS activé : `SET app.current_org = 'uuid'` en début de transaction
- Policy : `USING (org_id = current_setting('app.current_org')::uuid)`
- Isolation garantie : aucune donnée ne peut fuiter d'un tenant à l'autre

---

## Dépendances entre packages

```
apps/web  →  packages/ui, packages/core, packages/auth, packages/config
apps/api  →  packages/core, packages/config, packages/logger
services/* → packages/core, packages/config, packages/logger
packages/ui → packages/core
packages/auth → packages/config
```

**Règle** : jamais de dépendance circulaire. `packages/core` ne dépend de rien.

---

## Sécurité

- **Auth** : JWT (access 15min) + Refresh token (30j) via Stack Auth
- **RBAC** : `admin` > `acheteur` > `lecteur` avec permissions granulaires
- **Rate limiting** : 100 req/min par IP, 1000 req/min par org (Redis)
- **Input validation** : Zod (frontend) + Go validator (backend), pas de confiance aveugle
- **SQL injection** : GORM parameterized queries uniquement
- **XSS** : CSP strict, DOMPurify sur contenus importés
- **Secrets** : jamais en clair, toujours via variables d'environnement validées
- **Audit** : toute mutation loggée dans `audit_logs`
