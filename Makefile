.DEFAULT_GOAL := help
.PHONY: help setup up up-infra up-dev down down-v down-prod logs dev dev-api dev-frontend build seed seed-docker test lint tidy clean clean-all ps

BOLD   := \033[1m
RESET  := \033[0m
GREEN  := \033[32m
CYAN   := \033[36m
YELLOW := \033[33m

# Fichier d'env pour le dev local (peut être surchargé : ENV_FILE=.env.prod make ...)
ENV_FILE ?= .env.dev

# Charge le fichier d'env s'il existe (silencieux si absent)
LOAD_ENV = if [ -f $(ENV_FILE) ]; then set -a; . ./$(ENV_FILE); set +a; fi

##@ Aide

help: ## Affiche cette aide
	@awk 'BEGIN {FS = ":.*##"; printf "\n$(BOLD)STRATT ERP — Commandes$(RESET)\n\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(CYAN)%-22s$(RESET) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BOLD)%s$(RESET)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Setup

setup: ## Premier lancement : copie les .env et installe les dépendances
	@if [ ! -f .env.dev ]; then \
		cp .env.dev.example .env.dev && echo "$(GREEN)✓ .env.dev créé$(RESET)"; \
	else \
		echo "$(YELLOW)⚠ .env.dev existe déjà$(RESET)"; \
	fi
	@if [ ! -f backend/.env ]; then cp backend/.env.example backend/.env; echo "$(GREEN)✓ backend/.env créé$(RESET)"; fi
	@if [ ! -f frontend/.env.local ]; then cp frontend/.env.example frontend/.env.local; echo "$(GREEN)✓ frontend/.env.local créé$(RESET)"; fi
	@cd frontend && pnpm install
	@echo "$(GREEN)✓ Dépendances frontend installées$(RESET)"
	@echo ""
	@echo "$(BOLD)Prochaines étapes :$(RESET)"
	@echo "  1. $(CYAN)make up-infra$(RESET)   — démarre postgres + redis + meilisearch + minio"
	@echo "  2. $(CYAN)make seed$(RESET)       — peuple la base de données"
	@echo "  3. $(CYAN)make dev$(RESET)        — lance l'API Go + le frontend Next.js"

##@ Infrastructure Docker (dev)

up-infra: ## Démarre l'infra locale sans Traefik (postgres, redis, meilisearch, minio)
	docker compose -f docker-compose.dev.yml up -d postgres redis meilisearch minio
	@echo "$(GREEN)✓ Infra démarrée$(RESET)"
	@echo "  PostgreSQL  : localhost:5432"
	@echo "  Redis       : localhost:6379"
	@echo "  Meilisearch : localhost:7700"
	@echo "  MinIO API   : localhost:9000  (console: localhost:9001)"

up-dev: ## Démarre toute la stack dev via Docker (infra + api + frontend buildés)
	docker compose -f docker-compose.dev.yml up --build -d
	@echo "$(GREEN)✓ Stack dev démarrée$(RESET)"
	@echo "  Frontend : http://localhost:3000"
	@echo "  API      : http://localhost:8080"
	@echo "  MinIO    : http://localhost:9001  (stratt_minio / stratt_minio_secret)"
	@echo "  Méili    : http://localhost:7700"

up: ## Démarre la stack production (docker-compose.yml, Traefik requis)
	docker compose up --build -d

down: ## Stoppe les conteneurs dev
	docker compose -f docker-compose.dev.yml down

down-v: ## Stoppe et supprime les volumes dev (reset complet de la DB)
	docker compose -f docker-compose.dev.yml down -v
	@echo "$(YELLOW)⚠ Volumes supprimés — relancez make up-infra && make seed$(RESET)"

down-prod: ## Stoppe la stack production
	docker compose down

logs: ## Logs de tous les services dev
	docker compose -f docker-compose.dev.yml logs -f

logs-api: ## Logs de l'API dev uniquement
	docker compose -f docker-compose.dev.yml logs -f api

ps: ## Status des conteneurs dev
	docker compose -f docker-compose.dev.yml ps

##@ Développement local (hot reload)

dev: ## Lance l'API Go + frontend en parallèle — nécessite make up-infra
	@echo "$(CYAN)Démarrage dev — API :8080, Frontend :3000$(RESET)"
	@echo "$(YELLOW)→ Ctrl+C pour tout arrêter$(RESET)"
	@$(LOAD_ENV); \
	trap 'kill 0' INT; \
	  (cd backend && go run ./cmd/api 2>&1 | sed 's/^/[api] /') & \
	  (cd frontend && pnpm dev 2>&1 | sed 's/^/[web] /') & \
	  wait

dev-api: ## Lance uniquement l'API Go (hot reload via air si installé)
	@$(LOAD_ENV); \
	if command -v air > /dev/null 2>&1; then \
		echo "$(CYAN)Démarrage avec air (hot reload)$(RESET)"; \
		cd backend && air; \
	else \
		echo "$(CYAN)Démarrage go run$(RESET)"; \
		cd backend && go run ./cmd/api; \
	fi

dev-frontend: ## Lance uniquement le frontend Next.js
	cd frontend && pnpm dev

##@ Base de données

seed: ## Peuple la DB avec les données initiales (go run local, charge .env.dev)
	@$(LOAD_ENV); cd backend && go run ./seed/main.go
	@echo "$(GREEN)✓ Seed terminé$(RESET)"

seed-docker: ## Peuple la DB via Docker (si l'infra tourne via up-infra/up-dev)
	docker compose -f docker-compose.dev.yml run --rm seed
	@echo "$(GREEN)✓ Seed Docker terminé$(RESET)"

##@ Build

build: ## Build de production (backend + frontend)
	@$(MAKE) build-api build-frontend

build-api: ## Compile le binaire Go (Linux statique)
	cd backend && CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o bin/api ./cmd/api
	@echo "$(GREEN)✓ API → backend/bin/api$(RESET)"

build-frontend: ## Build Next.js de production
	cd frontend && pnpm build
	@echo "$(GREEN)✓ Frontend buildé$(RESET)"

##@ Qualité

test: ## Lance les tests Go
	cd backend && go test ./... -v -race

lint: ## Lint Go + Next.js
	cd backend && go vet ./...
	cd frontend && pnpm lint

tidy: ## go mod tidy
	cd backend && go mod tidy

##@ Nettoyage

clean: ## Supprime les artefacts de build
	rm -rf backend/bin frontend/.next
	@echo "$(GREEN)✓ Artefacts supprimés$(RESET)"

clean-all: clean ## Supprime build + node_modules (réinstallation complète)
	rm -rf frontend/node_modules
	@echo "$(GREEN)✓ Relancez : make setup$(RESET)"
