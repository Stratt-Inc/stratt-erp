# Axiora — Achats Publics

> **Plateforme SaaS de pilotage stratégique de la commande publique**
> Nomenclature · Cartographie · Planification · Conformité réglementaire · Génération IA

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org)
[![Go](https://img.shields.io/badge/Go-1.23-00ADD8)](https://golang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)](https://postgresql.org)

---

## Vision produit

Axiora transforme la gestion des achats publics en **avantage stratégique** pour les collectivités territoriales françaises. Face à la complexité du Code de la Commande Publique (CCP 2024), Axiora offre :

- **Nomenclature intelligente** — arborescence sur-mesure issue d'une étude empirique de la dépense mandatée, conforme CartoAP
- **Cartographie de la dépense** — photographie fine par famille homogène, détection automatique du fractionnement
- **Planification stratégique** — vision pluriannuelle, gestion de la charge, simulation des délais
- **Conformité temps réel** — alertes réglementaires CCP, computation des seuils de procédure
- **Génération documentaire IA** — production automatique des rendus formalisés (PDF, XLSX, format progiciel)

**Cible** : Collectivités territoriales françaises (métropoles, départements, régions, communes > 30k hab.)
**Marché adressable** : ~3 500 entités éligibles en France

---

## Architecture

```
axiora/
├── apps/
│   ├── web/          # Frontend Next.js 15 (App Router)
│   └── api/          # Backend Go (Gin + Clean Architecture)
├── packages/
│   ├── ui/           # Design system ShadCN + composants métier
│   ├── core/         # Types partagés + logique métier pure
│   ├── database/     # Schéma Prisma + migrations
│   ├── auth/         # Stack Auth — authentication multi-tenant
│   ├── config/       # Configuration partagée (env, constants)
│   └── logger/       # Logger structuré (Zap)
├── services/
│   ├── ai/           # Agents IA (nomenclature, analyse, génération)
│   ├── generation/   # Génération PDF/XLSX
│   └── processing/   # Pipeline import & traitement des données
├── infrastructure/
│   ├── docker/       # Dockerfiles + Docker Compose
│   ├── ci/           # GitHub Actions workflows
│   └── scripts/      # Scripts d'initialisation et de déploiement
└── docs/             # Documentation technique complète
```

→ Voir [ARCHITECTURE.md](ARCHITECTURE.md) pour le détail complet.

---

## Stack technique

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| **Frontend** | Next.js 15 (App Router) | SSR, RSC, performance, SEO |
| **UI** | TailwindCSS v3 + ShadCN | Cohérence, accessibilité, vitesse |
| **Animations** | Framer Motion v12 | Micro-interactions premium |
| **Charts** | Recharts | Composants React natifs |
| **Backend** | Go 1.23 (Gin) | Performance, concurrence, typage fort |
| **Base de données** | PostgreSQL 16 | ACID, JSON, full-text search |
| **ORM** | GORM + migrations | Type-safe, migrations versionnées |
| **Auth** | Stack Auth | Multi-tenant, RBAC, SSO SAML |
| **IA** | Claude claude-sonnet-4-6 (Anthropic) | Génération documentaire, analyse |
| **Queue** | Redis + Asynq | Jobs async (génération PDF, imports) |
| **Cache** | Redis | Sessions, rate limiting |
| **Infra** | Docker + Fly.io | Déploiement simple, scaling |
| **CI/CD** | GitHub Actions | Lint, test, build, deploy |
| **Monitoring** | Sentry + Prometheus + Grafana | Observabilité complète |

---

## Installation

### Prérequis

- **Go** ≥ 1.23
- **Node.js** ≥ 20.x
- **pnpm** ≥ 9.x
- **Docker** + **Docker Compose** ≥ 2.x
- **PostgreSQL** 16 (ou via Docker)
- **Redis** 7.x (ou via Docker)

### Cloner le projet

```bash
git clone https://github.com/your-org/axiora.git
cd axiora
```

### Variables d'environnement

```bash
cp .env.example .env
# Éditer .env avec vos valeurs
```

Variables requises :
```env
# Database
DATABASE_URL=postgresql://axiora:password@localhost:5432/axiora_dev

# Auth (Stack Auth)
STACK_AUTH_SECRET_KEY=sk_...
STACK_AUTH_PUBLISHABLE_KEY=pk_...

# IA
ANTHROPIC_API_KEY=sk-ant-...

# Redis
REDIS_URL=redis://localhost:6379

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_URL=http://localhost:8080
JWT_SECRET=your-secret-key
```

---

## Lancer en local

### Option 1 — Docker Compose (recommandé)

```bash
docker compose up -d
```

Accès :
- **Frontend** : http://localhost:3000
- **API** : http://localhost:8080
- **API Docs** : http://localhost:8080/swagger

### Option 2 — Développement natif

```bash
# 1. Infrastructure (DB + Redis uniquement)
docker compose up -d postgres redis

# 2. Migrations
cd apps/api && go run ./cmd/migrate up

# 3. API Go
cd apps/api && go run ./cmd/api

# 4. Frontend (autre terminal)
cd apps/web && pnpm dev
```

---

## Docker

```bash
# Build production
docker compose -f docker-compose.prod.yml build

# Deploy
docker compose -f docker-compose.prod.yml up -d

# Logs
docker compose logs -f api
docker compose logs -f web
```

---

## Roadmap — 8 semaines

| Phase | Semaines | Focus |
|-------|----------|-------|
| **Phase 1 — Foundations** | S1–S2 | Auth, infra, monorepo, DB schema |
| **Phase 2 — Core Features** | S3–S5 | Nomenclature, Cartographie, Planification réels |
| **Phase 3 — Intelligence** | S6–S7 | Agents IA, génération documentaire, alertes auto |
| **Phase 4 — Stabilisation** | S8 | Tests, performance, polish, go-live |

→ Voir [docs/ROADMAP.md](docs/ROADMAP.md) pour le détail semaine par semaine.

---

## Contribution

Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour les conventions de code, le workflow Git et les standards de développement.

```bash
# Créer une branche feature
git checkout -b feature/AXI-123-ma-feature

# Développer + tester
pnpm test && pnpm lint

# Commit (Conventional Commits)
git commit -m "feat(nomenclature): add threshold computation endpoint"

# Push + PR vers develop
git push origin feature/AXI-123-ma-feature
```

---

## Licence

MIT — voir [LICENSE](LICENSE)

---

*Axiora — Construire la commande publique de demain.*
