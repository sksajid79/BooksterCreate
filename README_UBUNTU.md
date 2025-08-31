# MyBookStore - Ubuntu Self-Hosting

**AI-powered e-book creation platform with one-command Ubuntu deployment.**

## 🚀 Quick Deploy (30 seconds)

```bash
curl -fsSL https://raw.githubusercontent.com/your-repo/mybookstore/main/deploy-ubuntu.sh | bash
```

**That's it!** Your MyBookStore will be running at `http://your-server-ip:5000`

## 📋 What You Get

- **AI Book Creation** - Generate complete e-books with Anthropic Claude
- **Admin Panel** - Full user management system  
- **Export Formats** - PDF, EPUB, DOCX, HTML, Markdown
- **Book Templates** - Professional typography designs
- **Cover Designer** - Upload and preview book covers
- **User Management** - Subscription and credit system
- **Auto Backup** - Database backup scripts included

## 🏠 Self-Hosting Features

✅ **One-command deployment** on Ubuntu/Debian  
✅ **Docker-based** - isolated and secure  
✅ **SSL ready** - HTTPS with Let's Encrypt  
✅ **Auto-backup** - scheduled database backups  
✅ **Easy management** - start/stop/update scripts  
✅ **Resource optimized** - runs on 2GB RAM  

## ⚡ Requirements

- Ubuntu 18.04+ or Debian 10+
- 2GB RAM minimum (4GB recommended)  
- 20GB disk space
- Anthropic API key ([get here](https://console.anthropic.com/))

## 🛠️ Manual Installation

If you prefer step-by-step installation:

### 1. Install Docker
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

### 2. Clone and Deploy
```bash
git clone https://github.com/your-repo/mybookstore.git
cd mybookstore
cp .env.example .env
# Edit .env with your API key
docker-compose -f docker-compose.simple.yml up -d
```

## 🔧 Management

```bash
# Start application
./manage.sh start

# Stop application  
./manage.sh stop

# View logs
./manage.sh logs

# Update from git
./manage.sh update

# Backup database
./manage.sh backup
```

## 🔒 Default Admin Access

- **URL**: `http://your-server-ip:5000`
- **Username**: `superadmin`
- **Email**: `admin@yourdomain.com`
- **Password**: `AdminPass123!`

**⚠️ Change password after first login!**

## 📚 Full Documentation

- [Ubuntu Deployment Guide](UBUNTU_DEPLOYMENT.md) - Complete setup instructions
- [Docker Deployment Guide](DOCKER_DEPLOYMENT.md) - Advanced Docker configuration  
- [Admin Setup Guide](ADMIN_SETUP.md) - User management documentation

## 🆘 Support

**Quick troubleshooting:**

```bash
# Check service status
./manage.sh status

# View logs
./manage.sh logs

# Test API health
curl http://localhost:5000/api/health
```

For issues, check the [troubleshooting guide](UBUNTU_DEPLOYMENT.md#troubleshooting) or create an issue.

## 🌟 Features

### Book Creation
- **AI Chapter Generation** - Claude-powered content creation
- **Template System** - Professional book layouts
- **Cover Design** - Upload and position cover images
- **Export Options** - Multiple format support
- **Progress Saving** - Resume work anytime

### Admin Panel  
- **User Management** - Create, edit, delete users
- **Role System** - Free, Subscribed, Admin roles
- **Credit Management** - Allocate AI generation credits
- **System Monitoring** - Health checks and stats

### Self-Hosting
- **Docker Deployment** - Containerized for security
- **Database Included** - PostgreSQL with auto-setup
- **SSL Support** - HTTPS with Let's Encrypt
- **Backup System** - Automated database backups
- **Easy Updates** - Git-based update system

---

**Made with ❤️ for the self-hosting community**

Deploy your own AI book creation platform in under a minute!