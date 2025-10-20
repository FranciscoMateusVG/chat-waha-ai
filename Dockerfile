# Base stage for dependencies
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# Build stage
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

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
CMD ["npm", "run", "start:prod"]

