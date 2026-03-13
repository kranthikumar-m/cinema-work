#!/bin/bash
set -euo pipefail

# Cinemax VPS Deployment Script
# Usage: bash deploy.sh
# Run this on your VPS after cloning the repo

APP_DIR="/var/www/cinemax"
LOG_DIR="/var/log/cinemax"
NGINX_CONF="/etc/nginx/sites-available/cinemax"
NODE_VERSION="20"

echo "=== Cinemax Deployment Script ==="
echo ""

# --- 1. Check/install Node.js ---
if ! command -v node &> /dev/null || [[ $(node -v | cut -d. -f1 | tr -d 'v') -lt 18 ]]; then
  echo "[1/7] Installing Node.js ${NODE_VERSION}..."
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "[1/7] Node.js $(node -v) already installed"
fi

# --- 2. Install PM2 ---
if ! command -v pm2 &> /dev/null; then
  echo "[2/7] Installing PM2..."
  sudo npm install -g pm2
else
  echo "[2/7] PM2 already installed"
fi

# --- 3. Setup app directory ---
echo "[3/7] Setting up application..."
sudo mkdir -p "$APP_DIR" "$LOG_DIR"
sudo chown -R "$USER:$USER" "$APP_DIR" "$LOG_DIR"

if [ "$(pwd)" != "$APP_DIR" ]; then
  rsync -av --exclude='node_modules' --exclude='.next' --exclude='.git' ./ "$APP_DIR/"
fi

cd "$APP_DIR"

# --- 4. Check environment ---
if [ ! -f .env.local ]; then
  if [ -f .env.example ]; then
    cp .env.example .env.local
    echo ""
    echo "  *** IMPORTANT: Edit $APP_DIR/.env.local and set your TMDB_API_KEY ***"
    echo "  Run: nano $APP_DIR/.env.local"
    echo ""
    read -p "  Press Enter after you've set the API key (or Ctrl+C to abort)..."
  else
    echo "ERROR: No .env.example found. Create .env.local with TMDB_API_KEY=your_key"
    exit 1
  fi
fi

# Validate API key is set
if grep -q "your_tmdb_api_key_here" .env.local 2>/dev/null; then
  echo "ERROR: TMDB_API_KEY is still the placeholder value. Edit .env.local first."
  exit 1
fi

# --- 5. Install dependencies and build ---
echo "[4/7] Installing dependencies..."
npm ci --production=false

echo "[5/7] Building application..."
npm run build

# --- 6. Start/restart with PM2 ---
echo "[6/7] Starting application with PM2..."
pm2 delete cinemax 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Setup PM2 to start on boot
echo "[6/7] Configuring PM2 startup..."
sudo env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$USER" --hp "$HOME" 2>/dev/null || true
pm2 save

# --- 7. Setup Nginx ---
echo "[7/7] Configuring Nginx..."
if command -v nginx &> /dev/null; then
  sudo tee "$NGINX_CONF" > /dev/null << 'NGINX'
server {
    listen 80;
    server_name _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1000;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # Cache static assets
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location /placeholder- {
        proxy_pass http://127.0.0.1:3000;
        expires 30d;
    }
}
NGINX

  sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/cinemax
  sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

  if sudo nginx -t 2>/dev/null; then
    sudo systemctl reload nginx
    echo "  Nginx configured and reloaded."
  else
    echo "  WARNING: Nginx config test failed. Check: sudo nginx -t"
  fi
else
  echo "  Nginx not installed. Install with: sudo apt install nginx"
  echo "  Then re-run this script or manually configure the reverse proxy."
fi

echo ""
echo "=== Deployment complete ==="
echo ""
echo "App running at:    http://localhost:3000"
echo "Nginx proxy at:    http://$(hostname -I | awk '{print $1}')"
echo ""
echo "Useful commands:"
echo "  pm2 status          - Check app status"
echo "  pm2 logs cinemax    - View logs"
echo "  pm2 restart cinemax - Restart app"
echo ""
echo "Next steps:"
echo "  1. Point your domain DNS to this server's IP"
echo "  2. Edit Nginx server_name in $NGINX_CONF"
echo "  3. Setup HTTPS: sudo apt install certbot python3-certbot-nginx && sudo certbot --nginx -d yourdomain.com"
