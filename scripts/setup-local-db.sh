#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found. Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
  exit 1
fi

echo "Starting Postgres (docker compose)..."
docker compose up -d

echo "Waiting for Postgres to accept connections..."
ready=0
for i in $(seq 1 45); do
  if docker compose exec -T db pg_isready -U gymsanity -d gymsanity >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done

if [ "$ready" -ne 1 ]; then
  echo "Timed out waiting for Postgres. Is Docker Desktop running?"
  exit 1
fi

echo "Applying Prisma schema..."
npx prisma db push

echo "Seeding demo data..."
npm run db:seed

echo ""
echo "Done. Next: npm run dev  →  http://localhost:3000"
