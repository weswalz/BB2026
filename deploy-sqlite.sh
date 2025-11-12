#!/bin/bash
set -euo pipefail
set -x

# BiYu Boxing SQLite Deployment Script
echo "🚀 Deploying BiYu Boxing to Server"
echo "=================================="

# Configuration
SERVER="root@69.87.219.106"
APP_DIR="/var/www/biyuboxing"
APP_NAME="biyuboxing"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

log_info "Step 1: Building application locally"
npm run build

log_info "Step 2: Uploading files to server"
rsync -avz --progress -vvv \
  --exclude node_modules \
  --exclude .astro \
  --exclude .git \
  --exclude .DS_Store \
  --exclude "*.log" \
  ./ $SERVER:$APP_DIR/

log_info "Step 3: Installing dependencies on server"
ssh $SERVER "
  cd $APP_DIR
  npm install
"

log_info "Step 4: Stopping existing application"
ssh $SERVER "
  cd $APP_DIR
  pm2 stop $APP_NAME 2>/dev/null || true
  pm2 delete $APP_NAME 2>/dev/null || true
"

log_info "Step 5: Building application on server"
ssh $SERVER "
  cd $APP_DIR
  
  # Fix permissions for esbuild
  find node_modules -name 'esbuild' -type f -exec chmod +x {} \; 2>/dev/null || true
  chmod -R +x node_modules/.bin/ 2>/dev/null || true
  chmod -R +x node_modules/@esbuild/ 2>/dev/null || true
  
  # Build the app
  npm run build
"

log_info "Step 6: Starting application with PM2"
ssh $SERVER "
  cd $APP_DIR
  pm2 start ecosystem.config.cjs --env production
  pm2 save
"

log_info "Step 7: Checking deployment status"
sleep 3
ssh $SERVER "
  cd $APP_DIR
  echo '=== PM2 Status ==='
  pm2 status
  
  echo ''
  echo '=== Application Logs (last 10 lines) ==='
  pm2 logs $APP_NAME --lines 10 --nostream
  
  echo ''
  echo '=== Testing local connection ==='
  curl -I http://localhost:4321/ 2>/dev/null || echo 'Local connection test failed'
  
  echo ''
  echo '=== Database Check ==='
  if [ -f database/biyuboxing.db ]; then
    echo 'SQLite database found'
    sqlite3 database/biyuboxing.db 'SELECT COUNT(*) as fighters FROM fighters; SELECT COUNT(*) as events FROM events; SELECT COUNT(*) as news FROM news;'
  else
    echo 'SQLite database NOT found - may need to run create-full-database.sql'
  fi
"

echo ""
log_info "✅ Deployment completed!"
echo ""
echo "🌐 Your site should be available at: https://biyuboxing.com"
echo "📊 Monitor with: ssh $SERVER 'pm2 monit'"
echo "📝 Check logs: ssh $SERVER 'pm2 logs $APP_NAME'"
echo "🔄 Restart app: ssh $SERVER 'pm2 restart $APP_NAME'"