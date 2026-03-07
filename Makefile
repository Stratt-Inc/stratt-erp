.DEFAULT_GOAL := help
.PHONY: help setup up down logs dev build test clean

# ── Couleurs ────────────────────────────────────────────
BOLD  := \033[1m
RESET := \033[0m
GREEN := \033[32m
CYAN  := \033[36m

##@ Aide

help: ## Affiche cette aide
	@awk 'BEGIN {FS = ":.*##"; printf "\n$(BOLD)Axiora — Commandes disponibles$(RESET)\n\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(CYAN)%-18s$(RESET) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BOLD)%s$(RESET)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Setup

setup: ## Premier lancement : copie .env.example et installe les dépendances
	@if [ ! -f .env ]; then cp .env.example .env && echo "$(GREEN)✓ .env créé depuis .env.example — pensez à remplir les clés$(RESET)"; fi
	@pnpm install
	@echo "$(GREEN)✓ Dépendances installées$(RESET)"

##@ Infrastructure (Docker)

up: ## Démarre postgres, redis et minio en arrière-plan
	docker compose up -d
	@echo "$(GREEN)✓ Services démarrés$(RESET)"
	@echo "  PostgreSQL : localhost:5432"
	@echo "  Redis      : localhost:6379"
	@echo "  MinIO      : localhost:9000 (console: localhost:9001)"

down: ## Stoppe et supprime les conteneurs (les volumes sont conservés)
	docker compose down

down-v: ## Stoppe et supprime les conteneurs ET les volumes (reset DB)
	docker compose down -v

logs: ## Affiche les logs des services Docker
	docker compose logs -f

ps: ## Affiche l'état des conteneurs
	docker compose ps

##@ Développement

dev: ## Lance le frontend et l'API en mode développement (nécessite `make up`)
	@echo "$(CYAN)Démarrage du frontend (Next.js :3000) et de l'API (Go :8080)...$(RESET)"
	pnpm dev

dev-web: ## Lance uniquement le frontend Next.js
	pnpm --filter @axiora/web dev

dev-api: ## Lance uniquement l'API Go
	cd apps/api && go run ./cmd/api

##@ Build

build: ## Build de production tous les packages
	pnpm build

build-web: ## Build du frontend uniquement
	pnpm --filter @axiora/web build

build-api: ## Build du binaire Go
	cd apps/api && CGO_ENABLED=0 go build -ldflags="-w -s" -o bin/api ./cmd/api

##@ Qualité

test: ## Lance tous les tests
	pnpm test

lint: ## Lint tous les packages
	pnpm lint

type-check: ## Vérifie les types TypeScript
	pnpm --filter @axiora/web exec tsc --noEmit

##@ Nettoyage

clean: ## Supprime les artefacts de build
	rm -rf apps/web/.next apps/api/bin
	@echo "$(GREEN)✓ Artefacts supprimés$(RESET)"

clean-all: clean ## Supprime build + node_modules (réinstallation complète)
	rm -rf node_modules apps/web/node_modules packages/*/node_modules services/*/node_modules
	@echo "$(GREEN)✓ node_modules supprimés — relancez make setup$(RESET)"
