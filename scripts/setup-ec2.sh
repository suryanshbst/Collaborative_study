#!/usr/bin/env bash

# ==============================================================================
# StudySphere - AWS EC2 Initial Server Setup Script
# Supported OS: Ubuntu 22.04 / 24.04 LTS
# ==============================================================================

set -e

echo "========================================================"
echo "🚀 Starting StudySphere AWS EC2 Setup..."
echo "========================================================"

# 1. Update system packages
echo "📦 Updating apt packages..."
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y curl git ufw apt-transport-https ca-certificates gnupg lsb-release

# 2. Install Docker
echo "🐳 Installing Docker Engine..."
if ! command -v docker &> /dev/null; then
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add current user to docker group
    sudo usermod -aG docker "$USER"
    echo "✅ Docker installed successfully."
else
    echo "ℹ️ Docker is already installed."
fi

# 3. Install Bun Package Manager
echo "🥟 Installing Bun..."
if ! command -v bun &> /dev/null; then
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    echo "export BUN_INSTALL=\"$HOME/.bun\"" >> "$HOME/.bashrc"
    echo "export PATH=\"\$BUN_INSTALL/bin:\$PATH\"" >> "$HOME/.bashrc"
    echo "✅ Bun installed successfully."
else
    echo "ℹ️ Bun is already installed."
fi

# 4. Configure UFW Firewall
echo "🛡️ Configuring Firewall (Ports: 22, 80, 443)..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 5. Create SSL Directory Placeholders
echo "📁 Setting up SSL certificate directories..."
mkdir -p "$HOME/collab_study/certbot/conf"
mkdir -p "$HOME/collab_study/certbot/www"

echo "========================================================"
echo "🎉 EC2 Server Setup Completed!"
echo "👉 Note: Log out and log back in (or run 'newgrp docker') to apply Docker permissions."
echo "========================================================"
