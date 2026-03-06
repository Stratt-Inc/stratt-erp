#!/usr/bin/env bash
# setup.sh — Initialisation de l'environnement de développement Axiora
set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}▶ Axiora — Setup environnement développement${NC}"

# 1. Vérification des prérequis
echo -e "\n${YELLOW}1. Vérification des prérequis...${NC}"
command -v go >/dev/null 2>&1 || { echo "Go 1.23+ requis. https://golang.org/dl/"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js 20+ requis. https://nodejs.org/"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "pnpm requis. npm install -g pnpm"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker requis. https://docs.docker.com/get-docker/"; exit 1; }
echo -e "${GREEN}✓ Tous les prérequis sont présents${NC}"

# 2. Variables d'environnement
echo -e "\n${YELLOW}2. Configuration des variables d'environnement...${NC}"
if [ ! -f .env ]; then
  cp .env.example .env
  echo -e "${GREEN}✓ .env créé depuis .env.example — Editez-le avec vos valeurs${NC}"
else
  echo -e "${GREEN}✓ .env déjà présent${NC}"
fi

# 3. Installation des dépendances Node.js
echo -e "\n${YELLOW}3. Installation des dépendances pnpm...${NC}"
pnpm install --frozen-lockfile
echo -e "${GREEN}✓ Dépendances installées${NC}"

# 4. Git hooks
echo -e "\n${YELLOW}4. Installation des hooks Git (Husky)...${NC}"
pnpm prepare
echo -e "${GREEN}✓ Hooks pre-commit installés${NC}"

# 5. Dépendances Go
echo -e "\n${YELLOW}5. Dépendances Go...${NC}"
cd apps/api && go mod download && cd ../..
echo -e "${GREEN}✓ Modules Go téléchargés${NC}"

# 6. Infrastructure Docker
echo -e "\n${YELLOW}6. Démarrage de l'infrastructure Docker...${NC}"
docker compose -f infrastructure/docker/docker-compose.yml up -d postgres redis minio
echo "Attente de PostgreSQL..."
until docker compose -f infrastructure/docker/docker-compose.yml exec postgres pg_isready -U axiora -d axiora_dev >/dev/null 2>&1; do
  sleep 1
done
echo -e "${GREEN}✓ PostgreSQL prêt${NC}"

# 7. Migrations
echo -e "\n${YELLOW}7. Application des migrations...${NC}"
cd apps/api && go run ./cmd/migrate up && cd ../..
echo -e "${GREEN}✓ Migrations appliquées${NC}"

# 8. Seed (optionnel)
echo -e "\n${YELLOW}8. Seeding des données de développement...${NC}"
bash infrastructure/scripts/seed.sh
echo -e "${GREEN}✓ Données de démo chargées${NC}"

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Environnement prêt !${NC}"
echo -e ""
echo -e "  ${CYAN}pnpm dev${NC}           → Démarre web (3000) + api (8080)"
echo -e "  ${CYAN}pnpm test${NC}          → Lance les tests"
echo -e "  ${CYAN}pnpm lint${NC}          → Lint TypeScript + Go"
echo -e ""
echo -e "  Frontend : ${CYAN}http://localhost:3000${NC}"
echo -e "  API      : ${CYAN}http://localhost:8080${NC}"
echo -e "  Swagger  : ${CYAN}http://localhost:8080/swagger${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
