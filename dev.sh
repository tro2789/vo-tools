#!/bin/bash

# VO Tools Development Helper Script
# Makes it easy to manage development and production environments

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

function print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  VO Tools Development Manager${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

function show_status() {
    echo ""
    echo -e "${YELLOW}Container Status:${NC}"
    
    if docker ps --filter name=vo-tools-dev --format "{{.Names}}" | grep -q "vo-tools-dev"; then
        echo -e "  ${GREEN}✓${NC} Development (vo-tools-dev) - Running on ports 3011/5001"
    else
        echo -e "  ${RED}✗${NC} Development (vo-tools-dev) - Stopped"
    fi
    
    if docker ps --filter name=vo-tools --format "{{.Names}}" | grep -q "^vo-tools$"; then
        echo -e "  ${GREEN}✓${NC} Production (vo-tools) - Running on ports 3010/5000"
    else
        echo -e "  ${RED}✗${NC} Production (vo-tools) - Stopped"
    fi
    
    echo ""
    echo -e "${YELLOW}Git Branch:${NC}"
    BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
    if [ "$BRANCH" = "dev" ]; then
        echo -e "  ${GREEN}✓${NC} On dev branch (recommended for development)"
    elif [ "$BRANCH" = "main" ]; then
        echo -e "  ${YELLOW}⚠${NC} On main branch (production)"
    else
        echo -e "  ${BLUE}ℹ${NC} On branch: $BRANCH"
    fi
    echo ""
}

function start_dev() {
    echo -e "${GREEN}Starting development environment...${NC}"
    docker-compose -f docker-compose.dev.yml up -d --build
    echo -e "${GREEN}✓ Development environment started!${NC}"
    echo -e "  Frontend: ${BLUE}http://localhost:3011${NC}"
    echo -e "  API: ${BLUE}http://localhost:5001${NC}"
    echo ""
    echo -e "Tip: Run ${YELLOW}./dev.sh logs${NC} to view logs"
}

function stop_dev() {
    echo -e "${YELLOW}Stopping development environment...${NC}"
    docker-compose -f docker-compose.dev.yml down
    echo -e "${GREEN}✓ Development environment stopped${NC}"
}

function restart_dev() {
    echo -e "${YELLOW}Restarting development environment...${NC}"
    docker-compose -f docker-compose.dev.yml restart
    echo -e "${GREEN}✓ Development environment restarted${NC}"
}

function rebuild_dev() {
    echo -e "${YELLOW}Rebuilding development environment...${NC}"
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.dev.yml up -d --build
    echo -e "${GREEN}✓ Development environment rebuilt${NC}"
}

function show_logs() {
    echo -e "${BLUE}Showing development logs (Ctrl+C to exit)...${NC}"
    docker logs -f vo-tools-dev
}

function deploy_to_prod() {
    echo -e "${YELLOW}Deploying to production...${NC}"
    
    # Check if on dev branch
    BRANCH=$(git branch --show-current)
    if [ "$BRANCH" != "dev" ]; then
        echo -e "${RED}✗ Error: You must be on the dev branch${NC}"
        exit 1
    fi
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        echo -e "${RED}✗ Error: You have uncommitted changes${NC}"
        echo "  Commit or stash your changes first"
        exit 1
    fi
    
    echo "  1. Pushing dev branch..."
    git push origin dev
    
    echo "  2. Switching to main branch..."
    git checkout main
    
    echo "  3. Pulling latest main..."
    git pull origin main
    
    echo "  4. Merging dev into main..."
    git merge dev -m "Deploy: Merge dev into main"
    
    echo "  5. Pushing to main..."
    git push origin main
    
    echo "  6. Rebuilding production container..."
    docker-compose down
    docker-compose up -d --build
    
    echo "  7. Switching back to dev branch..."
    git checkout dev
    
    echo -e "${GREEN}✓ Deployment complete!${NC}"
    echo -e "  Production: ${BLUE}http://localhost:3010${NC}"
}

function show_help() {
    echo ""
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start       Start development environment"
    echo "  stop        Stop development environment"
    echo "  restart     Restart development environment"
    echo "  rebuild     Rebuild and restart development environment"
    echo "  logs        Show development environment logs"
    echo "  status      Show status of all environments"
    echo "  deploy      Deploy dev branch to production"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./dev.sh start          # Start dev environment"
    echo "  ./dev.sh rebuild        # Rebuild after code changes"
    echo "  ./dev.sh deploy         # Deploy to production"
    echo ""
}

# Main script logic
print_header

case "${1:-help}" in
    start)
        start_dev
        show_status
        ;;
    stop)
        stop_dev
        show_status
        ;;
    restart)
        restart_dev
        show_status
        ;;
    rebuild)
        rebuild_dev
        show_status
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    deploy)
        deploy_to_prod
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac
