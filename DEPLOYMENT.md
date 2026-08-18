# 🚀 StudySphere Production Deployment Guide (AWS EC2 + Docker + Nginx + CI/CD)

This guide walks you through deploying **StudySphere** on an **AWS EC2 Instance** with **Docker Compose**, **Nginx Reverse Proxy**, and an automated **GitHub Actions CI/CD pipeline**.

---

## 🏗️ Architecture Overview

```
[ Clients / Browsers ]
         │
    HTTPS / WSS
         ▼
┌────────────────────────────────────────┐
│            AWS EC2 Server              │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │       Nginx Reverse Proxy        │  │
│  │   (Port 80/443, SSL & WebSockets)│  │
│  └──────────────┬───────────────────┘  │
│                 │                      │
│        ┌────────┴────────┐             │
│        ▼                 ▼             │
│  ┌───────────┐     ┌───────────┐       │
│  │  Web App  │     │  Backend  │       │
│  │ (Next.js) │     │ (Express) │       │
│  │ Port 3000 │     │ Port 8000 │       │
│  └───────────┘     └─────┬─────┘       │
└──────────────────────────┼─────────────┘
                           ▼
                 [ PostgreSQL Database ]
                    (Neon / Supabase)
```

---

## 📋 Step 1: AWS EC2 Instance Setup

### 1. Launch EC2 Instance
- **OS**: Ubuntu Server 24.04 LTS or 22.04 LTS (x86_64)
- **Instance Type**: `t3.small` or `t3.medium` (recommended for multi-peer WebRTC & Docker builds)
- **Storage**: 20GB+ gp3 SSD
- **Key Pair**: Create and download your `.pem` key (e.g. `studysphere-key.pem`)

### 2. Configure Inbound Security Group Rules
Ensure the following ports are open in your EC2 Security Group:

| Type | Port Range | Protocol | Source | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **SSH** | `22` | TCP | `0.0.0.0/0` (or your IP) | Remote Shell & CI/CD access |
| **HTTP** | `80` | TCP | `0.0.0.0/0` | Web Traffic & Certbot SSL |
| **HTTPS** | `443` | TCP | `0.0.0.0/0` | Secure WebRTC & API traffic |

---

## 🔑 Step 2: Server Provisioning

### 1. SSH into your EC2 machine:
```bash
ssh -i "studysphere-key.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>
```

### 2. Clone the Repository:
```bash
git clone https://github.com/<YOUR_GITHUB_USERNAME>/collab_study.git ~/collab_study
cd ~/collab_study
```

### 3. Run the Automated Server Setup:
```bash
chmod +x scripts/setup-ec2.sh scripts/deploy.sh
./scripts/setup-ec2.sh
```

### 4. Create your Production `.env` File:
```bash
nano .env
```
Paste your environment variables:
```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=verify-full"
JWT_SECRET="your-super-secure-production-jwt-secret"
PORT=8000
NODE_ENV=production

# Public URLs (Use your EC2 Public IP or Domain)
NEXT_PUBLIC_BACKEND_URL="http://<YOUR_EC2_IP_OR_DOMAIN>"
NEXT_PUBLIC_WS_URL="ws://<YOUR_EC2_IP_OR_DOMAIN>"
```

### 5. Launch the Application Containers:
```bash
docker compose build
docker compose up -d
```

Verify all containers are healthy:
```bash
docker compose ps
```

---

## 🤖 Step 3: Configure Automated CI/CD (GitHub Actions)

Whenever you push to `main`, GitHub Actions will automatically SSH into your EC2 machine, pull the latest changes, run database sync, and restart containers with zero downtime.

### Add GitHub Repository Secrets:
Go to your GitHub Repository $\rightarrow$ **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions** $\rightarrow$ **New repository secret**:

| Secret Name | Value | Description |
| :--- | :--- | :--- |
| `EC2_HOST` | `<YOUR_EC2_PUBLIC_IP_OR_DOMAIN>` | Your EC2 Public IPv4 or Elastic IP |
| `EC2_USER` | `ubuntu` | EC2 SSH Username |
| `EC2_SSH_KEY` | Contents of `studysphere-key.pem` | Full private key (including `-----BEGIN RSA PRIVATE KEY-----`) |
| `EC2_PORT` | `22` | (Optional) SSH Port |

---

## 🔒 Step 4: Domain & Free SSL Setup (Let's Encrypt)

If you have a custom domain (e.g. `study.yourdomain.com`):

### 1. Point DNS Records
- Create an **`A` record** in your DNS provider (Cloudflare, GoDaddy, Namecheap, Route 53):
  - **Host**: `@` (or `study`)
  - **Points to**: `<YOUR_EC2_PUBLIC_IP>`

### 2. Generate SSL Certificate with Certbot:
```bash
sudo docker run -it --rm --name certbot \
  -v "$HOME/collab_study/certbot/conf:/etc/letsencrypt" \
  -v "$HOME/collab_study/certbot/www:/var/www/certbot" \
  certbot/certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  -d yourdomain.com -d www.yourdomain.com
```

### 3. Update `.env` to HTTPS / WSS:
```env
NEXT_PUBLIC_BACKEND_URL="https://yourdomain.com"
NEXT_PUBLIC_WS_URL="wss://yourdomain.com"
```
Re-deploy:
```bash
docker compose up -d --build
```

---

## 🛠️ Useful Management Commands

- **View Live Logs**:
  ```bash
  docker compose logs -f
  docker compose logs -f backend
  docker compose logs -f web
  docker compose logs -f nginx
  ```
- **Restart Services**:
  ```bash
  docker compose restart
  ```
- **Manual 1-Click Update**:
  ```bash
  ./scripts/deploy.sh
  ```
