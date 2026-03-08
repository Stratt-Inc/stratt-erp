# API.md — Documentation API REST Axiora

> Version : v1 | Base URL : `http://localhost:8080/api/v1`

---

## Authentification

Toutes les requêtes authentifiées nécessitent un Bearer token JWT.

```http
Authorization: Bearer <access_token>
```

### Multi-tenant

Les endpoints liés aux modules ERP nécessitent le header `X-Organization-Id` :

```http
X-Organization-Id: <organization_uuid>
```

---

## Format de réponse

### Succès

```json
{
  "data": { ... }
}
```

### Erreur

```json
{
  "error": "description de l'erreur"
}
```

### Message

```json
{
  "message": "action effectuée avec succès"
}
```

---

## Codes d'erreur

| Code HTTP | Description |
|-----------|-------------|
| 400 | Requête invalide (validation, header manquant) |
| 401 | Token manquant ou expiré |
| 403 | Permissions insuffisantes |
| 404 | Ressource inexistante |
| 500 | Erreur serveur |

---

## Endpoints

### Health Check

```http
GET /health
```

**Response 200** :
```json
{ "status": "ok", "service": "Axiora" }
```

---

### Auth

#### POST /api/v1/auth/signup

Créer un nouveau compte utilisateur.

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response 201** :
```json
{
  "data": {
    "user": { "id": "uuid", "name": "John Doe", "email": "john@example.com", "email_verified": false },
    "access_token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### POST /api/v1/auth/login

```json
{
  "email": "admin@axiora.io",
  "password": "admin1234"
}
```

**Response 200** :
```json
{
  "data": {
    "user": { "id": "uuid", "name": "Admin Axiora", "email": "admin@axiora.io" },
    "access_token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### POST /api/v1/auth/refresh

Rafraîchir l'access token via le refresh token (cookie httpOnly ou body).

**Response 200** :
```json
{ "data": { "access_token": "new_token..." } }
```

#### POST /api/v1/auth/logout
🔐 Requiert : `Authorization: Bearer <token>`

Invalide la session.

#### GET /api/v1/auth/me
🔐 Requiert : `Authorization: Bearer <token>`

Retourne l'utilisateur connecté.

---

### Organizations

🔐 Tous les endpoints requièrent un Bearer token.

#### GET /api/v1/organizations

Liste des organisations de l'utilisateur.

#### POST /api/v1/organizations

Créer une organisation.

```json
{
  "name": "Mon Entreprise",
  "slug": "mon-entreprise"
}
```

#### GET /api/v1/organizations/:id

Détail d'une organisation.

#### GET /api/v1/organizations/:id/members

Liste des membres d'une organisation.

#### DELETE /api/v1/organizations/:id/members/:userId
🔐 Requiert : `X-Organization-Id` + permission `admin.manage`

Retirer un membre de l'organisation.

---

### Roles & Permissions

🔐 Requiert : `Authorization` + `X-Organization-Id`

#### GET /api/v1/roles

Liste des rôles de l'organisation courante.

#### POST /api/v1/roles
🔐 Requiert : permission `admin.manage`

```json
{
  "name": "Manager",
  "description": "Accès lecture/écriture"
}
```

#### PUT /api/v1/roles/:id
🔐 Requiert : permission `admin.manage`

#### DELETE /api/v1/roles/:id
🔐 Requiert : permission `admin.manage`

#### POST /api/v1/roles/:id/permissions
🔐 Requiert : permission `admin.manage`

Assigner des permissions à un rôle.

#### GET /api/v1/permissions

Liste de toutes les permissions système.

#### POST /api/v1/users/:id/roles
🔐 Requiert : permission `admin.manage`

Assigner un rôle à un utilisateur dans l'organisation courante.

---

### Modules

🔐 Requiert : `Authorization` + `X-Organization-Id`

#### GET /api/v1/modules

Liste des modules ERP disponibles et leur statut d'activation.

#### POST /api/v1/modules/:id/enable
🔐 Requiert : permission `admin.manage`

Activer un module pour l'organisation courante.

#### POST /api/v1/modules/:id/disable
🔐 Requiert : permission `admin.manage`

Désactiver un module.

---

### CRM

🔐 Requiert : `Authorization` + `X-Organization-Id` + permission `crm.read`

#### Contacts

```http
GET    /api/v1/crm/contacts          # Liste des contacts
POST   /api/v1/crm/contacts          # Créer un contact
GET    /api/v1/crm/contacts/:id      # Détail d'un contact
PUT    /api/v1/crm/contacts/:id      # Modifier un contact
DELETE /api/v1/crm/contacts/:id      # Supprimer un contact
```

**Créer un contact** :
```json
{
  "type": "person",
  "first_name": "Marie",
  "last_name": "Dupont",
  "email": "marie@example.com",
  "company": "Acme Corp",
  "phone": "+33 6 12 34 56 78"
}
```

#### Leads

```http
GET    /api/v1/crm/leads             # Liste des leads
POST   /api/v1/crm/leads             # Créer un lead
GET    /api/v1/crm/leads/:id         # Détail d'un lead
PUT    /api/v1/crm/leads/:id         # Modifier un lead
```

**Créer un lead** :
```json
{
  "title": "Projet ERP - Acme Corp",
  "contact_id": "uuid",
  "status": "new",
  "source": "website",
  "value": 50000
}
```

#### Deals (Pipeline)

```http
GET    /api/v1/crm/deals             # Liste des deals
POST   /api/v1/crm/deals             # Créer un deal
GET    /api/v1/crm/deals/:id         # Détail d'un deal
PUT    /api/v1/crm/deals/:id         # Modifier un deal
```

**Créer un deal** :
```json
{
  "title": "Contrat annuel Acme",
  "contact_id": "uuid",
  "stage": "prospecting",
  "value": 120000,
  "currency": "EUR",
  "probability": 30
}
```

Stages disponibles : `prospecting`, `proposal`, `negotiation`, `closed_won`, `closed_lost`

---

### Comptabilité (Accounting)

🔐 Requiert : `Authorization` + `X-Organization-Id` + permission `accounting.read`

```http
GET    /api/v1/accounting/accounts         # Liste des comptes
POST   /api/v1/accounting/accounts         # Créer un compte
GET    /api/v1/accounting/transactions     # Liste des transactions
POST   /api/v1/accounting/transactions     # Créer une transaction
```

---

### Facturation (Billing)

🔐 Requiert : `Authorization` + `X-Organization-Id` + permission `billing.read`

```http
GET    /api/v1/billing/invoices            # Liste des factures
POST   /api/v1/billing/invoices            # Créer une facture
GET    /api/v1/billing/invoices/:id        # Détail d'une facture
PUT    /api/v1/billing/invoices/:id        # Modifier une facture
```

**Créer une facture** :
```json
{
  "number": "INV-2026-001",
  "contact_id": "uuid",
  "issue_date": "2026-03-07",
  "due_date": "2026-04-07",
  "items": [
    { "description": "Licence ERP annuelle", "quantity": 1, "unit_price": 9600 },
    { "description": "Support premium", "quantity": 12, "unit_price": 200 }
  ]
}
```

---

### Inventaire (Inventory)

🔐 Requiert : `Authorization` + `X-Organization-Id` + permission `inventory.read`

```http
GET    /api/v1/inventory/products          # Liste des produits
POST   /api/v1/inventory/products          # Créer un produit
GET    /api/v1/inventory/movements         # Liste des mouvements de stock
POST   /api/v1/inventory/movements         # Enregistrer un mouvement
```

---

### RH (HR)

🔐 Requiert : `Authorization` + `X-Organization-Id` + permission `hr.read`

```http
GET    /api/v1/hr/employees                # Liste des employés
POST   /api/v1/hr/employees                # Créer un employé
GET    /api/v1/hr/leaves                   # Liste des demandes de congés
POST   /api/v1/hr/leaves                   # Créer une demande de congé
```

---

### Achats (Procurement)

🔐 Requiert : `Authorization` + `X-Organization-Id` + permission `procurement.read`

```http
GET    /api/v1/procurement/orders          # Liste des commandes d'achat
POST   /api/v1/procurement/orders          # Créer une commande d'achat
GET    /api/v1/procurement/orders/:id      # Détail d'une commande
PUT    /api/v1/procurement/orders/:id      # Modifier une commande
```

---

### Analytics

🔐 Requiert : `Authorization` + `X-Organization-Id` + permission `analytics.read`

```http
GET    /api/v1/analytics/overview          # Vue synthétique cross-modules
```

---

## Chaîne d'autorisation

Chaque requête vers un module ERP passe par la chaîne suivante :

```
1. JWT Bearer token valide               → 401 si invalide
2. X-Organization-Id header présent      → 400 si absent
3. User est membre de l'organisation     → 403 si non membre
4. User a la permission requise          → 403 si permission manquante
5. Handler exécuté avec tenant_id        → Isolation multi-tenant
```

---

## Variables d'environnement API

| Variable | Description | Défaut |
|----------|-------------|--------|
| `PORT` | Port d'écoute | `8080` |
| `APP_ENV` | Environnement | `development` |
| `DATABASE_URL` | URL PostgreSQL | requis |
| `JWT_SECRET` | Clé secrète JWT | requis |
| `JWT_ACCESS_EXP_MINUTES` | Durée access token (min) | `15` |
| `JWT_REFRESH_EXP_DAYS` | Durée refresh token (jours) | `30` |
| `REDIS_URL` | URL Redis | `redis://localhost:6379` |
| `MEILISEARCH_URL` | URL Meilisearch | `http://localhost:7700` |
| `S3_ENDPOINT` | Endpoint S3/MinIO | `http://localhost:9000` |
| `FRONTEND_URL` | URL frontend (CORS) | `http://localhost:3000` |
