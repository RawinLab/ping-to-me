FROM node:20-alpine AS base

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/types/package.json ./packages/types/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN pnpm install --frozen-lockfile

FROM deps AS build
WORKDIR /app

COPY packages/types ./packages/types
COPY packages/config ./packages/config
COPY packages/ui ./packages/ui
COPY apps/web ./apps/web

RUN pnpm --filter web build

FROM node:20-alpine AS production
WORKDIR /app

RUN apk add --no-cache dumb-init curl
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup

COPY --from=build --chown=appuser:appgroup /app/apps/web/.next/standalone ./
COPY --from=build --chown=appuser:appgroup /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=appuser:appgroup /app/apps/web/public ./apps/web/public

USER appuser

ENV NODE_ENV=production
ENV PORT=3010
ENV HOSTNAME="0.0.0.0"

EXPOSE 3010

HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=5 \
  CMD curl -sf http://localhost:3010/ || exit 1

CMD ["dumb-init", "node", "apps/web/server.js"]
