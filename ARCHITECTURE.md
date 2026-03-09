# ARCHITECTURE — Axiora

> ERP SaaS modulaire et multi-tenant pour entreprises modernes

---

## Vue d'ensemble

Axiora suit une architecture **modulaire en couches** avec séparation stricte entre le core platform (auth, RBAC, organisations) et les modules ERP métier (CRM, Comptabilité, Facturation, etc.). Chaque module est isolé et activable par organisation.

```
┌─────────────────────────────────────────────────────────────┐
│                      EXTERNAL WORLD                         │
│              (Browser, Applications tierces)                 │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP REST
┌──────────────────────▼──────────────────────────────────────┐
│                   PRESENTATION LAYER                        │
│   frontend/ (Next.js 15)    │   backend/ (Go / Gin)        │
│   - App Router               │   - HTTP Handlers             │
│   - TanStack Query           │   - Middleware (auth, org,    │
│   - Zustand (state)          │     permissions)              │
│   - Radix UI + Tailwind      │   - Request validation        │
└──────────────────────┬──────────────────────────────────────┘
                       │ Service calls
┌──────────────────────▼──────────────────────────────────────┐
│                  APPLICATION LAYER                          │
│              backend/internal/                              │
│   - auth.Service     (JWT, sessions, signup/login)          │
│   - organization.Service (multi-tenant, membres)            │
│   - rbac.Service     (rôles, permissions, vérification)     │
│   - audit.Service    (logs d'audit fire & forget)           │
│   - module.Handler   (activation/désactivation modules)     │
└──────────────────────┬──────────────────────────────────────┘
                       │ Models / DB
┌──────────────────────▼──────────────────────────────────────┐
│                    DOMAIN LAYER                             │
│              backend/internal/models/                       │
│   - User, Session, Invite                                   │
│   - Organization, OrganizationMember                        │
│   - Role, Permission, UserRole                              │
│   - Module, OrganizationModule                              │
│   - AuditLog                                                │
└──────────────────────┬──────────────────────────────────────┘
                       │ Persistence
┌──────────────────────▼──────────────────────────────────────┐
│                INFRASTRUCTURE LAYER                         │
│   - PostgreSQL 16 / GORM (ORM + AutoMigrate)               │
│   - Redis 7 (cache + job queue via Asynq)                   │
│   - MinIO / S3-compatible (stockage fichiers)               │
│   - Meilisearch v1.11 (recherche full-text)                 │
│   - SMTP (emails transactionnels)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Structure du projet

```
axiora/
│
├── backend/                          # API Go / Gin
│   ├── cmd/
│   │   ├── api/main.go               # Point d'entrée : Gin, routes, DI
│   │   └── worker/                   # Point d'entrée worker Asynq (async jobs)
│   ├── internal/
│   │   ├── config/config.go          # Variables d'environnement (godotenv)
│   │   ├── database/
│   │   │   ├── postgres.go           # Connexion PostgreSQL + GORM AutoMigrate
│   │   │   └── redis.go              # Connexion Redis
│   │   ├── models/                   # Modèles GORM partagés (entités core)
│   │   │   ├── base.go               # Base model (UUID, timestamps, soft delete)
│   │   │   ├── user.go               # User, Session, Invite
│   │   │   ├── organization.go       # Organization, OrganizationMember
│   │   │   ├── rbac.go               # Role, Permission, UserRole
│   │   │   ├── module.go             # Module, OrganizationModule
│   │   │   └── audit.go              # AuditLog
│   │   ├── auth/                     # Service auth (JWT, signup, login, refresh, logout)
│   │   │   ├── handler.go            # HTTP handlers auth
│   │   │   ├── service.go            # Logique métier auth + JWT
│   │   │   └── repository.go         # Accès DB auth
│   │   ├── organization/             # Service organisations multi-tenant
│   │   │   ├── handler.go
│   │   │   ├── service.go
│   │   │   └── repository.go
│   │   ├── rbac/                     # Service RBAC (rôles, permissions)
│   │   │   ├── handler.go
│   │   │   ├── service.go
│   │   │   └── repository.go
│   │   ├── audit/service.go          # Service d'audit (fire & forget)
│   │   └── module/handler.go         # Activation/désactivation modules
│   ├── middleware/                    # Middleware Gin
│   │   ├── auth.go                   # RequireAuth (JWT Bearer)
│   │   ├── organization.go           # RequireOrganization (X-Organization-Id)
│   │   └── permission.go             # RequirePermission / RequireAnyPermission
│   ├── modules/                      # Modules ERP isolés
│   │   ├── crm/                      # Contacts, Leads, Deals, Activities
│   │   ├── accounting/               # Comptes, Transactions
│   │   ├── billing/                  # Factures, Items
│   │   ├── inventory/                # Produits, Mouvements de stock
│   │   ├── hr/                       # Employés, Congés
│   │   ├── procurement/              # Commandes d'achat, Items
│   │   └── analytics/               # Vue synthétique cross-modules
│   ├── migrations/001_schema.sql     # Schéma SQL complet
│   └── seed/main.go                  # Données initiales (permissions, modules, admin)
│
├── frontend/                         # Next.js 15 App Router
│   ├── app/
│   │   ├── layout.tsx                # Layout racine + Providers
│   │   ├── page.tsx                  # Page d'accueil
│   │   ├── globals.css               # Styles globaux Tailwind
│   │   ├── (auth)/                   # Routes publiques
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   └── (app)/                    # Routes authentifiées
│   │       ├── layout.tsx
│   │       ├── dashboard/page.tsx
│   │       ├── organizations/
│   │       └── settings/page.tsx
│   ├── components/
│   │   ├── AppShell.tsx              # Shell applicatif
│   │   ├── Sidebar.tsx               # Navigation latérale
│   │   ├── Providers.tsx             # React Query + Zustand providers
│   │   └── ui/                       # Composants Radix/ShadCN
│   ├── lib/api.ts                    # Client HTTP typé (fetch wrapper)
│   └── store/auth.ts                 # Store Zustand (user, token, org) + persist
│
├── workers/                          # Jobs asynchrones (Asynq / Redis)
│   ├── email.go                      # Envoi d'emails (SMTP)
│   ├── notifications.go              # Notifications en temps réel
│   └── reports.go                    # Génération de rapports (PDF/Excel)
│
├── infra/
│   ├── docker/
│   │   ├── Dockerfile.backend        # Go multi-stage build
│   │   └── Dockerfile.frontend       # Next.js multi-stage build
│   └── postgres/init.sql             # Extensions (uuid-ossp, pg_trgm)
│
├── docs/                             # Documentation projet
│   ├── API.md                        # Documentation API REST
│   ├── PRODUCT_VISION.md             # Vision produit et use cases
│   ├── ROADMAP.md                    # Roadmap de développement
│   ├── DEV_STANDARDS.md              # Standards de code et ADR
│   └── USER_PERSONAS.md              # Personas utilisateurs
│
├── docker-compose.yml                # Stack complète (6 services)
├── Makefile                          # Commandes dev (setup, up, dev, seed, build, test)
├── ARCHITECTURE.md                   # Ce fichier
├── CONTRIBUTING.md                   # Guide de contribution
├── AGENTS.md                         # Description des agents IA (roadmap)
└── README.md                         # Documentation principale
```

---

## Modèle de données

### Entités Core (backend/internal/models/)

```sql
-- Utilisateur
users
  id              UUID PK
  email           TEXT UNIQUE NOT NULL
  name            TEXT NOT NULL
  password_hash   TEXT NOT NULL
  avatar_url      TEXT
  email_verified  BOOLEAN DEFAULT false
  created_at / updated_at / deleted_at

-- Sessions JWT
sessions
  id              UUID PK
  user_id         UUID FK → users
  refresh_token   TEXT UNIQUE NOT NULL
  user_agent      TEXT
  ip_address      TEXT
  expires_at      TIMESTAMPTZ

-- Organisations (tenant)
organizations
  id              UUID PK
  name            TEXT NOT NULL
  slug            TEXT UNIQUE NOT NULL
  logo_url        TEXT
  plan            TEXT DEFAULT 'free'    -- free, starter, pro, enterprise

-- Membres d'organisation
organization_members
  id              UUID PK
  organization_id UUID FK → organizations
  user_id         UUID FK → users
  role_id         UUID FK → roles (nullable)
  status          TEXT DEFAULT 'active'  -- active, suspended
  UNIQUE(organization_id, user_id)

-- Invitations
invites
  id              UUID PK
  organization_id UUID FK → organizations
  email           TEXT NOT NULL
  token           TEXT UNIQUE NOT NULL
  role_id         UUID FK → roles (nullable)
  expires_at      TIMESTAMPTZ
  accepted_at     TIMESTAMPTZ

-- Rôles RBAC
roles
  id              UUID PK
  organization_id UUID FK → organizations (nullable = system-wide)
  name            TEXT NOT NULL
  description     TEXT
  is_system       BOOLEAN DEFAULT false

-- Permissions granulaires
permissions
  id              SERIAL PK
  name            TEXT UNIQUE NOT NULL   -- ex: crm.read, admin.manage
  description     TEXT
  module          TEXT                   -- ex: crm, accounting, admin
  action          TEXT                   -- ex: read, write, delete, manage

-- Jointure rôle ↔ permissions (many-to-many)
role_permissions
  role_id         UUID FK → roles
  permission_id   INT FK → permissions

-- Jointure user ↔ organization ↔ role
user_roles
  user_id         UUID FK → users
  organization_id UUID FK → organizations
  role_id         UUID FK → roles

-- Modules ERP
modules
  id              TEXT PK               -- crm, accounting, billing, ...
  name            TEXT NOT NULL
  description     TEXT
  icon            TEXT
  color           TEXT
  is_core         BOOLEAN DEFAULT false

-- Modules activés par organisation
organization_modules
  organization_id UUID FK → organizations
  module_id       TEXT FK → modules
  enabled_at      TIMESTAMPTZ
  settings        JSONB

-- Audit
audit_logs
  id              UUID PK
  organization_id UUID FK (nullable)
  user_id         UUID FK (nullable)
  action          TEXT NOT NULL          -- user.login, org.created, role.updated
  resource_type   TEXT                   -- user, organization, role, module
  resource_id     TEXT
  metadata        JSONB
  ip_address      TEXT
  user_agent      TEXT
  created_at      TIMESTAMPTZ
```

### Entités Modules ERP (backend/modules/)

Chaque module utilise `tenant_id UUID` pour l'isolation multi-tenant.

| Module | Tables | Colonnes clés |
|--------|--------|---------------|
| **CRM** | `contacts`, `leads`, `deals`, `activities` | type, status, stage, value, assigned_to |
| **Comptabilité** | `accounts`, `transactions` | code, type, balance, amount, date |
| **Facturation** | `invoices`, `invoice_items` | number, status, total, tax_rate |
| **Inventaire** | `products`, `stock_movements` | sku, stock, reorder_at, quantity, type |
| **RH** | `employees`, `leave_requests` | department, job_title, salary, status |
| **Achats** | `purchase_orders`, `purchase_order_items` | number, supplier_id, status, total |

---

## Multi-tenancy

Axiora utilise un modèle **tenant_id par table**. Toutes les tables métier contiennent `tenant_id UUID NOT NULL` référençant `organizations(id)`.

```
Request
  → JWT Bearer valid (middleware/auth.go)
  → X-Organization-Id header parsé (middleware/organization.go)
  → User est membre de l'organisation
  → Permission vérifiée via RBAC (middleware/permission.go)
  → Handler avec org_id dans le contexte Gin
```

Chaque handler filtre les requêtes GORM par `tenant_id` pour garantir l'isolation.

---

## RBAC (Role-Based Access Control)

```
Permissions système (seeded) :
  crm.read, crm.write, crm.delete
  accounting.read, accounting.write
  billing.read, billing.write
  inventory.read, inventory.write
  hr.read, hr.write
  procurement.read, procurement.write
  analytics.read
  admin.manage

Rôles (par organisation, personnalisables) :
  Admin     → toutes les permissions
  Manager   → permissions read/write
  Viewer    → permissions read uniquement
  Custom    → combinaison libre

UserRoles (table de jointure) :
  user × organization × role
```

**Chaîne middleware** :
```
RequireAuth → RequireOrganization → RequirePermission("module.action")
```

---

## Modules ERP

Les modules sont des packages Go isolés dans `backend/modules/`. Chaque module contient :
- `models.go` — Entités GORM avec `TenantID`
- `handler.go` — HTTP handlers Gin
- `routes.go` — Fonction `RegisterRoutes(router, handler)`
- `repository.go` — Accès DB (optionnel, certains utilisent le handler directement)

| Module | ID | Entités | Permissions |
|--------|----|---------|-------------|
| CRM | `crm` | Contact, Lead, Deal, Activity | crm.read / crm.write / crm.delete |
| Comptabilité | `accounting` | Account, Transaction | accounting.read / accounting.write |
| Facturation | `billing` | Invoice, InvoiceItem | billing.read / billing.write |
| Inventaire | `inventory` | Product, StockMovement | inventory.read / inventory.write |
| RH | `hr` | Employee, LeaveRequest | hr.read / hr.write |
| Achats | `procurement` | PurchaseOrder, PurchaseOrderItem | procurement.read / procurement.write |
| Analytics | `analytics` | Vue synthétique cross-modules | analytics.read |

Les modules sont activables/désactivables par organisation via `POST /api/v1/modules/:id/enable|disable`.

---

## Authentification

- **JWT** : access token (15 min) + refresh token (30 jours)
- **Transport** : Bearer token dans le header `Authorization`
- **Sessions** : stockées en DB (table `sessions`), rotation du refresh token
- **Mots de passe** : hachés avec bcrypt
- **Flux** : signup → login → access_token + refresh_token → refresh → logout

---

## Workers (Jobs asynchrones)

Les workers utilisent **Asynq** (Redis-backed) pour traiter les tâches asynchrones :

| Worker | Type de tâche | Description |
|--------|---------------|-------------|
| EmailWorker | `email:send` | Envoi d'emails transactionnels via SMTP |
| NotificationWorker | `notification:send` | Notifications en temps réel |
| ReportWorker | `report:generate` | Génération de rapports (PDF/Excel) |

Les workers sont démarrés par `cmd/worker/main.go` et communiquent via la queue Redis.

---

## Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Frontend | Next.js (App Router) | 15 |
| UI | Radix UI + Tailwind CSS + Framer Motion | — |
| State management | Zustand + TanStack Query | 5.x / 5.x |
| Backend | Go + Gin | 1.23 / 1.x |
| ORM | GORM | 1.25 |
| Auth | JWT (golang-jwt/jwt/v5) | 5.2 |
| Base de données | PostgreSQL | 16 |
| Cache / Queue | Redis + Asynq | 7 / 0.24 |
| Recherche | Meilisearch | 1.11 |
| Stockage | MinIO (dev) / S3 compatible (prod) | — |
| Infrastructure | Docker, Docker Compose | — |

---

## Infrastructure Docker

6 services orchestrés via `docker-compose.yml` :

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │    Redis     │  │    MinIO     │
│    :5432     │  │    :6379     │  │  :9000/:9001 │
└──────┬───────┘  └──────┬───────┘  └──────────────┘
       │                 │
┌──────▼─────────────────▼───────┐  ┌──────────────┐
│          API Go/Gin            │  │ Meilisearch  │
│           :8080                │  │    :7700     │
└──────────────┬─────────────────┘  └──────────────┘
               │
┌──────────────▼─────────────────┐
│      Frontend Next.js          │
│           :3000                │
└────────────────────────────────┘
```

---

## Sécurité

- **Auth** : JWT access token (15 min) + refresh token (30 jours) avec rotation
- **RBAC** : permissions granulaires par module et action, vérifiées côté middleware
- **Multi-tenant** : isolation par `tenant_id` sur toutes les tables métier
- **Input validation** : validation côté handler Go
- **SQL injection** : GORM parameterized queries uniquement
- **CORS** : configuré pour n'accepter que le `FRONTEND_URL`
- **Secrets** : variables d'environnement, jamais en clair dans le code
- **Audit** : toute action significative loggée dans `audit_logs`
- **Mots de passe** : hachés avec bcrypt (coût par défaut)
