AGENTS.md — Axiora AI Development Guide

This file provides instructions for AI coding agents (Claude, Copilot,
Cursor, etc.) working on the Axiora repository.

Axiora is a modular SaaS ERP platform designed to support multiple
business domains such as CRM, accounting, billing, inventory and HR.

AI agents must follow the architectural rules and conventions described
below.

------------------------------------------------------------------------

1. Project Overview

Axiora is a multi-tenant SaaS ERP built with a modular architecture.

Core goals:

-   modular ERP architecture
-   enterprise-grade security
-   multi-tenant organizations
-   extensible modules
-   API-first design
-   scalable async workers

------------------------------------------------------------------------

2. Core Architecture

Frontend (Next.js) | v API Gateway / Backend (Go) | |– PostgreSQL |–
Redis |– Object Storage (S3 / MinIO) |– Async Workers (Asynq)

Main principles:

-   clean architecture
-   domain-driven modules
-   async processing
-   strict separation of concerns

------------------------------------------------------------------------

3. Repository Structure

Typical project structure:

axiora/

frontend/ → Next.js web application backend/ → Go API server

internal/ auth/ crm/ billing/ inventory/ hr/

workers/ → async background jobs pkg/ → shared utilities

prisma/ → database schema & migrations

docs/ → architecture & product docs

Rules:

-   business logic lives in internal/
-   shared utilities go in pkg/
-   workers process async tasks only
-   handlers must remain thin

------------------------------------------------------------------------

4. Coding Principles

AI agents MUST follow these rules.

Architecture:

-   keep modules independent
-   avoid cross-module coupling
-   respect domain boundaries

Backend

Language: Go

Rules:

-   handlers must be lightweight
-   business logic belongs to services
-   repositories manage DB access
-   no SQL inside handlers

Example structure:

module/

handler.go service.go repository.go model.go dto.go

------------------------------------------------------------------------

Frontend

Framework:

-   Next.js
-   Tailwind
-   ShadCN components
-   Framer Motion

Rules:

-   reusable components
-   no business logic inside UI components
-   API calls isolated in services

------------------------------------------------------------------------

5. Database

Primary database:

PostgreSQL

ORMs used:

-   Go → GORM
-   Frontend tooling → Prisma (schema generation)

Rules:

-   migrations must be versioned
-   avoid destructive migrations
-   keep schema backwards compatible

------------------------------------------------------------------------

6. Async Workers

Workers are powered by:

-   Redis
-   Asynq

Responsibilities:

-   emails
-   notifications
-   report generation
-   long running jobs

Workers must:

-   be idempotent
-   log failures
-   support retries

------------------------------------------------------------------------

7. Security Rules

Agents must respect these security constraints.

Never:

-   expose secrets
-   log passwords
-   store plaintext credentials

Always:

-   use environment variables
-   sanitize user input
-   validate permissions

------------------------------------------------------------------------

8. Multi-Tenancy

Axiora is organization-based.

All domain objects must include:

organization_id

Queries MUST always be scoped by organization.

------------------------------------------------------------------------

9. AI Agents (Future Roadmap)

AI agents are planned but not implemented yet.

Documentation is located in:

docs/architecture/AI_AGENTS_ROADMAP.md

Planned agents:

-   classification agent
-   analytics agent
-   report generation agent
-   alert agent

AI logic must run inside workers, never in request handlers.

------------------------------------------------------------------------

10. Testing

Required tests:

-   unit tests for services
-   integration tests for API
-   worker tests for async tasks

Testing tools:

-   Go testing package
-   Playwright (frontend)

------------------------------------------------------------------------

11. Pull Request Rules

Agents creating pull requests must:

-   keep changes small
-   follow module boundaries
-   update documentation
-   include tests when possible

------------------------------------------------------------------------

12. Forbidden Changes

Agents MUST NOT:

-   break database schema
-   change authentication logic
-   remove audit logging
-   bypass organization scoping

If unsure, ask for confirmation.

------------------------------------------------------------------------

13. Preferred Development Workflow

1.  understand module
2.  implement service logic
3.  add repository queries
4.  expose handler
5.  update tests
6.  update documentation

------------------------------------------------------------------------

14. Design Philosophy

Axiora follows these principles:

-   simplicity
-   modularity
-   auditability
-   enterprise readiness
-   future AI extensibility

Code must remain clear, maintainable, and production-ready.
