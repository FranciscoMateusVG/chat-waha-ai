# Chat AI Development Commands

# Start the application with Docker Compose
start:
    docker-compose up --build

# Start in background
start-detached:
    docker-compose up --build -d

# Stop the application
stop:
    docker-compose down

# Restart the application
restart:
    docker-compose restart

# View logs
logs:
    docker-compose logs -f

# Clean up everything (containers, images, volumes)
clean:
    docker-compose down -v
    docker system prune -f

# Development mode (local)
dev:
    npm run dev

# Build for production
build:
    npm run build

# Run tests
test:
    npm test

# Database commands
db-studio:
    npm run db:studio

db-migrate:
    npm run db:migrate

# Show status
status:
    docker-compose ps