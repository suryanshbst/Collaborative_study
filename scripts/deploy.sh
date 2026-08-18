#!/usr/bin/env bash

# ==============================================================================
# StudySphere - Standalone Deployment / Update Script
# ==============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "========================================================"
echo "🚀 Deploying StudySphere in $PROJECT_DIR"
echo "========================================================"

# 1. Pull Latest Code
echo "📥 Pulling latest git updates..."
git pull origin main || git pull origin master

# 2. Database Sync
echo "🗄️ Checking database schema..."
if [ -f "packages/db/.env" ] || [ -f ".env" ]; then
    if command -v bun &> /dev/null; then
        cd packages/db && bun x prisma db push --skip-generate && cd ../..
    fi
fi

# 3. Build & Restart Containers
echo "🐳 Building and reloading Docker containers..."
docker compose build
docker compose up -d --remove-orphans

# 4. Cleanup
echo "🧹 Pruning stale images..."
docker image prune -f

echo "========================================================"
echo "✅ StudySphere successfully deployed and running!"
echo "========================================================"
