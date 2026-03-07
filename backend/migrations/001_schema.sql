-- Axiora — Initial Schema
-- Run with: psql $DATABASE_URL < migrations/001_schema.sql
-- (GORM AutoMigrate also handles this automatically on startup)

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for trigram search

-- ─── Core ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT UNIQUE NOT NULL,
    name            TEXT NOT NULL,
    password_hash   TEXT NOT NULL,
    avatar_url      TEXT,
    email_verified  BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token   TEXT UNIQUE NOT NULL,
    user_agent      TEXT,
    ip_address      TEXT,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);

-- ─── Organizations ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS organizations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    slug        TEXT UNIQUE NOT NULL,
    logo_url    TEXT,
    plan        TEXT NOT NULL DEFAULT 'free',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS organization_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id         UUID,
    status          TEXT NOT NULL DEFAULT 'active',
    UNIQUE(organization_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);

CREATE TABLE IF NOT EXISTS invites (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email           TEXT NOT NULL,
    token           TEXT UNIQUE NOT NULL,
    role_id         UUID,
    expires_at      TIMESTAMPTZ NOT NULL,
    accepted_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- ─── RBAC ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    is_system       BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS permissions (
    id          SERIAL PRIMARY KEY,
    name        TEXT UNIQUE NOT NULL,
    description TEXT,
    module      TEXT,
    action      TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT  NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, organization_id, role_id)
);

-- ─── Modules ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS modules (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    icon        TEXT,
    color       TEXT,
    is_core     BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS organization_modules (
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    module_id       TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    enabled_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    settings        JSONB,
    PRIMARY KEY (organization_id, module_id)
);

-- ─── Audit ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    action          TEXT NOT NULL,
    resource_type   TEXT,
    resource_id     TEXT,
    metadata        JSONB,
    ip_address      TEXT,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_org_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC);

-- ─── CRM ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contacts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type        TEXT NOT NULL DEFAULT 'person',
    first_name  TEXT,
    last_name   TEXT,
    company     TEXT,
    email       TEXT,
    phone       TEXT,
    address     TEXT,
    tags        TEXT,
    notes       TEXT,
    assigned_to UUID,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON contacts(tenant_id);

CREATE TABLE IF NOT EXISTS leads (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id  UUID REFERENCES contacts(id) ON DELETE SET NULL,
    title       TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'new',
    source      TEXT,
    value       NUMERIC(15,2) DEFAULT 0,
    assigned_to UUID,
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);

CREATE TABLE IF NOT EXISTS deals (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id  UUID REFERENCES contacts(id) ON DELETE SET NULL,
    title       TEXT NOT NULL,
    stage       TEXT NOT NULL DEFAULT 'prospecting',
    value       NUMERIC(15,2) DEFAULT 0,
    currency    TEXT NOT NULL DEFAULT 'EUR',
    probability INT DEFAULT 0,
    expected_at TEXT,
    assigned_to UUID,
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_deals_tenant ON deals(tenant_id);

CREATE TABLE IF NOT EXISTS activities (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type         TEXT NOT NULL,
    subject      TEXT NOT NULL,
    description  TEXT,
    contact_id   UUID REFERENCES contacts(id) ON DELETE SET NULL,
    deal_id      UUID REFERENCES deals(id) ON DELETE SET NULL,
    lead_id      UUID REFERENCES leads(id) ON DELETE SET NULL,
    due_at       TEXT,
    completed_at TEXT,
    created_by   UUID NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ
);

-- ─── Accounting ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS accounts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code        TEXT NOT NULL,
    name        TEXT NOT NULL,
    type        TEXT NOT NULL,
    currency    TEXT NOT NULL DEFAULT 'EUR',
    balance     NUMERIC(15,2) DEFAULT 0,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS transactions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    account_id  UUID NOT NULL REFERENCES accounts(id),
    reference   TEXT,
    description TEXT,
    amount      NUMERIC(15,2) NOT NULL,
    type        TEXT NOT NULL,
    date        TEXT NOT NULL,
    invoice_id  UUID,
    created_by  UUID NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- ─── Billing ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invoices (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    number      TEXT NOT NULL,
    contact_id  UUID,
    status      TEXT NOT NULL DEFAULT 'draft',
    issue_date  TEXT NOT NULL,
    due_date    TEXT,
    currency    TEXT NOT NULL DEFAULT 'EUR',
    subtotal    NUMERIC(15,2) DEFAULT 0,
    tax_rate    NUMERIC(5,2) DEFAULT 0,
    tax_amount  NUMERIC(15,2) DEFAULT 0,
    total       NUMERIC(15,2) DEFAULT 0,
    notes       TEXT,
    created_by  UUID NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);

CREATE TABLE IF NOT EXISTS invoice_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity    NUMERIC(15,4) DEFAULT 1,
    unit_price  NUMERIC(15,2) NOT NULL,
    total       NUMERIC(15,2) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- ─── Inventory ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sku         TEXT,
    name        TEXT NOT NULL,
    description TEXT,
    category    TEXT,
    unit_price  NUMERIC(15,2) DEFAULT 0,
    cost_price  NUMERIC(15,2) DEFAULT 0,
    stock       NUMERIC(15,4) DEFAULT 0,
    reorder_at  NUMERIC(15,4) DEFAULT 0,
    unit        TEXT DEFAULT 'unit',
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id),
    type        TEXT NOT NULL,
    quantity    NUMERIC(15,4) NOT NULL,
    reference   TEXT,
    notes       TEXT,
    created_by  UUID NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- ─── HR ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS employees (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id),
    first_name  TEXT NOT NULL,
    last_name   TEXT NOT NULL,
    email       TEXT,
    phone       TEXT,
    department  TEXT,
    job_title   TEXT,
    hire_date   TEXT,
    salary      NUMERIC(15,2) DEFAULT 0,
    status      TEXT NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    type        TEXT NOT NULL,
    start_date  TEXT NOT NULL,
    end_date    TEXT NOT NULL,
    days        NUMERIC(5,1),
    reason      TEXT,
    status      TEXT NOT NULL DEFAULT 'pending',
    approved_by UUID,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- ─── Procurement ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS purchase_orders (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    number        TEXT NOT NULL,
    supplier_id   UUID,
    status        TEXT NOT NULL DEFAULT 'draft',
    order_date    TEXT NOT NULL,
    delivery_date TEXT,
    currency      TEXT NOT NULL DEFAULT 'EUR',
    subtotal      NUMERIC(15,2) DEFAULT 0,
    tax_amount    NUMERIC(15,2) DEFAULT 0,
    total         NUMERIC(15,2) DEFAULT 0,
    notes         TEXT,
    created_by    UUID NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id  UUID REFERENCES products(id),
    description TEXT NOT NULL,
    quantity    NUMERIC(15,4) DEFAULT 1,
    unit_price  NUMERIC(15,2) NOT NULL,
    total       NUMERIC(15,2) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);
