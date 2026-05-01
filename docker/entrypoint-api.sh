#!/bin/sh

echo "=== Running Prisma db:push ==="
cd /app/packages/database
npx prisma db push --skip-generate --accept-data-loss 2>&1 || echo "WARNING: Prisma db:push failed"
echo "=== Migration step done ==="

cd /app
exec dumb-init node apps/api/dist/apps/api/src/main
