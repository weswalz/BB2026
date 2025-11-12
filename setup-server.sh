#!/bin/bash
set -euo pipefail

# BiYu Boxing Server Setup Script
echo "🚀 Setting up BiYu Boxing Server"
echo "=================================="

# Configuration (adjust as needed)
SERVER="root@69.87.219.106" # Your server SSH user and IP
APP_DIR="/var/www/biyuboxing" # Directory where the app will reside
APP_NAME="biyuboxing-app" # PM2 app name

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

log_info "Step 1: Connecting to server and creating application directory"
ssh $SERVER "
  sudo mkdir -p $APP_DIR
  sudo chown -R root:root $APP_DIR # Ensure root owns the directory
"

log_info "Step 2: Transferring create-full-database.sql to server"
scp create-full-database.sql $SERVER:$APP_DIR/

log_info "Step 3: Initializing SQLite database"
ssh $SERVER "
  cd $APP_DIR
  mkdir -p database # Ensure database directory exists
  sqlite3 database/biyuboxing.db < create-full-database.sql
"

log_info "Step 4: Saving PM2 configuration (optional, for initial setup)"
ssh $SERVER "pm2 save"

echo ""
log_info "✅ Server setup completed! You can now run the deploy-sqlite.sh script."
echo ""
