#!/bin/sh
set -e

echo "=== Running Prisma db:push ==="
cd /app/packages/database
npx prisma db push --skip-generate --accept-data-loss 2>&1 || {
  echo "WARNING: Prisma db:push failed, continuing anyway..."
}
echo "=== Migration complete ==="

cd /app
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
