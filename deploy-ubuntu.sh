#!/bin/bash

# MyBookStore Ubuntu Self-Hosting Deployment Script
# This script automates the deployment of MyBookStore on Ubuntu/Linux servers

set -e

echo "🚀 MyBookStore Ubuntu Deployment Script"
echo "========================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run this script as root. Run as a regular user with sudo privileges."
    exit 1
fi

# Check if running on Ubuntu/Debian
if ! command -v apt &> /dev/null; then
    print_error "This script is designed for Ubuntu/Debian systems with apt package manager."
    exit 1
fi

print_info "Detected Ubuntu/Debian system. Proceeding with installation..."

# Update system packages
print_info "Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_status "System packages updated"

# Install required packages
print_info "Installing required packages..."
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
print_status "Required packages installed"

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    print_info "Installing Docker..."
    
    # Add Docker's official GPG key
    sudo mkdir -m 0755 -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    print_status "Docker installed successfully"
else
    print_status "Docker is already installed"
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    print_info "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_status "Docker Compose installed successfully"
else
    print_status "Docker Compose is already installed"
fi

# Start Docker service
print_info "Starting Docker service..."
sudo systemctl start docker
sudo systemctl enable docker
print_status "Docker service started and enabled"

# Create application directory
APP_DIR="/opt/mybookstore"
print_info "Creating application directory at $APP_DIR..."

if [ -d "$APP_DIR" ]; then
    print_warning "Directory $APP_DIR already exists. Backing up existing installation..."
    sudo mv "$APP_DIR" "$APP_DIR.backup.$(date +%Y%m%d_%H%M%S)"
fi

sudo mkdir -p "$APP_DIR"
sudo chown $USER:$USER "$APP_DIR"
print_status "Application directory created"

# Check if we're in a git repository
if [ -d ".git" ]; then
    print_info "Copying application files from current directory..."
    cp -r . "$APP_DIR/"
    cd "$APP_DIR"
else
    print_info "Please enter your MyBookStore repository URL (or press Enter to skip):"
    read -r REPO_URL
    
    if [ -n "$REPO_URL" ]; then
        print_info "Cloning repository..."
        git clone "$REPO_URL" "$APP_DIR"
        cd "$APP_DIR"
    else
        print_warning "No repository URL provided. Please manually copy your application files to $APP_DIR"
        print_info "After copying files, run: cd $APP_DIR && ./deploy-ubuntu.sh --configure-only"
        exit 0
    fi
fi

print_status "Application files ready"

# Configure environment
print_info "Setting up environment configuration..."

# Create environment file if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.docker" ]; then
        cp .env.docker .env
        print_status "Copied environment template from .env.docker"
    else
        # Create basic environment file
        cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://postgres:mybookstore_secure_password@db:5432/mybookstore
PGHOST=db
PGPORT=5432
PGUSER=postgres
PGPASSWORD=mybookstore_secure_password
PGDATABASE=mybookstore

# API Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Application
NODE_ENV=production
PORT=5000

# Security (change these in production)
JWT_SECRET=your_jwt_secret_here_change_in_production
SESSION_SECRET=your_session_secret_here_change_in_production
EOF
        print_status "Created basic environment file"
    fi
fi

# Configure API key
print_info "Configuring Anthropic API key..."
echo "Please enter your Anthropic API key (or press Enter to configure later):"
read -r -s ANTHROPIC_KEY

if [ -n "$ANTHROPIC_KEY" ]; then
    sed -i "s/your_anthropic_api_key_here/$ANTHROPIC_KEY/" .env
    print_status "Anthropic API key configured"
else
    print_warning "Anthropic API key not set. Please edit .env file manually before starting the application."
fi

# Generate secure passwords
print_info "Generating secure passwords..."
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
SESSION_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)

sed -i "s/mybookstore_secure_password/$DB_PASSWORD/g" .env
sed -i "s/your_jwt_secret_here_change_in_production/$JWT_SECRET/" .env
sed -i "s/your_session_secret_here_change_in_production/$SESSION_SECRET/" .env

print_status "Secure passwords generated and configured"

# Set up firewall
print_info "Configuring firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow OpenSSH
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw --force enable
    print_status "Firewall configured (ports 22, 80, 443 open)"
else
    print_warning "UFW firewall not found. Please manually configure firewall to allow ports 80 and 443."
fi

# Create deployment directory structure
print_info "Creating deployment structure..."
mkdir -p ssl
mkdir -p exports
mkdir -p backups
chmod 755 exports backups
print_status "Directory structure created"

# Build and start application
print_info "Building and starting MyBookStore application..."

# Use simplified production compose
if [ -f "docker-compose.simple.yml" ]; then
    COMPOSE_FILE="docker-compose.simple.yml"
elif [ -f "docker-compose.prod.yml" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
else
    COMPOSE_FILE="docker-compose.yml"
fi

print_info "Using compose file: $COMPOSE_FILE"

# Build and start services
docker-compose -f "$COMPOSE_FILE" build
docker-compose -f "$COMPOSE_FILE" up -d

print_status "Application started successfully!"

# Wait for services to be ready
print_info "Waiting for services to be ready..."
sleep 30

# Run database migrations
print_info "Running database migrations..."
docker-compose -f "$COMPOSE_FILE" exec -T app npm run db:push || {
    print_warning "Database migration failed. This might be normal on first run."
    print_info "Retrying in 10 seconds..."
    sleep 10
    docker-compose -f "$COMPOSE_FILE" exec -T app npm run db:push || print_warning "Migration still failing. Check logs."
}

# Create backup script
print_info "Creating backup script..."
cat > backup.sh << 'EOF'
#!/bin/bash
# MyBookStore Backup Script

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "Creating backup at $BACKUP_DIR/backup_$DATE.sql"

# Create database backup
docker-compose exec -T db pg_dump -U postgres mybookstore > "$BACKUP_DIR/backup_$DATE.sql"

# Keep only last 7 backups
ls -t "$BACKUP_DIR"/backup_*.sql | tail -n +8 | xargs -r rm

echo "Backup completed: backup_$DATE.sql"
EOF

chmod +x backup.sh
print_status "Backup script created (./backup.sh)"

# Create management script
print_info "Creating management script..."
cat > manage.sh << 'EOF'
#!/bin/bash
# MyBookStore Management Script

COMPOSE_FILE="docker-compose.simple.yml"
if [ ! -f "$COMPOSE_FILE" ]; then
    if [ -f "docker-compose.prod.yml" ]; then
        COMPOSE_FILE="docker-compose.prod.yml"
    else
        COMPOSE_FILE="docker-compose.yml"
    fi
fi

case "$1" in
    start)
        echo "Starting MyBookStore..."
        docker-compose -f "$COMPOSE_FILE" up -d
        ;;
    stop)
        echo "Stopping MyBookStore..."
        docker-compose -f "$COMPOSE_FILE" down
        ;;
    restart)
        echo "Restarting MyBookStore..."
        docker-compose -f "$COMPOSE_FILE" restart
        ;;
    logs)
        docker-compose -f "$COMPOSE_FILE" logs -f
        ;;
    update)
        echo "Updating MyBookStore..."
        git pull
        docker-compose -f "$COMPOSE_FILE" build
        docker-compose -f "$COMPOSE_FILE" up -d
        ;;
    backup)
        ./backup.sh
        ;;
    status)
        docker-compose -f "$COMPOSE_FILE" ps
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|update|backup|status}"
        exit 1
        ;;
esac
EOF

chmod +x manage.sh
print_status "Management script created (./manage.sh)"

# Display deployment information
echo ""
echo "🎉 MyBookStore Deployment Complete!"
echo "====================================="
echo ""
print_status "Application is running at: http://$(hostname -I | awk '{print $1}'):5000"
print_status "Default admin credentials:"
echo "  Username: superadmin"
echo "  Email: admin@yourdomain.com"
echo "  Password: AdminPass123!"
echo ""
print_warning "IMPORTANT: Change the default admin password after first login!"
echo ""
echo "📋 Next Steps:"
echo "1. Visit your application in a web browser"
echo "2. Log in with admin credentials and change password"
echo "3. Configure SSL certificate for HTTPS (see UBUNTU_DEPLOYMENT.md)"
echo "4. Set up regular backups (backup script created)"
echo ""
echo "🛠️  Management Commands:"
echo "  ./manage.sh start    - Start the application"
echo "  ./manage.sh stop     - Stop the application"
echo "  ./manage.sh restart  - Restart the application"
echo "  ./manage.sh logs     - View application logs"
echo "  ./manage.sh update   - Update application from git"
echo "  ./manage.sh backup   - Create database backup"
echo "  ./manage.sh status   - Show service status"
echo ""
echo "📁 Important Files:"
echo "  .env          - Environment configuration"
echo "  backups/      - Database backups"
echo "  ssl/          - SSL certificates"
echo "  exports/      - Generated e-book files"
echo ""
echo "📖 For more information, see UBUNTU_DEPLOYMENT.md"
echo ""

# Final check
if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
    print_status "All services are running correctly!"
else
    print_error "Some services may not be running. Check with: ./manage.sh logs"
fi

print_info "To apply Docker group changes, please log out and log back in, or run: newgrp docker"