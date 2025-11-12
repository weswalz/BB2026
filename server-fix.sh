#!/bin/bash
set -euo pipefail

echo "🔧 Fixing Biyuboxing Server Deployment"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Ensure we're in the right directory
cd /var/www/biyuboxing

log_info "Step 1: Fixing file ownership and permissions"
chown -R root:root .
chmod 755 .
chmod -R 644 *
chmod 755 dist/ src/ database/ public/ node_modules/ releases/ shared/ 2>/dev/null || true
chmod +x deploy.sh 2>/dev/null || true

log_info "Step 2: Creating .env file"
cat > .env << 'EOF'
# MongoDB Configuration
MONGO_ROOT_PASSWORD=FO4pNNG7ZVAdE/lGv/lRbK7iroYec/Hpx+yYFK3MXNU=
MONGO_URI=mongodb://root:FO4pNNG7ZVAdE%2FlGv%2FlRbK7iroYec%2FHpx%2ByYFK3MXNU%3D@localhost:27017/biyuboxing?authSource=admin

# Application Configuration  
NODE_ENV=production
PORT=4321
HOST=0.0.0.0
EOF

log_info "Step 3: Fixing PM2 ecosystem config"
rm -f ecosystem.config.cjs 2>/dev/null || true

cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'biyuboxing-app',
    script: './dist/server/entry.mjs',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4321,
      HOST: '0.0.0.0'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 4321,
      HOST: '0.0.0.0'
    },
    error_file: '/var/log/pm2/biyuboxing-app.error.log',
    out_file: '/var/log/pm2/biyuboxing-app.out.log',
    log_file: '/var/log/pm2/biyuboxing-app.combined.log',
    time: true,
    max_restarts: 5,
    restart_delay: 5000
  }]
}
EOF

log_info "Step 4: Creating PM2 log directory"
mkdir -p /var/log/pm2

log_info "Step 5: Stopping existing PM2 processes"
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true

log_info "Step 6: Starting PM2 with new config"
pm2 start ecosystem.config.js --env production
pm2 save

log_info "Step 7: Checking MongoDB and importing data if needed"
# Check if database has data
DB_CHECK=$(mongosh -u root -p'FO4pNNG7ZVAdE/lGv/lRbK7iroYec/Hpx+yYFK3MXNU=' --authenticationDatabase admin --quiet --eval "
use biyuboxing
db.fighters.countDocuments()
" 2>/dev/null || echo "0")

if [ "$DB_CHECK" = "0" ]; then
    log_warn "Database is empty, importing data..."
    
    # Import fighters
    mongoimport --host localhost --port 27017 \
                --username root \
                --password 'FO4pNNG7ZVAdE/lGv/lRbK7iroYec/Hpx+yYFK3MXNU=' \
                --authenticationDatabase admin \
                --db biyuboxing \
                --collection fighters \
                --file database/fighters.json \
                --jsonArray --drop
    
    # Import events  
    mongoimport --host localhost --port 27017 \
                --username root \
                --password 'FO4pNNG7ZVAdE/lGv/lRbK7iroYec/Hpx+yYFK3MXNU=' \
                --authenticationDatabase admin \
                --db biyuboxing \
                --collection events \
                --file database/events.json \
                --jsonArray --drop
    
    # Import news
    mongoimport --host localhost --port 27017 \
                --username root \
                --password 'FO4pNNG7ZVAdE/lGv/lRbK7iroYec/Hpx+yYFK3MXNU=' \
                --authenticationDatabase admin \
                --db biyuboxing \
                --collection news \
                --file database/news.json \
                --jsonArray --drop
    
    log_info "Database import completed"
else
    log_info "Database already contains $DB_CHECK fighters - skipping import"
fi

log_info "Step 8: Testing application startup"
sleep 3

# Test local connection
if curl -s -I http://localhost:4321/ | grep -q "200 OK"; then
    log_info "✅ Application is responding on localhost:4321"
else
    log_warn "⚠️  Application may not be fully started yet"
fi

log_info "Step 9: Service status check"
echo "=== PM2 Status ==="
pm2 status

echo ""
echo "=== MongoDB Status ==="
systemctl status mongod --no-pager -l || true

echo ""
echo "=== Nginx Status ==="
systemctl status nginx --no-pager -l || true

echo ""
echo "=== Recent Application Logs ==="
pm2 logs biyuboxing-app --lines 10 --nostream || true

echo ""
log_info "✅ Server fix completed!"
echo ""
echo "🌐 Test your site:"
echo "   - Local: curl http://localhost:4321/"
echo "   - Public: curl https://biyuboxing.com/"
echo ""
echo "📊 Monitor with: pm2 monit"
echo "📝 View logs with: pm2 logs biyuboxing-app"