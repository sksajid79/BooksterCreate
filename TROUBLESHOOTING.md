# Docker Deployment Troubleshooting Guide

This guide covers common issues when deploying MyBookStore with Docker and their solutions.

## Build Issues

### 1. "vite: not found" Error

**Problem:**
```
=> ERROR [6/6] RUN npm run build
> [6/6] RUN npm run build:
0.548 > rest-express@1.0.0 build
0.548 > vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
0.548 
0.554 sh: vite: not found
```

**Root Cause:**
The Dockerfile was installing only production dependencies (`npm ci --only=production`) before trying to build the application. Build tools like `vite` and `esbuild` are development dependencies and weren't available.

**Solutions:**

#### Option 1: Use Fixed Dockerfile (Recommended)
The repository now includes a fixed Dockerfile that:
1. Installs all dependencies (including dev dependencies)
2. Builds the application
3. Prunes dev dependencies for smaller image size

```bash
# Pull latest changes and rebuild
git pull
docker-compose build --no-cache
docker-compose up -d
```

#### Option 2: Use Multi-Stage Build
For optimal production images, use the multi-stage Dockerfile:

```bash
# Use the optimized Dockerfile
cp Dockerfile.optimized Dockerfile
docker-compose build --no-cache
docker-compose up -d
```

#### Option 3: Manual Fix
If you need to fix manually, update your Dockerfile:

```dockerfile
# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --omit=dev
```

### 2. Docker Build Cache Issues

**Problem:**
Changes to Dockerfile aren't being applied due to Docker layer caching.

**Solution:**
```bash
# Clear build cache and rebuild
docker-compose down
docker system prune -a
docker-compose build --no-cache --pull
docker-compose up -d
```

### 3. Out of Memory During Build

**Problem:**
Node.js build process runs out of memory during `npm run build`.

**Solution:**
```bash
# Increase Docker memory limit (Docker Desktop)
# Or use multi-stage build with smaller intermediate layers

# Alternative: Build with more memory
docker build --memory=2g -t mybookstore .
```

## Runtime Issues

### 4. Database Connection Failed

**Problem:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**

```bash
# Check if database container is running
docker-compose ps

# Check database logs
docker-compose logs db

# Restart database service
docker-compose restart db

# Verify environment variables
docker-compose exec app env | grep -E "(DATABASE_URL|PGHOST)"
```

### 5. API Key Not Found

**Problem:**
```
Error: Missing ANTHROPIC_API_KEY
```

**Solution:**
```bash
# Check if API key is set
docker-compose exec app env | grep ANTHROPIC_API_KEY

# Update .env file and restart
nano .env
docker-compose restart app
```

### 6. Port Already in Use

**Problem:**
```
Error: Port 5000 is already in use
```

**Solution:**
```yaml
# In docker-compose.yml, change port mapping:
services:
  app:
    ports:
      - "8000:5000"  # Use different external port
```

## Network Issues

### 7. Cannot Access Application

**Problem:**
Application starts but isn't accessible from host.

**Solutions:**
```bash
# Check if containers are running
docker-compose ps

# Check application logs
docker-compose logs app

# Verify port mapping
docker port $(docker-compose ps -q app)

# Test internal connectivity
docker-compose exec app curl http://localhost:5000
```

### 8. Database Connection Timeout

**Problem:**
Application can't connect to database container.

**Solution:**
```bash
# Check if both containers are on same network
docker network ls
docker network inspect mybookstore_default

# Verify database is accepting connections
docker-compose exec db pg_isready -U postgres

# Test connection from app container
docker-compose exec app pg_isready -h db -U postgres
```

## Performance Issues

### 9. Slow Application Startup

**Problem:**
Application takes long time to start or respond.

**Solutions:**
```yaml
# Add resource limits in docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'

# Use multi-stage build for smaller images
# Pre-build images and use caching
```

### 10. High Memory Usage

**Problem:**
Containers consuming too much memory.

**Solution:**
```bash
# Monitor resource usage
docker stats

# Add memory limits
# Use production Node.js settings
ENV NODE_OPTIONS="--max-old-space-size=512"
```

## File System Issues

### 11. Permission Denied Errors

**Problem:**
```
Error: EACCES: permission denied, open '/app/exports/book.pdf'
```

**Solution:**
```dockerfile
# In Dockerfile, create directories with proper permissions
RUN mkdir -p exports && chown -R node:node /app
USER node
```

### 12. Missing Export Directory

**Problem:**
Export functionality fails due to missing directories.

**Solution:**
```bash
# Create required directories in container
docker-compose exec app mkdir -p exports

# Or add to Dockerfile:
RUN mkdir -p exports uploads temp
```

## Environment Configuration

### 13. Wrong NODE_ENV Setting

**Problem:**
Application running in development mode in production.

**Solution:**
```yaml
# In docker-compose.yml, ensure:
environment:
  - NODE_ENV=production
```

### 14. Missing Environment Variables

**Problem:**
Required environment variables not passed to container.

**Solution:**
```bash
# Check current environment
docker-compose exec app env

# Verify .env file format (no spaces around =)
# DATABASE_URL=postgresql://... (correct)
# DATABASE_URL = postgresql://... (incorrect)
```

## Quick Diagnostic Commands

```bash
# Check all container status
docker-compose ps

# View all logs
docker-compose logs

# Check specific service logs
docker-compose logs -f app

# Get into running container
docker-compose exec app sh

# Test database connection
docker-compose exec app npm run db:push

# Check environment variables
docker-compose exec app env

# Monitor resource usage
docker stats

# Check network connectivity
docker-compose exec app ping db
docker-compose exec app telnet db 5432
```

## Recovery Procedures

### Complete Reset
```bash
# Stop all services
docker-compose down -v

# Remove all containers and volumes
docker system prune -a

# Rebuild from scratch
docker-compose up --build -d
```

### Database Reset
```bash
# Stop and remove database
docker-compose stop db
docker-compose rm -f db
docker volume rm $(docker volume ls -q | grep postgres)

# Start fresh
docker-compose up -d db
docker-compose exec app npm run db:push
```

### Application Only Reset
```bash
# Rebuild just the app
docker-compose up --build -d app
```

For additional help, check the main [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) or create an issue in the repository.