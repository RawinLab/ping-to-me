#!/bin/bash

# UAT Link Creation Test Runner
# This script runs the Link Creation UAT tests with proper setup

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}UAT: Link Creation Tests${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if servers are running
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check web server
if curl -s http://localhost:3010 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Web server is running (http://localhost:3010)"
else
    echo -e "${RED}✗${NC} Web server is NOT running (http://localhost:3010)"
    echo -e "${YELLOW}  Please start servers with: pnpm dev${NC}"
    exit 1
fi

# Check API server
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} API server is running (http://localhost:3001)"
else
    echo -e "${RED}✗${NC} API server is NOT running (http://localhost:3001)"
    echo -e "${YELLOW}  Please start servers with: pnpm dev${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Starting UAT tests...${NC}"
echo ""

# Navigate to web app directory
cd apps/web

# Run the tests
if npx playwright test uat-link-creation.spec.ts --project=chromium "$@"; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ All UAT tests completed${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "View detailed report: ${BLUE}npx playwright show-report${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}❌ Some tests failed${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "View detailed report: ${BLUE}npx playwright show-report${NC}"
    exit 1
fi
