#!/bin/bash

# MyBookStore Quick Install Script
# One-command installation for Ubuntu servers

set -e

echo "🚀 MyBookStore Quick Install"
echo "============================"

# Check if running on Ubuntu/Debian
if ! command -v apt &> /dev/null; then
    echo "❌ This script requires Ubuntu/Debian with apt package manager"
    exit 1
fi

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run as root. Run as regular user with sudo privileges."
    exit 1
fi

# Create installation directory
INSTALL_DIR="$HOME/mybookstore"
echo "📁 Installing to: $INSTALL_DIR"

if [ -d "$INSTALL_DIR" ]; then
    echo "⚠️  Directory exists. Backing up..."
    mv "$INSTALL_DIR" "$INSTALL_DIR.backup.$(date +%Y%m%d_%H%M%S)"
fi

mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Download deployment script
echo "📥 Downloading deployment files..."
curl -fsSL -o deploy-ubuntu.sh https://raw.githubusercontent.com/your-repo/mybookstore/main/deploy-ubuntu.sh
curl -fsSL -o docker-compose.simple.yml https://raw.githubusercontent.com/your-repo/mybookstore/main/docker-compose.simple.yml
curl -fsSL -o .env.example https://raw.githubusercontent.com/your-repo/mybookstore/main/.env.example

# Make deployment script executable
chmod +x deploy-ubuntu.sh

echo "✅ Quick install completed!"
echo ""
echo "📋 Next steps:"
echo "1. cd $INSTALL_DIR"
echo "2. Edit .env file with your API key"
echo "3. Run: ./deploy-ubuntu.sh"
echo ""
echo "Or run full deployment now:"
echo "./deploy-ubuntu.sh"