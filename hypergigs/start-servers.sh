#!/bin/bash

# HyperGigs Server Startup Script
# This script starts both backend and frontend servers

echo "🚀 Starting HyperGigs Servers..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is already running
if lsof -ti:3001 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Backend already running on port 3001${NC}"
else
    echo -e "${GREEN}✅ Starting backend...${NC}"
    npm run dev:backend &
    sleep 2
fi

# Check if frontend is already running
if lsof -ti:5173 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Frontend already running on port 5173${NC}"
else
    echo -e "${GREEN}✅ Starting frontend...${NC}"
    npm run dev:frontend &
    sleep 2
fi

echo ""
echo "🎉 Server Status:"
echo ""

# Verify backend
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend running at http://localhost:3001${NC}"
else
    echo -e "${RED}❌ Backend NOT responding${NC}"
fi

# Verify frontend
if lsof -ti:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend running at http://localhost:5173${NC}"
else
    echo -e "${RED}❌ Frontend NOT running${NC}"
fi

echo ""
echo "📝 Next steps:"
echo "1. Open http://localhost:5173/register"
echo "2. Register 5-6 freelancer accounts"
echo "3. Visit http://localhost:5173/freelancers to see them"
echo ""
echo "Press Ctrl+C to stop this script (servers will keep running)"
echo ""

# Keep script running so servers don't terminate
wait
