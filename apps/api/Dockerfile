FROM node:20-alpine AS base

FROM base AS builder
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=api --docker

FROM base AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

# Generate Prisma client
RUN pnpm --filter @pingtome/database db:generate

# Build the API and its dependencies
RUN pnpm turbo run build --filter=api...

FROM base AS runner
WORKDIR /app

COPY --from=installer /app .

# Set proper permissions for node user (built-in in node:alpine)
RUN chown -R node:node /app

USER node

# Cloud Run requires PORT env var, default to 3000
ENV PORT=3000 NODE_ENV=production

EXPOSE 3000

CMD ["node", "apps/api/dist/apps/api/src/main"]
