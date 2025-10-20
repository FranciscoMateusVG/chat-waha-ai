# Base stage for dependencies
FROM node:20-alpine
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.12.3

# Copy workspace files
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY apps/chat-ai/package.json ./apps/chat-ai/package.json
COPY packages/domains/package.json ./packages/domains/package.json
COPY packages/schemas/package.json ./packages/schemas/package.json

# Install dependencies first
RUN pnpm install

# Copy package source files
COPY packages ./packages

# Build the packages in the monorepo
RUN pnpm --filter "@repo/*" build

# Copy the rest of the application
COPY . .

# Build the application
ENV NODE_ENV=production
RUN pnpm --filter chat-ai build

# Add non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Create data directory for SQLite database
RUN mkdir -p /app/data && chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

# Start the application
CMD ["pnpm", "--filter", "chat-ai", "start:prod"]

