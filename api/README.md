# Chat AI API

A NestJS-based chat application with AI integration, WhatsApp support, and notification system.

## 📋 Table of Contents

- [Chat AI API](#chat-ai-api)
  - [📋 Table of Contents](#-table-of-contents)
  - [🔧 Prerequisites](#-prerequisites)
    - [Windows-Specific Requirements](#windows-specific-requirements)
  - [⚙️ Environment Setup](#️-environment-setup)
  - [🐳 Running with Docker](#-running-with-docker)
    - [Production Mode](#production-mode)
    - [Development Mode with Hot Reload](#development-mode-with-hot-reload)
    - [Using Just Commands (Optional)](#using-just-commands-optional)
  - [💻 Local Development (Without Docker)](#-local-development-without-docker)
  - [🗄️ Database Management](#️-database-management)
    - [Run Migrations](#run-migrations)
    - [Open Drizzle Studio (Database GUI)](#open-drizzle-studio-database-gui)
    - [Generate Migrations](#generate-migrations)
    - [Other Database Commands](#other-database-commands)
  - [📚 API Documentation](#-api-documentation)
  - [📜 Available Scripts](#-available-scripts)
    - [Development](#development)
    - [Testing](#testing)
    - [Code Quality](#code-quality)
    - [Database](#database)
  - [📁 Project Structure](#-project-structure)
  - [🔍 Troubleshooting](#-troubleshooting)
    - [Windows-Specific Issues](#windows-specific-issues)
      - [Line Ending Issues (CRLF vs LF)](#line-ending-issues-crlf-vs-lf)
      - [WSL2 Performance](#wsl2-performance)
      - [PowerShell Commands](#powershell-commands)
      - [Docker Desktop Not Starting](#docker-desktop-not-starting)
    - [Apple Silicon (M1/M2/M3) - WAHA Platform Issue](#apple-silicon-m1m2m3---waha-platform-issue)
    - [Port Already in Use](#port-already-in-use)
    - [Docker Build Issues](#docker-build-issues)
    - [Hot Reload Not Working](#hot-reload-not-working)
    - [Database Issues](#database-issues)
    - [Permission Issues](#permission-issues)
  - [📋 Quick Reference: Cross-Platform Commands](#-quick-reference-cross-platform-commands)
    - [Starting Docker](#starting-docker)
    - [Finding Process on Port](#finding-process-on-port)
    - [Environment Variables](#environment-variables)
  - [🤝 Contributing](#-contributing)
  - [📝 License](#-license)
  - [📧 Support](#-support)

## 🔧 Prerequisites

- **Docker** and **Docker Compose** (v3.8+)
  - **Windows**: Docker Desktop with WSL2 backend enabled
  - **Mac**: Docker Desktop for Mac
  - **Linux**: Docker Engine and Docker Compose
- **Node.js** 20+ (for local development without Docker)
- **npm** or **yarn**
- **(Optional) Just** - command runner for easier development

### Windows-Specific Requirements

If you're on Windows, make sure you have:

1. **WSL2** installed and enabled

   ```powershell
   wsl --install
   ```

2. **Docker Desktop for Windows** with WSL2 integration enabled
   - Settings → General → "Use the WSL 2 based engine" (checked)
   - Settings → Resources → WSL Integration → Enable for your distro

3. **Git configured for line endings** (to avoid issues):
   ```bash
   git config --global core.autocrlf input
   ```

## ⚙️ Environment Setup

1. Create a `.env` file in the root directory:

```bash
# API Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
API_KEY=your-api-key-here

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Email Configuration
SMTP_PASSWORD=your-smtp-password

# WhatsApp (WAHA) Configuration
WAHA_BASE_URL=http://waha:3000
WAHA_DEFAULT_SESSION=default
```

2. Adjust the values according to your needs.

## 🐳 Running with Docker

> **💡 Windows Users:** Run all Docker commands in WSL2 terminal (Ubuntu, etc.) for best performance. Avoid using PowerShell or Command Prompt for Docker operations when possible.

### Production Mode

Run the application in production mode using the standard Docker Compose configuration:

```bash
# Or run in detached mode (background)
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The API will be available at:

- **API**: http://localhost:3000
- **WAHA (WhatsApp)**: http://localhost:3001

### Development Mode with Hot Reload

For development with hot reload, use the development Docker Compose configuration:

```bash
# Run in detached mode
docker-compose -f docker-compose.dev.yml up --build -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f chat-ai

# Stop services
docker-compose -f docker-compose.dev.yml down
```

**Features in Development Mode:**

- ✅ Hot reload on file changes
- ✅ Source code mounted as volume
- ✅ node_modules persisted in named volume
- ✅ Debug logging enabled
- ✅ TypeScript compilation on the fly

**Note:** Changes to source files will automatically trigger a restart of the application.

### Using Just Commands (Optional)

If you have [Just](https://github.com/casey/just) installed, you can use the provided shortcuts:

```bash
# Production mode
just start           # Start with Docker Compose
just start-detached  # Start in background
just stop           # Stop services
just logs           # View logs
just clean          # Clean up everything

# Development mode
just dev            # Run local development (without Docker)
just status         # Show Docker status

# Database
just db-studio      # Open Drizzle Studio
just db-migrate     # Run migrations
```

## 💻 Local Development (Without Docker)

For local development without Docker containers:

1. **Install dependencies:**

```bash
npm install
```

2. **Start the development server:**

```bash
npm run dev
```

The server will start with hot reload at http://localhost:3000

**Available npm scripts:**

```bash
npm run dev          # Start with hot reload
npm run start:debug  # Start with debug mode
npm run build        # Build for production
npm run start:prod   # Run production build
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Lint code
```

## 🗄️ Database Management

This project uses SQLite with Drizzle ORM.

### Run Migrations

```bash
npm run db:migrate
```

### Open Drizzle Studio (Database GUI)

```bash
npm run db:studio
```

Access Drizzle Studio at http://localhost:4983

### Generate Migrations

```bash
npm run db:generate
```

### Other Database Commands

```bash
npm run db:push    # Push schema changes
npm run db:drop    # Drop tables
```

## 📚 API Documentation

Once the application is running, access the Swagger documentation at:

- **Swagger UI**: http://localhost:3000/api
- **OpenAPI JSON**: http://localhost:3000/api-json

## 📜 Available Scripts

### Development

- `npm run dev` - Start development server with hot reload
- `npm run start:debug` - Start with debug mode and hot reload
- `npm run build` - Build the application
- `npm run start:prod` - Run production build

### Testing

- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:unit` - Run unit tests only

### Code Quality

- `npm run lint` - Lint and fix code
- `npm run format` - Format code with Prettier

### Database

- `npm run db:generate` - Generate migrations
- `npm run db:migrate` - Run migrations
- `npm run db:push` - Push schema changes
- `npm run db:studio` - Open Drizzle Studio

## 📁 Project Structure

```
api/
├── src/
│   ├── ai/                    # AI integration module
│   │   ├── application/       # Use cases
│   │   ├── infrastructure/    # Controllers, cron jobs, services
│   │   └── tools/            # AI tool registry
│   ├── auth/                 # Authentication module
│   ├── chatHistory/          # Chat history management
│   │   ├── application/      # DTOs and use cases
│   │   ├── controllers/      # REST controllers
│   │   ├── domain/          # Entities, repositories, value objects
│   │   └── infrastructure/   # Persistence layer
│   ├── knowledge/            # Knowledge base module
│   │   ├── application/      # Use cases
│   │   ├── domain/          # Entities and repositories
│   │   ├── infrastructure/   # Persistence
│   │   └── presentation/     # Controllers and DTOs
│   ├── notifications/        # Notification system
│   │   ├── application/      # Event handlers, use cases
│   │   ├── domain/          # Entities, events, services
│   │   ├── infrastructure/   # External services, persistence
│   │   └── presentation/     # Controllers
│   ├── user/                # User management
│   ├── infrastructure/      # Shared infrastructure (DB, external services)
│   └── main.ts             # Application entry point
├── test/                    # E2E tests
├── docker-compose.yml       # Production Docker configuration
├── docker-compose.dev.yml   # Development Docker configuration
├── Dockerfile              # Production Dockerfile
├── package.json           # Dependencies and scripts
└── drizzle.config.ts      # Database configuration
```

## 🔍 Troubleshooting

### Windows-Specific Issues

#### Line Ending Issues (CRLF vs LF)

If you get errors about line endings or scripts failing to execute:

```bash
# Clone the repository with Linux line endings
git clone -c core.autocrlf=input <repository-url>

# Or fix existing files
git config core.autocrlf input
git rm --cached -r .
git reset --hard
```

#### WSL2 Performance

For better performance on Windows, clone and work within your WSL2 filesystem:

```bash
# Inside WSL2 terminal (Ubuntu, etc.)
cd ~
git clone <repository-url>
cd chat-whats-ai/api
docker-compose -f docker-compose.dev.yml up --build
```

**Avoid** working in `/mnt/c/` (Windows filesystem) as it's much slower.

#### PowerShell Commands

If using PowerShell (instead of WSL2), use these commands:

```powershell
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Find process using a port
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

#### Docker Desktop Not Starting

If Docker Desktop fails to start:

1. Enable WSL2 in Windows Features:
   - Open "Turn Windows features on or off"
   - Enable "Virtual Machine Platform" and "Windows Subsystem for Linux"
   - Restart your computer

2. Update WSL2:

   ```powershell
   wsl --update
   ```

3. Restart Docker Desktop

### Apple Silicon (M1/M2/M3) - WAHA Platform Issue

If you're on an Apple Silicon Mac and get an error like:

```
Error: no matching manifest for linux/arm64/v8 in the manifest list entries
```

This is already fixed in the Docker Compose files with `platform: linux/amd64`. The WAHA service will run using Rosetta 2 emulation. Make sure you have:

1. **Docker Desktop for Mac** with Apple Silicon support installed
2. **Rosetta 2** installed (usually automatic, but can be installed with):
   ```bash
   softwareupdate --install-rosetta
   ```

If you still encounter issues, try:

```bash
# Clean up and rebuild
docker-compose down -v
docker-compose up --build
```

### Port Already in Use

If you get a "port already in use" error:

**Linux/Mac:**

```bash
# Find and kill the process using port 3000
lsof -ti:3000 | xargs kill -9
```

**Windows (PowerShell):**

```powershell
# Find and kill the process using port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

**Or change the port in docker-compose.yml:**

```yaml
ports:
  - '3001:3000' # Change 3001 to another port
```

### Docker Build Issues

```bash
# Clean up Docker resources
docker-compose down -v
docker system prune -f

# Rebuild from scratch
docker-compose build --no-cache
```

### Hot Reload Not Working

Make sure you're using the development Docker Compose file:

```bash
docker-compose -f docker-compose.dev.yml up
```

If hot reload still doesn't work, try:

```bash
# Stop containers
docker-compose -f docker-compose.dev.yml down

# Remove volumes
docker volume rm chat-whats-ai-api_node_modules

# Rebuild and start
docker-compose -f docker-compose.dev.yml up --build
```

### Database Issues

If you encounter database errors:

```bash
# Reset database
rm chat-ai-data.sqlite

# Run migrations again
npm run db:migrate
```

### Permission Issues

**Linux:**

```bash
# Fix ownership of files
sudo chown -R $USER:$USER .

# Add your user to docker group (to avoid using sudo)
sudo usermod -aG docker $USER
newgrp docker
```

**Mac:**

```bash
# Fix ownership of files
sudo chown -R $USER:$USER .
```

**Windows:**

- Make sure Docker Desktop is running as Administrator
- Ensure your WSL2 user has proper permissions:
  ```bash
  # Inside WSL2
  sudo chown -R $USER:$USER .
  ```

## 📋 Quick Reference: Cross-Platform Commands

### Starting Docker

| Platform    | Recommended Terminal | Command                                               |
| ----------- | -------------------- | ----------------------------------------------------- |
| **Windows** | WSL2 (Ubuntu)        | `docker-compose -f docker-compose.dev.yml up --build` |
| **Mac**     | Terminal / iTerm     | `docker-compose -f docker-compose.dev.yml up --build` |
| **Linux**   | Bash / Zsh           | `docker-compose -f docker-compose.dev.yml up --build` |

### Finding Process on Port

| Platform                 | Command                                                                |
| ------------------------ | ---------------------------------------------------------------------- |
| **Windows (PowerShell)** | `Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess` |
| **Mac / Linux**          | `lsof -ti:3000`                                                        |

### Environment Variables

| Platform                 | Set Variable                | Command |
| ------------------------ | --------------------------- | ------- |
| **Windows (PowerShell)** | `$env:API_KEY="your-key"`   |
| **Windows (CMD)**        | `set API_KEY=your-key`      |
| **Mac / Linux**          | `export API_KEY="your-key"` |

**💡 Best Practice:** Use a `.env` file instead of setting variables manually!

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the UNLICENSED license.

## 📧 Support

For issues and questions, please open an issue in the repository.

---

**Happy Coding! 🚀**
