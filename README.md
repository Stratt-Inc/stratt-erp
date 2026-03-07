# Axiora — ERP SaaS

Plateforme ERP SaaS modulaire et multi-tenant pour entreprises modernes.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, TanStack Query, Zustand |
| Backend | Go 1.23, Fiber v2, GORM |
| Auth | JWT (access 15min + refresh 30j, httpOnly cookie) |
| Base de données | PostgreSQL 16 |
| Cache / Queue | Redis 7 + Asynq |
| Search | Meilisearch v1.11 |
| Stockage | MinIO (dev) / S3 compatible (prod) |
| Infrastructure | Docker, Docker Compose |

## Architecture

```
axiora/
├── backend/                  # API Go/Fiber
│   ├── cmd/api/main.go       # Point d'entrée — Fiber, routes, DI
│   ├── internal/
│   │   ├── config/           # Variables d'environnement
│   │   ├── database/         # Connexions PostgreSQL + Redis
│   │   ├── models/           # Modèles GORM partagés
│   │   ├── auth/             # JWT, sessions, signup/login/refresh
│   │   ├── organization/     # Gestion organisations multi-tenant
│   │   ├── rbac/             # Rôles, permissions, UserRole
│   │   ├── module/           # Activation/désactivation modules ERP
│   │   └── audit/            # Logs d'audit (fire & forget)
│   ├── middleware/            # RequireAuth, RequireOrganization, RequirePermission
│   ├── modules/              # Modules ERP isolés (Clean Architecture)
│   │   ├── crm/              # Contacts, Leads, Deals, Activities
│   │   ├── accounting/       # Comptes, Transactions
│   │   ├── billing/          # Factures, Items
│   │   ├── inventory/        # Produits, Mouvements de stock
│   │   ├── hr/               # Employés, Congés
│   │   ├── procurement/      # Commandes d'achat
│   │   └── analytics/        # Vue d'ensemble cross-modules
│   ├── migrations/           # SQL migrations (001_schema.sql)
│   └── seed/                 # Données initiales (permissions, modules, admin)
├── frontend/                 # Next.js 15 App Router
│   ├── app/(auth)/           # /login, /signup
│   ├── app/(app)/            # /dashboard, /organizations, /settings
│   ├── components/           # AppShell, Sidebar, Providers
│   ├── store/auth.ts         # Zustand (user, token, org) + persist
│   └── lib/api.ts            # Fetch wrapper typé
├── workers/                  # Jobs async (email, reports, notifications)
├── infra/
│   ├── docker/               # Dockerfile.backend, Dockerfile.frontend
│   └── postgres/             # init.sql (extensions, user)
├── docker-compose.yml        # Stack complète (6 services)
├── .env.example
└── Makefile                  # setup, up, dev, seed, build, test...
```

## Multi-tenant

Chaque **organisation** est isolée. Toutes les tables métier contiennent `tenant_id`.

```
Request → JWT valid → X-Organization-Id valid → user is member → Permission check → Handler
```

## RBAC

```
Permissions système  : crm.read, crm.write, billing.read, admin.manage, ...
Roles (par org)      : Admin, Manager, Viewer, ... (personnalisables)
UserRoles            : user × organization × role (table de jointure)
```

## Modules ERP

| Module | Entités | Permissions |
|--------|---------|-------------|
| CRM | Contact, Lead, Deal, Activity | crm.read/write/delete |
| Comptabilité | Account, Transaction | accounting.read/write |
| Facturation | Invoice, InvoiceItem | billing.read/write |
| Inventaire | Product, StockMovement | inventory.read/write |
| RH | Employee, LeaveRequest | hr.read/write |
| Achats | PurchaseOrder, PurchaseOrderItem | procurement.read/write |
| Analytics | Vue synthétique cross-modules | analytics.read |

## API REST

```
POST   /api/v1/auth/signup
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me

GET    /api/v1/organizations
POST   /api/v1/organizations
GET    /api/v1/organizations/:id/members
DELETE /api/v1/organizations/:id/members/:userId

GET    /api/v1/roles          (X-Organization-Id requis)
POST   /api/v1/roles
PUT    /api/v1/roles/:id
POST   /api/v1/roles/:id/permissions
GET    /api/v1/permissions
POST   /api/v1/users/:id/roles

GET    /api/v1/modules
POST   /api/v1/modules/:id/enable
POST   /api/v1/modules/:id/disable

GET    /api/v1/crm/contacts   (X-Organization-Id + crm.read)
POST   /api/v1/crm/contacts
...    (leads, deals — idem pour chaque module)

GET    /api/v1/analytics/overview
```

## Démarrage rapide

### Docker (recommandé)

```bash
git clone <repo> && cd axiora
cp .env.example .env          # éditez JWT_SECRET

docker compose up --build -d  # lance les 6 services
docker compose exec api ./api seed  # données initiales

open http://localhost:3000
# Login : admin@axiora.io / admin1234
```

### Développement local

```bash
# Prérequis : Go 1.23+, Node.js 20+, Docker

make setup          # copie .env, installe les deps frontend
make up-infra       # postgres + redis + minio + meilisearch
cd backend && go mod tidy
make seed           # peuple la DB
make dev            # API :8080 + Frontend :3000
```

## Services exposés

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | admin@axiora.io / admin1234 |
| API | http://localhost:8080/health | — |
| MinIO Console | http://localhost:9001 | axiora_minio / axiora_minio_secret |
| Meilisearch | http://localhost:7700 | — |
| PostgreSQL | localhost:5432 | axiora / axiora_dev_password |
| Redis | localhost:6379 | — |

## Licence

MIT
