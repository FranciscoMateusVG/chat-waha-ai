# Chat WAHA AI - Command Runner
# Usage: just <command>

# Default: show available commands
default:
    @just --list

# ============== Docker Compose ==============

# Start dev environment (hot-reload)
dev:
    docker compose -f docker-compose.dev.yml up --build

# Start dev in background
dev-d:
    docker compose -f docker-compose.dev.yml up -d --build

# Stop dev environment
dev-down:
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

# View logs (all services)
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

# ============== API (Backend) ==============

# Install API dependencies
api-install:
    cd api && pnpm install

# Build API
api-build:
    cd api && pnpm build

# Run API in dev mode (without Docker)
api-dev:
    cd api && pnpm dev

# Run API tests
api-test:
    cd api && pnpm test

# Run API tests in watch mode
api-test-watch:
    cd api && pnpm test:watch

# Lint API code
api-lint:
    cd api && pnpm lint

# ============== Frontend ==============

# Install frontend dependencies
fe-install:
    cd frontend && pnpm install

# Build frontend
fe-build:
    cd frontend && pnpm build

# Run frontend in dev mode (without Docker)
fe-dev:
    cd frontend && pnpm dev

# Lint frontend code
fe-lint:
    cd frontend && pnpm lint

# Preview frontend build
fe-preview:
    cd frontend && pnpm preview

# ============== Full Stack (Local) ==============

# Install all dependencies
install: api-install fe-install

# Build everything
build: api-build fe-build

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

# ============== Cleanup ==============

# Stop all containers and remove volumes
clean:
    docker compose -f docker-compose.dev.yml down -v
    docker compose -f docker-compose.prod.yml down -v

# Remove node_modules
clean-deps:
    rm -rf api/node_modules frontend/node_modules

# Full clean (containers + deps)
clean-all: clean clean-deps

# Prune Docker (dangling images, build cache)
docker-prune:
    docker system prune -f

# ============== Utility ==============

# Show service URLs
urls:
    @echo "Dev Environment:"
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
    @curl -sf http://localhost:5173 > /dev/null && echo "Frontend (dev): OK" || echo "Frontend (dev): DOWN"
    @curl -sf http://localhost:8080 > /dev/null && echo "Frontend (prod): OK" || echo "Frontend (prod): DOWN"
