# Docker Deployment Guide for MyBookStore

This guide provides detailed instructions for deploying MyBookStore using Docker containers.

## Quick Start

1. **Clone the repository and set up environment:**
```bash
git clone <your-repository-url>
cd mybookstore
cp .env.docker .env
```

2. **Configure your environment variables in `.env`:**
```bash
# Edit the .env file with your actual API keys and settings
nano .env
```

3. **Start the application:**
```bash
docker-compose up -d
```

The application will be available at `http://localhost:5000`

## File Structure

The Docker setup includes:

- `Dockerfile` - Application container configuration
- `docker-compose.yml` - Development/local deployment
- `docker-compose.prod.yml` - Production deployment with Nginx
- `.dockerignore` - Files to exclude from Docker build
- `nginx.conf` - Nginx reverse proxy configuration
- `init-db.sql` - Database initialization script
- `.env.docker` - Environment variables template

## Development Deployment

For local development and testing:

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up --build -d
```

## Production Deployment

For production environments with Nginx reverse proxy:

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# Or with environment file
docker-compose -f docker-compose.prod.yml --env-file .env up -d
```

## Environment Configuration

### Required Environment Variables

Create a `.env` file with:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:password@db:5432/mybookstore
PGHOST=db
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_secure_password
PGDATABASE=mybookstore

# API Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Application
NODE_ENV=production
PORT=5000
```

### Using External Database

To use an external PostgreSQL database instead of the containerized one:

1. Update your `.env` file:
```env
DATABASE_URL=postgresql://user:pass@external-host:5432/mybookstore
PGHOST=external-host
PGPORT=5432
PGUSER=your_user
PGPASSWORD=your_password
PGDATABASE=mybookstore
```

2. Remove the `db` service from docker-compose.yml:
```bash
# Comment out or remove the db service section
docker-compose up -d app
```

## SSL/HTTPS Configuration

To enable HTTPS in production:

1. **Obtain SSL certificates** (Let's Encrypt, CloudFlare, etc.)

2. **Place certificates in `/ssl` directory:**
```bash
mkdir ssl
# Copy your cert.pem and key.pem files to ssl/
```

3. **Update nginx.conf** to uncomment SSL configuration

4. **Restart containers:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Database Migrations

Run database migrations after first deployment:

```bash
# Enter the app container
docker-compose exec app sh

# Run migrations
npm run db:push

# Exit container
exit
```

## Backup and Restore

### Database Backup

```bash
# Create backup
docker-compose exec db pg_dump -U postgres mybookstore > backup_$(date +%Y%m%d).sql

# Or using docker directly
docker exec <container_name> pg_dump -U postgres mybookstore > backup.sql
```

### Database Restore

```bash
# Restore from backup
docker-compose exec -T db psql -U postgres mybookstore < backup.sql
```

## Monitoring and Logs

### View Application Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f db
docker-compose logs -f nginx
```

### Health Checks

Check container status:
```bash
docker-compose ps
```

## Scaling and Performance

### Resource Limits

Add resource limits to docker-compose.yml:

```yaml
services:
  app:
    # ... other configuration
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
```

### Multiple App Instances

Scale the application horizontally:

```yaml
services:
  app:
    # ... configuration
    scale: 3  # Run 3 instances
```

Update Nginx upstream configuration:
```nginx
upstream app {
    server app_app_1:5000;
    server app_app_2:5000;
    server app_app_3:5000;
}
```

## Troubleshooting

### Common Issues

1. **Port already in use:**
```bash
# Change port mapping in docker-compose.yml
ports:
  - "8000:5000"  # Use port 8000 instead
```

2. **Database connection issues:**
```bash
# Check if database is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Test connection
docker-compose exec app npm run db:push
```

3. **API key errors:**
```bash
# Verify environment variables
docker-compose exec app env | grep ANTHROPIC
```

4. **Build failures:**
```bash
# Clear Docker cache and rebuild
docker-compose down
docker system prune -a
docker-compose up --build
```

### Container Management

```bash
# Restart specific service
docker-compose restart app

# Rebuild specific service
docker-compose up --build app

# Remove all containers and volumes
docker-compose down -v

# View resource usage
docker stats
```

## Security Best Practices

1. **Change default passwords** in production
2. **Use secrets management** for API keys:
```yaml
secrets:
  anthropic_key:
    file: ./secrets/anthropic_key.txt
```

3. **Network isolation:**
```yaml
networks:
  default:
    driver: bridge
    internal: true
```

4. **Regular updates:**
```bash
# Update base images
docker-compose pull
docker-compose up -d
```

## Production Checklist

- [ ] SSL certificates configured
- [ ] Environment variables secured
- [ ] Database backups scheduled
- [ ] Monitoring/logging configured
- [ ] Resource limits set
- [ ] Security headers configured in Nginx
- [ ] Regular update strategy planned

---

For additional support, refer to the main [README.md](README.md) or create an issue in the repository.