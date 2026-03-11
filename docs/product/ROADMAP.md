# ROADMAP — STRATT — 8 semaines

> Objectif : transformer la maquette UI en SaaS complet, prêt à accueillir les premiers clients

---

## Vue d'ensemble

```
Semaine   1    2    3    4    5    6    7    8
          ├────┤────┤────┤────┤────┤────┤────┤
Phase 1   ████ ████
Phase 2             ████ ████ ████
Phase 3                            ████ ████
Phase 4                                      ████
```

| Phase | Semaines | Thème |
|-------|----------|-------|
| **Phase 1 — Foundations** | S1–S2 | Infrastructure, Auth, DB, Architecture |
| **Phase 2 — Core Features** | S3–S5 | Modules métier fonctionnels avec backend réel |
| **Phase 3 — Intelligence** | S6–S7 | Agents IA, génération documentaire, alertes auto |
| **Phase 4 — Stabilisation** | S8 | Tests, performance, documentation, go-live |

---

## Phase 1 — Foundations (S1–S2)

### Semaine 1 — Infrastructure & Architecture

**Objectif** : Monorepo opérationnel, infrastructure locale, schéma DB.

**Livrables** :
- [ ] Monorepo Turborepo configuré (`apps/`, `packages/`, `services/`)
- [ ] Docker Compose complet (PostgreSQL 16, Redis 7, API Go, Web Next.js)
- [ ] CI/CD GitHub Actions (lint, test, build) opérationnel
- [ ] Schéma PostgreSQL complet avec migrations versionnées
- [ ] Row-Level Security (RLS) multi-tenant activé
- [ ] API Go skeleton (Gin, health check, structure Clean Architecture)
- [ ] Next.js 15 App Router configuré (TailwindCSS, ShadCN, Framer Motion)
- [ ] Environnements : `.env.example`, validation Zod
- [ ] Pre-commit hooks (Husky + lint-staged)

**Fonctionnalités** :
- Health check API : `GET /health`
- Migration système opérationnel
- Dev environment documenté

---

### Semaine 2 — Authentication & User Management

**Objectif** : Système d'authentification multi-tenant complet et sécurisé.

**Livrables** :
- [ ] Stack Auth intégré (email/password + magic link)
- [ ] Multi-tenant : modèle Organisation + isolation RLS
- [ ] RBAC : rôles `admin`, `acheteur`, `lecteur`
- [ ] Page login / signup / onboarding organisation
- [ ] Middleware auth côté API Go (JWT validation)
- [ ] Gestion des sessions (refresh token, rotation)
- [ ] Page Administration : gestion des membres, invitations email
- [ ] Rate limiting (Redis) : 100 req/min/IP
- [ ] Audit log : toute mutation tracée

**Fonctionnalités** :
- `POST /auth/login`, `POST /auth/signup`
- `GET /api/me`, `PUT /api/me/profile`
- `POST /api/organisations/invite`
- `GET /api/users`, `PUT /api/users/:id/role`

---

## Phase 2 — Core Features (S3–S5)

### Semaine 3 — Module Nomenclature (Backend + API)

**Objectif** : Module Nomenclature entièrement fonctionnel avec persistance réelle.

**Livrables** :
- [ ] API CRUD complète pour les codes de nomenclature
- [ ] Versionning de nomenclature (snapshot par version)
- [ ] Journal des modifications (audit trail)
- [ ] Import/export nomenclature (JSON, CSV)
- [ ] Validation de cohérence (codes exhaustifs + exclusifs)
- [ ] Frontend connecté à l'API (fin des données mockées)

**Fonctionnalités** :
- `GET /api/nomenclature` (arborescence complète)
- `POST /api/nomenclature/codes` (créer un code)
- `PUT /api/nomenclature/codes/:id` (modifier)
- `DELETE /api/nomenclature/codes/:id` (soft delete)
- `POST /api/nomenclature/versions` (créer version snapshot)
- `GET /api/nomenclature/versions` (historique)

---

### Semaine 4 — Module Cartographie & Import données

**Objectif** : Import de données réel + cartographie calculée dynamiquement.

**Livrables** :
- [ ] Pipeline d'import CSV/XLSX (parser, validation, normalisation)
- [ ] Stockage des dépenses mandatées en base
- [ ] Calcul dynamique de la cartographie (treemap, répartition)
- [ ] Computation des seuils de procédure par code (art. L2124-1 CCP)
- [ ] Détection basique du fractionnement (règles déterministes)
- [ ] API cartographie avec filtres (exercice, direction, code)
- [ ] Frontend cartographie connecté à l'API

**Fonctionnalités** :
- `POST /api/imports` (upload CSV/XLSX)
- `GET /api/imports/:id/status` (polling statut)
- `GET /api/cartographie` (données calculées)
- `GET /api/cartographie/seuils` (computation par code)
- `GET /api/depenses` (liste paginée avec filtres)

---

### Semaine 5 — Module Planification & Dashboard

**Objectif** : Planification interactive et dashboard alimenté par données réelles.

**Livrables** :
- [ ] CRUD complet des marchés planifiés
- [ ] Calcul de charge prévisionnelle (j/homme par mois)
- [ ] Détection des chevauchements de passations
- [ ] Alertes accords-cadres à échéance (J-90, J-30)
- [ ] Dashboard KPIs calculés dynamiquement (fin des mocks)
- [ ] Indice de maturité achats (IMA) calculé côté API
- [ ] Vision pluriannuelle (agrégation par exercice)
- [ ] Notifications alertes (badge sidebar, toast)

**Fonctionnalités** :
- `GET /api/marches`, `POST /api/marches`, `PUT /api/marches/:id`
- `GET /api/planification/charge` (charge mensuelle)
- `GET /api/dashboard/kpis` (tous les KPIs)
- `GET /api/dashboard/maturite` (IMA)
- `GET /api/alertes` (alertes actives)
- `PUT /api/alertes/:id/resolve` (résoudre alerte)

---

## Phase 3 — Intelligence & Automations (S6–S7)

### Semaine 6 — Agents IA (Nomenclature + Conformité)

**Objectif** : Classification automatique des dépenses et surveillance réglementaire IA.

**Livrables** :
- [ ] Agent IA Nomenclature (classification automatique via Claude)
- [ ] Pipeline : import → classification → review interface
- [ ] Agent IA Conformité (détection fractionnement IA)
- [ ] Recommandations IA : regroupement accord-cadre, mutualisation
- [ ] Interface de validation humaine (confidence < 70%)
- [ ] Worker async Asynq (Redis queue) pour jobs longue durée
- [ ] Logs des appels IA (prompt, response, tokens, latency)

**Fonctionnalités** :
- `POST /api/ai/classify` (classer une dépense)
- `GET /api/ai/classify/:job_id` (résultat classification)
- `POST /api/ai/conformite/analyze` (analyse complète)
- `GET /api/ai/recommandations` (suggestions IA)
- `PUT /api/depenses/:id/code` (valider classification)

---

### Semaine 7 — Génération documentaire

**Objectif** : Génération PDF/XLSX institutionnel entièrement automatisée.

**Livrables** :
- [ ] Agent IA Génération (rédaction sections narratives via Claude)
- [ ] Générateur PDF (Puppeteer + templates Handlebars)
- [ ] Générateur XLSX récapitulatif (ExcelJS)
- [ ] Générateur format progiciel financier (CSV structuré)
- [ ] Storage S3-compatible (MinIO en dev, S3 en prod)
- [ ] URLs signées pour téléchargement sécurisé
- [ ] Bibliothèque des documents générés (historique)
- [ ] Frontend Exports connecté à l'API

**Fonctionnalités** :
- `POST /api/exports` (lancer génération)
- `GET /api/exports/:id/status` (polling job)
- `GET /api/exports/:id/download` (URL signée)
- `GET /api/exports` (historique documents)

---

## Phase 4 — Stabilisation (S8)

### Semaine 8 — Tests, Performance & Go-live

**Objectif** : Prêt pour les premiers clients.

**Livrables** :
- [ ] Couverture tests unitaires ≥ 80% (backend Go)
- [ ] Tests d'intégration API (tous les endpoints)
- [ ] Tests E2E Playwright (5 parcours utilisateurs clés)
- [ ] Optimisation des requêtes PostgreSQL (EXPLAIN ANALYZE, index)
- [ ] Pagination sur toutes les listes
- [ ] Sentry configuré (erreurs + performance)
- [ ] Prometheus + Grafana (métriques API)
- [ ] Documentation API Swagger complète
- [ ] README final + guides d'installation
- [ ] Seed données de démonstration (Métropole fictive)
- [ ] Checklist sécurité OWASP Top 10
- [ ] Variables d'environnement documentées

**Critères de go-live** :
- [ ] Aucun bug critique ouvert
- [ ] P99 API < 500ms sur les endpoints principaux
- [ ] Score Lighthouse ≥ 90 (performance, accessibilité)
- [ ] Tests E2E verts en CI
- [ ] Documentation à jour

---

## Métriques de succès (post-launch, M+3)

| KPI | Cible |
|-----|-------|
| Temps de génération rapport | < 3 minutes |
| Précision classification IA | > 90% |
| NPS utilisateurs | > 50 |
| Temps d'onboarding | < 30 minutes |
| Uptime | > 99.5% |
| Clients actifs (M+3) | 5 collectivités pilotes |
