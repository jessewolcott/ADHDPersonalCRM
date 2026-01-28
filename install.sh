#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN} ADHD Personal CRM Server Installation  ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Get configuration from user
read -p "Enter your domain name (e.g., crm.example.com): " DOMAIN
read -p "Enter your git repository URL: " GIT_REPO
read -p "Enter your email for Let's Encrypt notifications: " EMAIL

# Validate inputs
if [ -z "$DOMAIN" ] || [ -z "$GIT_REPO" ] || [ -z "$EMAIL" ]; then
    echo -e "${RED}All fields are required${NC}"
    exit 1
fi

REPO_DIR="/var/www/personal-crm"
APP_DIR="$REPO_DIR/app"
APP_USER="www-data"

echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  Domain: $DOMAIN"
echo "  Git Repo: $GIT_REPO"
echo "  Repo Directory: $REPO_DIR"
echo "  App Directory: $APP_DIR"
echo ""
read -p "Continue with installation? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "Installation cancelled"
    exit 0
fi

echo ""
echo -e "${GREEN}[1/8] Updating system packages...${NC}"
apt update && apt upgrade -y

echo ""
echo -e "${GREEN}[2/8] Installing dependencies...${NC}"
apt install -y curl git nginx certbot python3-certbot-nginx fail2ban ufw

# Install Node.js 20 LTS
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

echo ""
echo -e "${GREEN}[3/8] Cloning repository...${NC}"
if [ -d "$REPO_DIR" ]; then
    echo "Directory exists, pulling latest changes..."
    cd "$REPO_DIR"
    git pull
else
    git clone "$GIT_REPO" "$REPO_DIR"
fi

echo ""
echo -e "${GREEN}[4/8] Installing npm dependencies and building...${NC}"
cd "$APP_DIR"
npm install
npm run build

# Create data directory if it doesn't exist
mkdir -p "$APP_DIR/data"
chown -R $APP_USER:$APP_USER "$REPO_DIR"

# Initialize database if not exists
if [ ! -f "$APP_DIR/data/crm.db" ]; then
    echo "Initializing database..."
    npm run db:init
fi

echo ""
echo -e "${GREEN}[5/8] Creating .env file...${NC}"
if [ ! -f "$APP_DIR/.env" ]; then
    SESSION_SECRET=$(openssl rand -hex 32)
    cat > "$APP_DIR/.env" << EOF
# Server
PORT=3000
SESSION_SECRET=$SESSION_SECRET
BASE_URL=https://$DOMAIN
NODE_ENV=production

# OAuth providers (optional - uncomment and configure as needed)
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
# MICROSOFT_CLIENT_ID=your-microsoft-client-id
# MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
# GITHUB_CLIENT_ID=your-github-client-id
# GITHUB_CLIENT_SECRET=your-github-client-secret
EOF
    chown $APP_USER:$APP_USER "$APP_DIR/.env"
    chmod 600 "$APP_DIR/.env"
    echo -e "${YELLOW}Created .env file - edit it later to add OAuth credentials if needed${NC}"
else
    echo ".env file already exists, skipping..."
fi

echo ""
echo -e "${GREEN}[6/8] Configuring nginx...${NC}"
cat > /etc/nginx/sites-available/personal-crm << EOF
# Rate limiting zone for fail2ban integration
limit_req_zone \$binary_remote_addr zone=crm_limit:10m rate=10r/s;

server {
    listen 80;
    server_name $DOMAIN;

    # Redirect HTTP to HTTPS (certbot will handle this after cert is issued)
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    # SSL certificates (will be configured by certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate limiting
    limit_req zone=crm_limit burst=20 nodelay;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 90;
    }

    # Logging
    access_log /var/log/nginx/crm_access.log;
    error_log /var/log/nginx/crm_error.log;
}
EOF

# Create temporary config for initial certbot (before SSL)
cat > /etc/nginx/sites-available/personal-crm-temp << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://\$server_name\$request_uri;
    }
}
EOF

# Enable the temp site first
ln -sf /etc/nginx/sites-available/personal-crm-temp /etc/nginx/sites-enabled/personal-crm
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo -e "${GREEN}[7/8] Obtaining SSL certificate...${NC}"
certbot certonly --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL"

# Now switch to full config with SSL
ln -sf /etc/nginx/sites-available/personal-crm /etc/nginx/sites-enabled/personal-crm
nginx -t && systemctl reload nginx

echo ""
echo -e "${GREEN}[8/8] Configuring fail2ban...${NC}"
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/crm_error.log
maxretry = 5
bantime = 600

[nginx-botsearch]
enabled = true
filter = nginx-botsearch
logpath = /var/log/nginx/crm_access.log
maxretry = 2
bantime = 86400
EOF

# Create nginx-limit-req filter if it doesn't exist
cat > /etc/fail2ban/filter.d/nginx-limit-req.conf << EOF
[Definition]
failregex = limiting requests, excess:.* by zone.*client: <HOST>
ignoreregex =
EOF

systemctl enable fail2ban
systemctl restart fail2ban

echo ""
echo -e "${GREEN}Starting application with PM2...${NC}"
cd "$APP_DIR"
pm2 delete personal-crm 2>/dev/null || true
pm2 start server/index.js --name personal-crm --user $APP_USER
pm2 save
pm2 startup systemd -u root --hp /root

echo ""
echo -e "${GREEN}Creating update script and alias...${NC}"

# Create update script
cat > /usr/local/bin/update-crm << 'SCRIPT'
#!/bin/bash
set -e
REPO_DIR="/var/www/personal-crm"
APP_DIR="$REPO_DIR/app"

echo "Updating ADHD Personal CRM..."
cd "$REPO_DIR"
git pull
cd "$APP_DIR"
npm install
npm run build
pm2 restart personal-crm
echo "Update complete!"
SCRIPT
chmod +x /usr/local/bin/update-crm

# Create alias for the user who ran sudo
SUDO_USER_HOME=$(getent passwd "$SUDO_USER" | cut -d: -f6)
if [ -n "$SUDO_USER_HOME" ]; then
    # Add alias to .bashrc if not already present
    if ! grep -q "alias update-site=" "$SUDO_USER_HOME/.bashrc" 2>/dev/null; then
        echo "alias update-site='/usr/local/bin/update-crm'" >> "$SUDO_USER_HOME/.bashrc"
    fi
    # Create symlink
    ln -sf /usr/local/bin/update-crm "$SUDO_USER_HOME/update-site"
    chown "$SUDO_USER:$SUDO_USER" "$SUDO_USER_HOME/update-site"
fi

# Set up hourly cron job for auto-sync
cat > /etc/cron.d/personal-crm-sync << EOF
# Auto-sync ADHD Personal CRM every hour
0 * * * * root /usr/local/bin/update-crm >> /var/log/crm-update.log 2>&1
EOF

echo ""
echo -e "${GREEN}Configuring firewall...${NC}"
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Installation Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Your ADHD Personal CRM is now running at: ${YELLOW}https://$DOMAIN${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. Edit ${YELLOW}$APP_DIR/.env${NC} to add OAuth credentials (optional)"
echo -e "  2. Run ${YELLOW}pm2 restart personal-crm${NC} after editing .env"
echo ""
echo -e "Useful commands:"
echo -e "  ${YELLOW}update-site${NC}              - Manually update the application"
echo -e "  ${YELLOW}pm2 status${NC}               - Check application status"
echo -e "  ${YELLOW}pm2 logs personal-crm${NC}    - View application logs"
echo -e "  ${YELLOW}sudo fail2ban-client status${NC} - Check fail2ban status"
echo ""
echo -e "Auto-sync: Enabled (runs every hour)"
echo -e "Logs: /var/log/crm-update.log"
echo ""
