# Module Guidelines

> See also: [`ARCHITECTURE.md`](../../ARCHITECTURE.md)

---

## Table of Contents

1. [Module Philosophy](#1-module-philosophy)
2. [Directory Structure](#2-directory-structure)
3. [File Responsibilities](#3-file-responsibilities)
4. [Multi-Tenancy Rules](#4-multi-tenancy-rules)
5. [Permissions](#5-permissions)
6. [API Design](#6-api-design)
7. [Data Integrity](#7-data-integrity)
8. [Inter-Module Communication](#8-inter-module-communication)
9. [Logging](#9-logging)
10. [Testing](#10-testing)

---

## 1. Module Philosophy

Each ERP module must be:

- **Isolated** — no shared state with other modules
- **Optional** — can be enabled or disabled per organization
- **Domain-focused** — owns a single business domain
- **Loosely coupled** — communicates via services or events, never direct imports

> Modules must **never** directly depend on each other.

Cross-module communication must go through:
- Shared services in `internal/`
- Events / async jobs
- The analytics aggregation layer

---

## 2. Directory Structure

All modules live under `backend/modules/`.

```
backend/modules/
├── crm/
│   ├── models.go
│   ├── repository.go
│   ├── handler.go
│   ├── routes.go
│   └── service.go       ← optional
├── billing/
│   ├── models.go
│   ├── repository.go
│   ├── handler.go
│   └── routes.go
└── ...
```

---

## 3. File Responsibilities

| File | Responsibility |
|---|---|
| `models.go` | GORM entity definitions for the module |
| `repository.go` | All database queries (scoped to tenant) |
| `handler.go` | HTTP request handling via Fiber |
| `routes.go` | Route registration and middleware attachment |
| `service.go` | Business logic (optional — use when handlers grow complex) |

---

## 4. Multi-Tenancy Rules

Every module table **must** include `tenant_id`:

```go
type Contact struct {
    Base
    TenantID uuid.UUID `gorm:"type:uuid;not null;index"`
    Name     string    `gorm:"not null"`
    Email    string
}
```

All repository queries **must** scope by tenant:

```go
func (r *ContactRepository) List(tenantID uuid.UUID) ([]Contact, error) {
    var contacts []Contact
    err := r.db.Where("tenant_id = ?", tenantID).Find(&contacts).Error
    return contacts, err
}
```

`tenant_id` must come from middleware context — **never** from client input.

---

## 5. Permissions

Every module defines permissions in the format `module.action`:

| Permission | Description |
|---|---|
| `crm.read` | View contacts, leads, deals |
| `crm.write` | Create and update CRM records |
| `crm.delete` | Delete CRM records |
| `billing.read` | View invoices |
| `billing.write` | Create and send invoices |

Handlers must verify permissions via middleware:

```go
// routes.go
r.Get("/contacts", middleware.RequirePermission(rbacSvc, "crm.read"), h.ListContacts)
r.Post("/contacts", middleware.RequirePermission(rbacSvc, "crm.write"), h.CreateContact)
r.Delete("/contacts/:id", middleware.RequirePermission(rbacSvc, "crm.delete"), h.DeleteContact)
```

---

## 6. API Design

Routes follow the pattern `/api/v1/{module}/{resource}`:

```
GET    /api/v1/crm/contacts          → list contacts
POST   /api/v1/crm/contacts          → create contact
GET    /api/v1/crm/contacts/:id      → get contact
PUT    /api/v1/crm/contacts/:id      → update contact
DELETE /api/v1/crm/contacts/:id      → delete contact
```

---

## 7. Data Integrity

Modules must:

- **Validate input** — reject malformed or missing fields before touching the DB
- **Prevent cross-tenant access** — always scope queries by `tenant_id`
- **Maintain referential integrity** — use FK constraints in migrations

```go
// Always extract IDs from context — never from request body
tenantID := ctxutil.GetOrgID(c)
userID   := ctxutil.GetUserID(c)
```

---

## 8. Inter-Module Communication

Modules must **not** import each other directly.

```go
// Wrong
import "github.com/axiora/backend/modules/crm"

// Correct — use a shared service or analytics query
import "github.com/axiora/backend/internal/analytics"
```

Allowed communication patterns:

| Pattern | When to use |
|---|---|
| Shared service (`internal/`) | Synchronous cross-domain logic |
| Async job (Asynq) | Fire-and-forget side effects |
| Analytics layer | Aggregated reads across modules |

**Example**: CRM creates a deal → Billing reads deal value via the analytics layer, not by importing `modules/crm`.

---

## 9. Logging

Important module actions must produce audit log entries via `audit.Service`:

```go
auditSvc.Log(ctx, "contact.created",  userID, orgID, map[string]any{"id": contact.ID})
auditSvc.Log(ctx, "invoice.paid",     userID, orgID, map[string]any{"id": invoice.ID, "amount": invoice.Total})
auditSvc.Log(ctx, "employee.deleted", userID, orgID, map[string]any{"id": employee.ID})
```

---

## 10. Testing

Each module should include:

| Test type | What to cover |
|---|---|
| **Unit tests** | Service logic, business rules, edge cases |
| **Integration tests** | Handler endpoints with a real DB (test containers) |

Test files follow Go conventions: `models_test.go`, `handler_test.go`, `service_test.go`.
