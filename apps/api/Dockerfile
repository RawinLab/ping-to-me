# =============================================================================
# PingToMe API - Production Dockerfile
# Multi-stage build for NestJS API in Turborepo + pnpm monorepo
# Build context: monorepo root (docker build -f apps/api/Dockerfile .)
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Base - shared Alpine image with build tools
# ---------------------------------------------------------------------------
FROM node:20-alpine AS base

RUN apk add --no-cache python3 make g++ libc6-compat
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# ---------------------------------------------------------------------------
# Stage 2: Deps - install all dependencies
# ---------------------------------------------------------------------------
FROM base AS deps

WORKDIR /app

# Copy workspace root files first (for better layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy package manifests for install resolution
COPY packages/database/package.json ./packages/database/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY apps/api/package.json ./apps/api/package.json

# Install all dependencies
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# Stage 3: Build - compile TypeScript, generate Prisma client
# ---------------------------------------------------------------------------
FROM deps AS build

WORKDIR /app

# Copy full source for all required packages and the API app
COPY packages/database ./packages/database
COPY packages/types ./packages/types
COPY packages/config ./packages/config
COPY packages/ui ./packages/ui
COPY apps/api ./apps/api

# Generate Prisma client
RUN pnpm --filter @pingtome/database db:generate

# Build the API and its workspace dependencies (types, database)
RUN pnpm --filter api build

# Prune dev dependencies for production
RUN pnpm install --prod --frozen-lockfile

# ---------------------------------------------------------------------------
# Stage 4: Production - minimal runtime image
# ---------------------------------------------------------------------------
FROM node:20-alpine AS production

WORKDIR /app

# OpenSSL required by Prisma on Alpine
RUN apk add --no-cache openssl dumb-init

# Create non-root user
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup

# Copy production node_modules, built app, and packages
COPY --from=build --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=appuser:appgroup /app/packages/database ./packages/database
COPY --from=build --chown=appuser:appgroup /app/packages/types ./packages/types
COPY --from=build --chown=appuser:appgroup /app/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=appuser:appgroup /app/package.json ./package.json
COPY --from=build --chown=appuser:appgroup /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

USER appuser

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["dumb-init", "node", "apps/api/dist/apps/api/src/main"]
