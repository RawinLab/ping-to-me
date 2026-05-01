FROM node:20-alpine

ENV NODE_ENV=development

RUN apk add --no-cache python3 make g++ libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/database/package.json ./packages/database/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY apps/api/package.json ./apps/api/package.json

RUN pnpm install --frozen-lockfile 2>&1 || pnpm install --no-frozen-lockfile 2>&1

COPY packages/database ./packages/database
COPY packages/types ./packages/types
COPY packages/config ./packages/config
COPY packages/ui ./packages/ui
COPY apps/api ./apps/api

RUN pnpm --filter @pingtome/types build
RUN pnpm --filter @pingtome/database db:generate
RUN pnpm --filter api build

RUN apk add --no-cache dumb-init curl
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup

USER appuser

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD curl -sf http://localhost:3001/health || exit 1

COPY docker/entrypoint-api.sh /app/entrypoint-api.sh
RUN chmod +x /app/entrypoint-api.sh

CMD ["/app/entrypoint-api.sh"]
