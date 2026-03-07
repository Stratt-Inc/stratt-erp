# Database Guidelines

> **Stack**: PostgreSQL 16 + GORM

---

## Table of Contents

1. [General Principles](#1-general-principles)
2. [Primary Keys](#2-primary-keys)
3. [Timestamps](#3-timestamps)
4. [Multi-Tenant Design](#4-multi-tenant-design)
5. [Indexing](#5-indexing)
6. [Foreign Keys](#6-foreign-keys)
7. [JSON Fields](#7-json-fields)
8. [Migrations](#8-migrations)
9. [Soft Deletes](#9-soft-deletes)
10. [Security](#10-security)
11. [Audit Logs](#11-audit-logs)

---

## 1. General Principles

Database design must prioritize, in order:

| Priority | Concern |
|:---:|---|
| 1 | **Tenant isolation** |
| 2 | **Data integrity** |
| 3 | **Performance** |
| 4 | **Auditability** |

---

## 2. Primary Keys

All tables use **UUID** primary keys.

```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
```

> **Exception** — Reference tables (permissions, roles, etc.) may use `SERIAL`.

---

## 3. Timestamps

Every entity must include these three columns:

```sql
created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
deleted_at  TIMESTAMPTZ                          -- soft delete (optional)
```

In GORM, embed the shared `Base` struct:

```go
type Base struct {
    ID        uuid.UUID      `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    CreatedAt time.Time
    UpdatedAt time.Time
    DeletedAt gorm.DeletedAt `gorm:"index"`
}
```

---

## 4. Multi-Tenant Design

Every business table **must** contain:

```sql
tenant_id UUID NOT NULL REFERENCES organizations(id)
```

All queries **must** filter by `tenant_id` — no exceptions.

```go
// Correct
db.Where("tenant_id = ?", tenantID).Find(&results)

// Wrong — never do this
db.Find(&results)
```

`tenant_id` must always come from middleware context, never from client input.

---

## 5. Indexing

Create indexes for:

- `tenant_id` on every business table
- All foreign key columns
- Frequently filtered columns (status, created_at, etc.)

```sql
CREATE INDEX idx_contacts_tenant    ON contacts(tenant_id);
CREATE INDEX idx_invoices_tenant    ON invoices(tenant_id);
CREATE INDEX idx_invoices_status    ON invoices(status);
CREATE INDEX idx_leads_created_at   ON leads(created_at DESC);
```

---

## 6. Foreign Keys

Always enforce referential integrity with explicit named constraints.

```sql
ALTER TABLE invoices
    ADD CONSTRAINT fk_invoice_tenant
    FOREIGN KEY (tenant_id) REFERENCES organizations(id);
```

---

## 7. JSON Fields

Use `JSONB` for flexible or schemaless metadata.

```sql
metadata JSONB
```

Add a GIN index if the column is queried frequently:

```sql
CREATE INDEX idx_contacts_metadata ON contacts USING GIN (metadata);
```

---

## 8. Migrations

| Rule | Description |
|---|---|
| **Versioned** | Sequential prefix: `001_init.sql`, `002_add_modules.sql`, … |
| **Immutable** | Never rewrite or delete an existing migration file |
| **Additive** | Prefer `ADD COLUMN` / `CREATE INDEX` over destructive changes |

---

## 9. Soft Deletes

Use soft deletes for all user-generated data. Never hard-delete rows.

```sql
deleted_at TIMESTAMPTZ
```

GORM automatically excludes soft-deleted rows from queries when `gorm.DeletedAt` is embedded.

---

## 10. Security

**Never store:**

- Plaintext passwords
- Tokens or secrets without hashing
- Sensitive data unencrypted at rest

Passwords must be hashed with **bcrypt**:

```go
hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
```

---

## 11. Audit Logs

Critical actions must be recorded in the `audit_logs` table using `audit.Service`.

```go
// Example audit actions
auditSvc.Log(ctx, "user.login",     userID, orgID, nil)
auditSvc.Log(ctx, "invoice.created", userID, orgID, metadata)
auditSvc.Log(ctx, "role.updated",   userID, orgID, metadata)
```

> **Audit logs must never be deleted.**
