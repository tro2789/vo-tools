# VO Tools Development Workflow

This guide explains how to work with the development environment while keeping production running safely.

## Environment Overview

### Production Environment
- **Container**: `vo-tools` (production)
- **Ports**: 3010 (Frontend), 5000 (API)
- **URL**: https://votools.tohareprod.com
- **Branch**: `main`
- **Docker Compose**: `docker-compose.yml`

### Development Environment
- **Container**: `vo-tools-dev` (development)
- **Ports**: 3011 (Frontend), 5001 (API)
- **URL**: http://localhost:3011 (or configure subdomain)
- **Branch**: `dev`
- **Docker Compose**: `docker-compose.dev.yml`

Both environments can run simultaneously without conflicts.

## Quick Start

### 1. Start Development Environment

```bash
cd vo-tools

# Build and start dev container
docker-compose -f docker-compose.dev.yml up -d --build

# View logs
docker logs -f vo-tools-dev

# Stop dev container
docker-compose -f docker-compose.dev.yml down
```

### 2. Access Development Site

- Frontend: http://localhost:3011
- API: http://localhost:5001

## Git Workflow

### Initial Setup

```bash
# Create and checkout dev branch (first time only)
git checkout -b dev

# Push to Gitea
git push -u origin dev
```

### Daily Development Workflow

```bash
# 1. Make sure you're on dev branch
git checkout dev

# 2. Pull latest changes
git pull origin dev

# 3. Make your changes to the code
# ... edit files ...

# 4. Test in development environment
docker-compose -f docker-compose.dev.yml up -d --build

# 5. Stage and commit changes
git add .
git commit -m "Description of changes"

# 6. Push to dev branch
git push origin dev
```

### Promoting Changes to Production

When you're ready to deploy tested changes from dev to production:

```bash
# 1. Ensure dev branch is up to date and tested
docker-compose -f docker-compose.dev.yml up -d --build
# Test thoroughly at http://localhost:3011

# 2. Switch to main branch
git checkout main

# 3. Merge dev into main
git merge dev

# 4. Push to main
git push origin main

# 5. Rebuild production container
docker-compose down
docker-compose up -d --build

# 6. Verify production
# Check https://votools.tohareprod.com

# 7. Switch back to dev branch for continued development
git checkout dev
```

## Development Commands

### Container Management

```bash
# Start both environments
docker-compose up -d                          # Production
docker-compose -f docker-compose.dev.yml up -d # Development

# Stop specific environment
docker-compose down                           # Production
docker-compose -f docker-compose.dev.yml down # Development

# Rebuild after code changes
docker-compose -f docker-compose.dev.yml up -d --build

# View logs
docker logs -f vo-tools-dev
docker logs -f vo-tools

# Restart services
docker-compose -f docker-compose.dev.yml restart
```

### Debugging

```bash
# Execute commands in dev container
docker exec -it vo-tools-dev bash

# Check running processes
docker exec vo-tools-dev ps aux

# Test Flask API directly
docker exec vo-tools-dev curl http://localhost:5000/health

# Test Next.js
docker exec vo-tools-dev curl http://localhost:3000
```

## Branch Strategy

### Main Branch (`main`)
- **Purpose**: Production-ready code
- **Deploys to**: Production container (ports 3010/5000)
- **Updates**: Only via tested merges from `dev`
- **Protection**: Should be stable and thoroughly tested

### Development Branch (`dev`)
- **Purpose**: Active development and testing
- **Deploys to**: Development container (ports 3011/5001)
- **Updates**: Direct commits during development
- **Testing**: All new features tested here first

### Feature Branches (Optional)
For larger features, you can create feature branches:

```bash
# Create feature branch from dev
git checkout dev
git checkout -b feature/new-tool

# Work on feature
# ... make changes ...

# Merge back to dev when ready
git checkout dev
git merge feature/new-tool
git push origin dev

# Delete feature branch
git branch -d feature/new-tool
```

## Environment Variables

### Production (docker-compose.yml)
```yaml
environment:
  - NODE_ENV=production
  - FLASK_API_URL=http://localhost:5000
  - ALLOWED_ORIGINS=*
```

### Development (docker-compose.dev.yml)
```yaml
environment:
  - NODE_ENV=production
  - FLASK_API_URL=http://localhost:5000
  - ALLOWED_ORIGINS=*
  - LOG_LEVEL=DEBUG  # More verbose logging
```

## Testing Workflow

### Before Committing

1. **Code changes** in your editor
2. **Rebuild** dev container: `docker-compose -f docker-compose.dev.yml up -d --build`
3. **Test** at http://localhost:3011
4. **Check logs**: `docker logs -f vo-tools-dev`
5. **Verify** both features work:
   - Script Analysis: http://localhost:3011/script-analysis
   - Telephony Converter: http://localhost:3011/telephony-converter

### Before Merging to Main

1. **Full feature testing** in dev environment
2. **Cross-browser testing** (if applicable)
3. **Check Docker logs** for errors
4. **Test file uploads** in Telephony Converter
5. **Verify script calculations** in Script Analysis
6. **Review code** for any debug statements or commented code

## Troubleshooting

### Port Conflicts

If ports 3011 or 5001 are in use:

```bash
# Find process using port
lsof -i :3011
lsof -i :5001

# Or modify docker-compose.dev.yml to use different ports
ports:
  - "3012:3000"  # Use 3012 instead of 3011
  - "5002:5000"  # Use 5002 instead of 5001
```

### Container Won't Start

```bash
# Check logs
docker logs vo-tools-dev

# Remove and rebuild
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d --build

# Check if production container is interfering
docker ps
```

### Code Changes Not Reflecting

```bash
# Rebuild the container (required for code changes)
docker-compose -f docker-compose.dev.yml up -d --build

# Or force rebuild
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up -d
```

### Git Branch Issues

```bash
# Check current branch
git branch

# Ensure you're on dev
git checkout dev

# If you committed to wrong branch, move commits
git checkout main
git log  # Note commit hash
git checkout dev
git cherry-pick <commit-hash>
```

## File Structure

```
vo-tools/
├── docker-compose.yml           # Production config
├── docker-compose.dev.yml       # Development config
├── Dockerfile                   # Shared Dockerfile
├── .gitignore                   # Git ignore rules
├── README.md                    # Project overview
├── DEVELOPMENT.md              # This file
├── INTEGRATION.md              # Architecture documentation
└── app/
    ├── page.tsx                # Homepage
    ├── script-analysis/        # Script Analysis tool
    ├── telephony-converter/    # Telephony Converter tool
    └── api/                    # Next.js API routes
```

## Best Practices

1. **Always work on `dev` branch** for new features
2. **Test thoroughly** in dev environment before merging to main
3. **Commit frequently** with clear, descriptive messages
4. **Keep commits atomic** - one logical change per commit
5. **Document changes** in commit messages
6. **Don't commit** sensitive data (API keys, passwords)
7. **Review changes** before pushing: `git diff`
8. **Keep production stable** - only merge tested code

## CI/CD Future Enhancement

Consider adding automated deployment:

```bash
# .github/workflows/deploy.yml or similar
# Automatically deploy dev branch to dev environment
# Automatically deploy main branch to production
```

## Quick Reference

| Task | Command |
|------|---------|
| Start dev | `docker-compose -f docker-compose.dev.yml up -d` |
| Stop dev | `docker-compose -f docker-compose.dev.yml down` |
| Rebuild dev | `docker-compose -f docker-compose.dev.yml up -d --build` |
| View logs | `docker logs -f vo-tools-dev` |
| Switch to dev branch | `git checkout dev` |
| Commit changes | `git add . && git commit -m "message"` |
| Push to dev | `git push origin dev` |
| Merge to main | `git checkout main && git merge dev` |
| Deploy production | `docker-compose up -d --build` |

---

**Remember**: Development environment (3011/5001) for testing, Production environment (3010/5000) for live users. Keep them separate!
