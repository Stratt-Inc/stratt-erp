.DEFAULT_GOAL := help
.PHONY: help setup up up-infra down down-v logs dev dev-api dev-frontend build seed test lint clean

BOLD  := \033[1m
RESET := \033[0m
GREEN := \033[32m
CYAN  := \033[36m
YELLOW:= \033[33m

##@ Aide

help: ## Affiche cette aide
	@awk 'BEGIN {FS = ":.*##"; printf "\n$(BOLD)STRATT ERP SaaS — Commandes$(RESET)\n\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(CYAN)%-20s$(RESET) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BOLD)%s$(RESET)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Setup

setup: ## Premier lancement : copie .env et installe les dépendances frontend
	@if [ ! -f .env ]; then cp .env.example .env && echo "$(GREEN)✓ .env créé — pensez à remplir JWT_SECRET$(RESET)"; fi
	@cd frontend && npm install
	@echo "$(GREEN)✓ Frontend installé$(RESET)"
	@echo "$(YELLOW)→ Go dependencies will be downloaded on first build$(RESET)"
	@echo "\n$(BOLD)Prochaines étapes :$(RESET)"
	@echo "  1. Editez .env si nécessaire"
	@echo "  2. make up-infra    # démarre postgres + redis + minio + meilisearch"
	@echo "  3. make seed        # peuple la base de données"
	@echo "  4. make dev         # lance l'API Go et le frontend"

##@ Infrastructure Docker

up: ## Lance toute la stack (build inclus)
	docker compose up --build -d
	@echo "$(GREEN)✓ Stack complète démarrée$(RESET)"
	@echo "  Frontend : http://localhost:3000"
	@echo "  API      : http://localhost:8080"
	@echo "  MinIO    : http://localhost:9001  (stratt_minio / stratt_minio_secret)"
	@echo "  Méili    : http://localhost:7700"

up-infra: ## Lance uniquement l'infrastructure (postgres, redis, minio, meilisearch)
	docker compose up -d postgres redis minio meilisearch
	@echo "$(GREEN)✓ Infra démarrée$(RESET)"
	@echo "  PostgreSQL : localhost:5432"
	@echo "  Redis      : localhost:6379"
	@echo "  MinIO      : localhost:9000 (console: localhost:9001)"
	@echo "  Meilisearch: localhost:7700"

down: ## Stoppe tous les conteneurs
	docker compose down

down-v: ## Stoppe et supprime les volumes (reset complet)
	docker compose down -v

logs: ## Affiche les logs de tous les services
	docker compose logs -f

logs-api: ## Logs de l'API uniquement
	docker compose logs -f api

ps: ## Status des conteneurs
	docker compose ps

##@ Développement local

dev: ## Lance l'API Go et le frontend en parallèle (nécessite make up-infra)
	@echo "$(CYAN)Démarrage dev (API :8080, Frontend :3000)...$(RESET)"
	@trap 'kill 0' SIGINT; \
	  (cd backend && go run ./cmd/api) & \
	  (cd frontend && npm run dev) & \
	  wait

dev-api: ## Lance uniquement l'API Go
	cd backend && go run ./cmd/api

dev-frontend: ## Lance uniquement le frontend Next.js
	cd frontend && npm run dev

##@ Base de données

seed: ## Peuple la DB avec les données initiales (permissions, modules, admin user)
	cd backend && go run ./seed/main.go

migrate: ## Applique les migrations SQL manuellement
	@psql $${DATABASE_URL} < backend/migrations/001_schema.sql && echo "$(GREEN)✓ Migrations appliquées$(RESET)"

##@ Build

build: ## Build de production (backend + frontend)
	@$(MAKE) build-api build-frontend

build-api: ## Build du binaire Go
	cd backend && CGO_ENABLED=0 go build -ldflags="-w -s" -o bin/api ./cmd/api
	@echo "$(GREEN)✓ API buildée → backend/bin/api$(RESET)"

build-frontend: ## Build Next.js de production
	cd frontend && npm run build
	@echo "$(GREEN)✓ Frontend buildé$(RESET)"

##@ Qualité

test: ## Lance les tests Go
	cd backend && go test ./... -v -race

lint: ## Lint Go + Next.js
	cd backend && go vet ./...
	cd frontend && npm run lint

tidy: ## go mod tidy
	cd backend && go mod tidy

##@ Nettoyage

clean: ## Supprime les artefacts de build
	rm -rf backend/bin frontend/.next
	@echo "$(GREEN)✓ Artefacts supprimés$(RESET)"

clean-all: clean ## Supprime build + dépendances (réinstallation complète)
	rm -rf frontend/node_modules
	@echo "$(GREEN)✓ node_modules supprimés — relancez make setup$(RESET)"
