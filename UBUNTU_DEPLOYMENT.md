# Ubuntu Self-Hosting Deployment Guide

Complete guide for deploying MyBookStore on Ubuntu/Linux servers with one-command setup.

## 🚀 Quick Start (Recommended)

### One-Command Deployment

```bash
# Download and run the deployment script
curl -fsSL https://raw.githubusercontent.com/your-repo/mybookstore/main/deploy-ubuntu.sh | bash
```

Or clone the repository first:
```bash
git clone https://github.com/your-repo/mybookstore.git
cd mybookstore
chmod +x deploy-ubuntu.sh
./deploy-ubuntu.sh
```

**That's it!** The script will:
- Install Docker and Docker Compose
- Set up the application
- Configure the database
- Start all services
- Create management scripts

## 📋 Requirements

- **Ubuntu 18.04+** or **Debian 10+**
- **2GB RAM minimum** (4GB recommended)
- **20GB disk space** minimum
- **Sudo privileges**
- **Internet connection**

## 🛠️ Manual Installation

If you prefer manual installation:

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git unzip software-properties-common

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clone and Configure

```bash
# Clone repository
git clone https://github.com/your-repo/mybookstore.git
cd mybookstore

# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

### 3. Deploy Application

```bash
# Build and start services
docker-compose -f docker-compose.simple.yml up -d

# Run database migrations
docker-compose -f docker-compose.simple.yml exec app npm run db:push
```

## ⚙️ Configuration

### Environment Variables

Edit `.env` file with your settings:

```bash
# Required: Anthropic API Key
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Database (auto-generated secure passwords)
PGPASSWORD=your_secure_password

# Security (auto-generated)
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
```

### Get Anthropic API Key

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an account or sign in
3. Generate an API key
4. Add it to your `.env` file

## 🚦 Management Commands

The deployment script creates a `manage.sh` script for easy management:

```bash
# Start application
./manage.sh start

# Stop application
./manage.sh stop

# Restart application
./manage.sh restart

# View logs
./manage.sh logs

# Update from git
./manage.sh update

# Create database backup
./manage.sh backup

# Check service status
./manage.sh status
```

## 🔒 SSL/HTTPS Setup

### Using Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*.pem

# Enable Nginx in docker-compose.simple.yml
# Uncomment the nginx service section

# Restart with SSL
./manage.sh restart
```

### Using Custom Certificates

```bash
# Copy your certificates
cp your-cert.pem ssl/cert.pem
cp your-key.pem ssl/key.pem

# Enable Nginx and restart
./manage.sh restart
```

## 🗄️ Database Management

### Backups

```bash
# Manual backup
./manage.sh backup

# Automated daily backups (add to crontab)
0 2 * * * cd /opt/mybookstore && ./backup.sh
```

### Restore from Backup

```bash
# Stop application
./manage.sh stop

# Restore database
docker-compose -f docker-compose.simple.yml exec -T db psql -U postgres mybookstore < backups/backup_YYYYMMDD_HHMMSS.sql

# Start application
./manage.sh start
```

### External Database

To use an external PostgreSQL database:

1. **Update `.env` file:**
```bash
DATABASE_URL=postgresql://user:pass@external-host:5432/mybookstore
PGHOST=external-host
PGUSER=your_user
PGPASSWORD=your_password
```

2. **Comment out database service** in `docker-compose.simple.yml`

3. **Restart application:**
```bash
./manage.sh restart
```

## 📊 Monitoring

### Health Checks

```bash
# Check application health
curl http://localhost:5000/api/health

# Check service status
./manage.sh status

# View detailed logs
./manage.sh logs
```

### System Resources

```bash
# Monitor Docker containers
docker stats

# Check disk usage
df -h

# Check memory usage
free -h

# Check system load
htop
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using port 5000
sudo lsof -i :5000

# Change port in docker-compose.simple.yml
ports:
  - "8000:5000"  # Use port 8000 instead
```

#### 2. Docker Permission Denied
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again, or run:
newgrp docker
```

#### 3. Database Connection Issues
```bash
# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db

# Check database health
docker-compose exec db pg_isready -U postgres
```

#### 4. Application Won't Start
```bash
# Check application logs
docker-compose logs app

# Rebuild application
docker-compose build --no-cache app
docker-compose up -d
```

#### 5. API Key Errors
```bash
# Verify environment variables
docker-compose exec app env | grep ANTHROPIC

# Update API key
nano .env
./manage.sh restart
```

### Log Analysis

```bash
# View all service logs
./manage.sh logs

# View specific service logs
docker-compose logs app
docker-compose logs db

# Follow logs in real-time
docker-compose logs -f app
```

## 🔥 Performance Optimization

### For High Traffic

1. **Enable resource limits** in `docker-compose.simple.yml`:
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
```

2. **Scale application instances:**
```bash
docker-compose up --scale app=3 -d
```

3. **Use external database** for better performance

4. **Set up Redis caching** (advanced)

### For Low Resources

1. **Reduce memory limits:**
```yaml
deploy:
  resources:
    limits:
      memory: 512M
```

2. **Use smaller database:**
```yaml
db:
  image: postgres:15-alpine
  command: postgres -c max_connections=50 -c shared_buffers=128MB
```

## 🛡️ Security Hardening

### Firewall Configuration

```bash
# Enable UFW firewall
sudo ufw enable

# Allow necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS

# Check status
sudo ufw status
```

### Password Security

```bash
# Generate secure passwords
openssl rand -base64 32

# Update database password
nano .env
./manage.sh restart
```

### Regular Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d

# Update application
./manage.sh update
```

## 📈 Scaling and Load Balancing

### Multiple App Instances

```yaml
# In docker-compose.simple.yml
services:
  app:
    deploy:
      replicas: 3
```

### Load Balancer Setup

```yaml
# Add to docker-compose.simple.yml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx-lb.conf:/etc/nginx/nginx.conf
```

## 🎯 Domain and DNS Setup

### Domain Configuration

1. **Point your domain** to server IP
2. **Configure DNS A record:**
   - Name: `@` or `mybookstore`
   - Value: `YOUR_SERVER_IP`
   - TTL: `300`

3. **Update nginx configuration** with your domain

### Subdomain Setup

```bash
# For subdomain (books.yourdomain.com)
# Update nginx.conf and SSL certificates accordingly
```

## ✅ Production Checklist

Before going live:

- [ ] **SSL certificate** installed and working
- [ ] **Firewall** configured (only ports 22, 80, 443 open)
- [ ] **Strong passwords** set for database and admin
- [ ] **API keys** secured and not in version control
- [ ] **Backup system** configured and tested
- [ ] **Monitoring** set up
- [ ] **Domain name** pointed to server
- [ ] **Admin password** changed from default
- [ ] **Regular update schedule** planned

## 📞 Support

### Getting Help

1. **Check logs first:** `./manage.sh logs`
2. **Review troubleshooting section** above
3. **Check GitHub issues**
4. **Create new issue** with:
   - Error logs
   - System information
   - Steps to reproduce

### Useful Commands

```bash
# Quick health check
curl -s http://localhost:5000/api/health | jq

# Database connection test
docker-compose exec db psql -U postgres -c "SELECT version();"

# Application status
docker-compose ps

# Resource usage
docker stats --no-stream

# Cleanup unused Docker resources
docker system prune -a
```

---

**🎉 Congratulations!** Your MyBookStore instance should now be running successfully on Ubuntu. 

Access your application at: `http://your-server-ip:5000`

Default admin login:
- Username: `superadmin`
- Email: `admin@yourdomain.com`  
- Password: `AdminPass123!`

**⚠️ Important:** Change the default admin password immediately after first login!