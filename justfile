# Chat WAHA AI - Command Runner
# Usage: just <command>

# Default: show available commands
default:
    @just --list

# ============== Local Development (Turborepo) ==============

# Start infrastructure (WAHA) in background
infra-up:
    docker compose -f docker-compose.infra.yml up -d

# Stop infrastructure
infra-down:
    docker compose -f docker-compose.infra.yml down

# Check if infrastructure is running
infra-status:
    docker compose -f docker-compose.infra.yml ps

# View infrastructure logs
infra-logs:
    docker compose -f docker-compose.infra.yml logs -f

# Start development (FE + BE with Turborepo)
# Ensures infra is up first
dev: infra-up
    pnpm dev

# Build all packages
build:
    pnpm build

# Run tests
test:
    pnpm test

# Run linting
lint:
    pnpm lint

# Install all dependencies
install:
    pnpm install

# ============== Docker Compose (Full Stack) ==============

# Start dev environment in Docker (hot-reload)
dev-docker:
    docker compose -f docker-compose.dev.yml up --build

# Start dev in background (Docker)
dev-docker-d:
    docker compose -f docker-compose.dev.yml up -d --build

# Stop dev environment (Docker)
dev-docker-down:
    docker compose -f docker-compose.dev.yml down

# Start prod environment
prod:
    docker compose -f docker-compose.prod.yml up --build

# Start prod in background
prod-d:
    docker compose -f docker-compose.prod.yml up -d --build

# Stop prod environment
prod-down:
    docker compose -f docker-compose.prod.yml down

# View logs (Docker dev)
logs service="":
    @if [ -z "{{service}}" ]; then \
        docker compose -f docker-compose.dev.yml logs -f; \
    else \
        docker compose -f docker-compose.dev.yml logs -f {{service}}; \
    fi

# View prod logs
logs-prod service="":
    @if [ -z "{{service}}" ]; then \
        docker compose -f docker-compose.prod.yml logs -f; \
    else \
        docker compose -f docker-compose.prod.yml logs -f {{service}}; \
    fi

# Show running containers
ps:
    docker compose -f docker-compose.dev.yml ps

# ============== Individual Packages ==============

# Run only API in dev mode
api-dev:
    cd api && pnpm dev

# Run only frontend in dev mode
fe-dev:
    cd frontend && pnpm dev

# Build only API
api-build:
    cd api && pnpm build

# Build only frontend
fe-build:
    cd frontend && pnpm build

# Run API tests
api-test:
    cd api && pnpm test

# Lint API
api-lint:
    cd api && pnpm lint

# Lint frontend
fe-lint:
    cd frontend && pnpm lint

# ============== Database ==============

# Generate DB migrations
db-generate:
    cd api && pnpm db:generate

# Push DB schema
db-push:
    cd api && pnpm db:push

# Open Drizzle Studio
db-studio:
    cd api && pnpm db:studio

# ============== Infrastructure (for local Turbo dev) ==============

# Start infrastructure services (WAHA only)
infra-up:
    docker compose -f docker-compose.infra.yml up -d

# Stop infrastructure services
infra-down:
    docker compose -f docker-compose.infra.yml down

# View infrastructure logs
infra-logs:
    docker compose -f docker-compose.infra.yml logs -f

# Restart infrastructure services
infra-restart: infra-down infra-up

# ============== Cleanup ==============

# Stop all containers and remove volumes
clean:
    docker compose -f docker-compose.infra.yml down -v
    docker compose -f docker-compose.dev.yml down -v
    docker compose -f docker-compose.prod.yml down -v

# Remove node_modules
clean-deps:
    rm -rf node_modules api/node_modules frontend/node_modules

# Full clean (containers + deps)
clean-all: clean clean-deps

# Prune Docker (dangling images, build cache)
docker-prune:
    docker system prune -f

# ============== Utility ==============

# Show service URLs
urls:
    @echo "Local Development (Turborepo):"
    @echo "  Frontend: http://localhost:5173"
    @echo "  API:      http://localhost:3001"
    @echo "  WAHA:     http://localhost:3002"
    @echo ""
    @echo "Docker Dev Environment:"
    @echo "  Frontend: http://localhost:5173"
    @echo "  API:      http://localhost:3001"
    @echo "  WAHA:     http://localhost:3002"
    @echo ""
    @echo "Prod Environment:"
    @echo "  Frontend: http://localhost:8080"
    @echo "  API:      http://localhost:3001"
    @echo "  WAHA:     http://localhost:3002"

# Check if services are healthy
health:
    @echo "Checking services..."
    @curl -sf http://localhost:3001/health > /dev/null && echo "API: OK" || echo "API: DOWN"
    @curl -sf http://localhost:5173 > /dev/null && echo "Frontend: OK" || echo "Frontend: DOWN"
    @curl -sf http://localhost:3002/api/health > /dev/null && echo "WAHA: OK" || echo "WAHA: DOWN"
