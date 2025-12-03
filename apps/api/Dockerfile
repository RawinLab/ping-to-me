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
RUN pnpm install

COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
RUN pnpm turbo run build --filter=api...

FROM base AS runner
WORKDIR /app
COPY --from=installer /app .
CMD ["node", "apps/api/dist/main"]
