#!/bin/bash
# ============================================================
# SanadFlow Database Connection Test Script
# ============================================================
# 
# Tests both pooler (port 6543) and direct (port 5432) connections
# to Supabase PostgreSQL
#
# Usage: ./scripts/test-db-connection.sh
# ============================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "============================================"
echo "SanadFlow Database Connection Test"
echo "============================================"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}ERROR: .env.local file not found${NC}"
    echo "Please create .env.local with DATABASE_URL and DIRECT_URL"
    exit 1
fi

# Load environment variables
set -a
source .env.local
set +a

# Verify required variables
if [ -z "${DATABASE_URL:-}" ]; then
    echo -e "${RED}ERROR: DATABASE_URL not set in .env.local${NC}"
    exit 1
fi

if [ -z "${DIRECT_URL:-}" ]; then
    echo -e "${RED}ERROR: DIRECT_URL not set in .env.local${NC}"
    exit 1
fi

echo "1. Testing Pooler Connection (port 6543)..."
echo "-------------------------------------------"
if timeout 30 psql "${DATABASE_URL}" -c "SELECT version();" 2>&1; then
    echo -e "${GREEN}✅ Pooler connection successful${NC}"
else
    echo -e "${RED}❌ Pooler connection failed${NC}"
fi
echo ""

echo "2. Testing Direct Connection (port 5432)..."
echo "-------------------------------------------"
if timeout 30 psql "${DIRECT_URL}" -c "SELECT version();" 2>&1; then
    echo -e "${GREEN}✅ Direct connection successful${NC}"
else
    echo -e "${RED}❌ Direct connection failed${NC}"
fi
echo ""

echo "3. Checking PostgreSQL Extensions..."
echo "-------------------------------------------"
psql "${DATABASE_URL}" -c "SELECT extname, extversion FROM pg_extension WHERE extname IN ('pg_trgm', 'unaccent');" 2>&1 || echo -e "${YELLOW}⚠️ Extension check failed${NC}"
echo ""

echo "4. Database Basic Info..."
echo "-------------------------------------------"
psql "${DATABASE_URL}" -c "SELECT current_database() AS database, current_user AS user, inet_server_port() AS port;" 2>&1 || echo -e "${YELLOW}⚠️ Info check failed${NC}"
echo ""

echo "============================================"
echo "Test Complete"
echo "============================================"
