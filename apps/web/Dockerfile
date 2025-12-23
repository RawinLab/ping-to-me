# Multi-stage Dockerfile for Next.js 14 in Turborepo monorepo
# Optimized for production with minimal image size using standalone output

FROM node:20-alpine AS base

# ============================================================================
# STAGE 1: Prune dependencies and workspace for the web app
# ============================================================================
FROM base AS builder
WORKDIR /app

# Install turbo for monorepo pruning
RUN npm install -g turbo

# Copy the entire monorepo
COPY . .

# Prune the monorepo to only include web app dependencies
# This creates a sparse checkout of only necessary files
RUN turbo prune --scope=web --docker

# ============================================================================
# STAGE 2: Install dependencies
# ============================================================================
FROM base AS installer
WORKDIR /app

# Enable pnpm (corepack comes with Node.js 20)
RUN corepack enable

# Copy pruned dependency tree from builder
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install dependencies using pnpm
# Use --frozen-lockfile to prevent modifications during install
RUN pnpm install --frozen-lockfile

# Copy the pruned full source from builder
COPY --from=builder /app/out/full/ .

# Copy turbo config for build task
COPY turbo.json turbo.json

# Build the web app and its dependencies
# The --filter=web... builds web and all its dependencies (e.g., @pingtome/ui)
RUN pnpm turbo run build --filter=web...

# ============================================================================
# STAGE 3: Runtime - Create minimal production image
# ============================================================================
FROM base AS runner
WORKDIR /app

# Install dumb-init to handle signals properly
# This ensures the Node process receives SIGTERM for graceful shutdown
RUN apk add --no-cache dumb-init

# Create non-root user for security best practices
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy the entire app from installer (includes node_modules and built output)
COPY --from=installer /app .

# Switch to non-root user
USER nextjs

# Expose port 3000 (default Next.js port)
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals and prevent zombie processes
ENTRYPOINT ["dumb-init", "--"]

# Start the Next.js server
# The standalone output from the build creates a standalone server that doesn't need 'next start'
CMD ["node", "apps/web/.next/standalone/server.js"]
