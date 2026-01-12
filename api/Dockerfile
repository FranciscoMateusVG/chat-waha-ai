# Base stage for dependencies
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat curl
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Install dependencies
FROM base AS deps
RUN apk add --no-cache python3 make g++
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod --config.ignore-scripts=false

# Build stage
FROM base AS build
RUN apk add --no-cache python3 make g++
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --config.ignore-scripts=false
COPY . .
RUN pnpm run build

# Production stage
FROM base AS runner
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Create data directory for SQLite database
RUN mkdir -p /app/data && chown -R nestjs:nodejs /app

# Copy built application
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/package.json ./package.json

# Copy database file if it exists
COPY --chown=nestjs:nodejs chat-ai-data.sqlite* ./

USER nestjs

EXPOSE 3000

# Start the application
CMD ["node", "dist/src/main"]

