#!/bin/sh
set -e

echo "Running Prisma db:push..."
cd /app/packages/database
npx prisma db push --skip-generate --accept-data-loss
echo "Migration complete."

cd /app
exec dumb-init node apps/api/dist/apps/api/src/main
