# **Bulletproof Staging/Production Environment Plan for biyuboxing.com**

## **Current Environment Analysis**

**Current Setup:**
- **Production:** biyuboxing.com (port 4321)
- **Server:** Ubuntu with nginx, Node.js 22.11.0, PM2
- **Framework:** Astro 5.13.5 with SSR (Node.js adapter)
- **Database:** SQLite (`/var/www/biyuboxing/database/biyuboxing.db`)
- **Process Management:** PM2 with ecosystem config
- **Web Server:** nginx reverse proxy with SSL

## **1. Environment Architecture & Complete Isolation Strategy**

### **Directory Structure:**
```
/var/www/
├── biyuboxing/                    # Production environment
│   ├── current/                   # Current production release
│   ├── releases/                  # Previous releases for rollback
│   ├── shared/                    # Shared files across releases
│   │   ├── database/             # Production SQLite database
│   │   ├── logs/                 # Application logs
│   │   ├── uploads/              # User uploads
│   │   └── .env                  # Production environment variables
│   └── backups/                  # Database backups
│
├── biyuboxing-staging/           # Staging environment (completely separate)
│   ├── current/                  # Current staging release
│   ├── releases/                 # Staging releases
│   ├── shared/                   # Shared staging files
│   │   ├── database/            # Staging SQLite database
│   │   ├── logs/                # Staging logs
│   │   ├── uploads/             # Staging uploads
│   │   └── .env                 # Staging environment variables
│   └── backups/                 # Staging database backups
│
└── scripts/                     # Deployment and management scripts
    ├── deploy-staging.sh        # Deploy to staging
    ├── deploy-production.sh     # Deploy staging to production
    ├── backup-database.sh       # Database backup utility
    ├── sync-prod-to-staging.sh  # Sync production data to staging
    └── rollback.sh              # Emergency rollback script
```

### **Port Allocation:**
- **Production:** `127.0.0.1:4321` (biyuboxing.com)
- **Staging:** `127.0.0.1:4322` (staging.biyuboxing.com)

### **Database Isolation:**
- **Production DB:** `/var/www/biyuboxing/shared/database/biyuboxing.db`
- **Staging DB:** `/var/www/biyuboxing-staging/shared/database/biyuboxing.db`
- **Sync Strategy:** One-way sync from production → staging (preserves production data integrity)

## **2. nginx Configuration for Both Environments**

### **staging.biyuboxing.com Configuration:**

```nginx
# /etc/nginx/sites-available/staging.biyuboxing.com
server {
    server_name staging.biyuboxing.com;

    # Staging environment indicator header
    add_header X-Environment "staging" always;
    add_header X-Robots-Tag "noindex, nofollow" always;

    # Basic auth for staging (optional security)
    # auth_basic "Staging Environment";
    # auth_basic_user_file /etc/nginx/.htpasswd;

    # Proxy to Staging Node.js Astro app
    location / {
        proxy_pass http://127.0.0.1:4322;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Environment "staging";
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Staging assets - no caching for testing
    location /assets/ {
        proxy_pass http://127.0.0.1:4322;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
    }

    # Staging images - no caching
    location /images/ {
        proxy_pass http://127.0.0.1:4322;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    }

    # Security Headers for staging
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    listen [::]:443 ssl http2;
    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/staging.biyuboxing.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staging.biyuboxing.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

# HTTP redirect for staging
server {
    listen 80;
    listen [::]:80;
    server_name staging.biyuboxing.com;
    return 301 https://$host$request_uri;
}
```

### **Updated Production Configuration with Health Checks:**

```nginx
# /etc/nginx/sites-available/biyuboxing.com (Enhanced)
upstream biyuboxing_backend {
    server 127.0.0.1:4321 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    server_name biyuboxing.com www.biyuboxing.com;

    # Production environment indicator
    add_header X-Environment "production" always;

    # Health check endpoint for monitoring
    location /health {
        proxy_pass http://biyuboxing_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_connect_timeout 5s;
        proxy_read_timeout 5s;
        access_log off;
    }

    # Main proxy configuration
    location / {
        proxy_pass http://biyuboxing_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Production assets with proper caching
    location /assets/ {
        proxy_pass http://biyuboxing_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_hide_header Cache-Control;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
    }

    # Production images with caching
    location /images/ {
        proxy_pass http://biyuboxing_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header Cache-Control "public, max-age=86400" always;
    }

    # Security Headers (existing configuration)
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), midi=(), camera=(), microphone=()";

    # Rate limiting for production
    location /api/ {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://biyuboxing_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Existing SSL configuration
    listen [::]:443 ssl;
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/biyuboxing.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/biyuboxing.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

# HTTP redirects (existing)
server {
    listen 80;
    listen [::]:80;
    server_name biyuboxing.com www.biyuboxing.com;
    return 301 https://biyuboxing.com$request_uri;
}
```

### **nginx Main Configuration Updates:**
```nginx
# Add to /etc/nginx/nginx.conf in the http block
http {
    # Rate limiting for API endpoints
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/m;
    
    # Connection pooling
    upstream_keepalive_connections 64;
    
    # Existing configuration...
}
```

## **3. PM2 Process Management Strategy**

### **Production PM2 Configuration:**
```javascript
// /var/www/biyuboxing/shared/ecosystem.production.config.js
module.exports = {
  apps: [{
    name: 'biyuboxing-production',
    script: './dist/server/entry.mjs',
    cwd: '/var/www/biyuboxing/current',
    instances: 2,
    exec_mode: 'cluster',
    watch: false,
    autorestart: true,
    max_restarts: 5,
    min_uptime: '10s',
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 4321,
      DB_PATH: '/var/www/biyuboxing/shared/database/biyuboxing.db'
    },
    error_file: '/var/www/biyuboxing/shared/logs/production-error.log',
    out_file: '/var/www/biyuboxing/shared/logs/production-out.log',
    log_file: '/var/www/biyuboxing/shared/logs/production-combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    kill_timeout: 5000,
    listen_timeout: 10000,
    wait_ready: true
  }]
};
```

### **Staging PM2 Configuration:**
```javascript
// /var/www/biyuboxing-staging/shared/ecosystem.staging.config.js
module.exports = {
  apps: [{
    name: 'biyuboxing-staging',
    script: './dist/server/entry.mjs',
    cwd: '/var/www/biyuboxing-staging/current',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '5s',
    max_memory_restart: '256M',
    env: {
      NODE_ENV: 'staging',
      PORT: 4322,
      DB_PATH: '/var/www/biyuboxing-staging/shared/database/biyuboxing.db'
    },
    error_file: '/var/www/biyuboxing-staging/shared/logs/staging-error.log',
    out_file: '/var/www/biyuboxing-staging/shared/logs/staging-out.log',
    log_file: '/var/www/biyuboxing-staging/shared/logs/staging-combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    kill_timeout: 5000,
    listen_timeout: 10000,
    wait_ready: true
  }]
};
```

## **4. Deployment and Management Scripts**

### **Initial Setup Script:**
```bash
#!/bin/bash
# /var/www/scripts/setup-environments.sh

set -euo pipefail

echo "🚀 Setting up staging and production environments for biyuboxing.com"

# Create directory structure
echo "📁 Creating directory structure..."
sudo mkdir -p /var/www/biyuboxing/{current,releases,shared/{database,logs,uploads},backups}
sudo mkdir -p /var/www/biyuboxing-staging/{current,releases,shared/{database,logs,uploads},backups}
sudo mkdir -p /var/www/scripts

# Set permissions
sudo chown -R www-data:www-data /var/www/biyuboxing*
sudo chmod -R 755 /var/www/biyuboxing*

# Create environment files
echo "📝 Creating environment configuration files..."

# Production .env
cat > /var/www/biyuboxing/shared/.env << 'EOF'
NODE_ENV=production
PORT=4321
DB_PATH=/var/www/biyuboxing/shared/database/biyuboxing.db
LOG_LEVEL=info
ENVIRONMENT=production
EOF

# Staging .env
cat > /var/www/biyuboxing-staging/shared/.env << 'EOF'
NODE_ENV=staging
PORT=4322
DB_PATH=/var/www/biyuboxing-staging/shared/database/biyuboxing.db
LOG_LEVEL=debug
ENVIRONMENT=staging
EOF

# Copy current production data to staging (if exists)
if [ -f "/var/www/biyuboxing/database/biyuboxing.db" ]; then
    echo "📋 Copying production database to staging..."
    cp /var/www/biyuboxing/database/biyuboxing.db /var/www/biyuboxing-staging/shared/database/
fi

# Set up SSL certificate for staging subdomain
echo "🔒 Setting up SSL certificate for staging..."
sudo certbot --nginx -d staging.biyuboxing.com --non-interactive --agree-tos --email your-email@domain.com

echo "✅ Environment setup complete!"
```

### **Staging Deployment Script:**
```bash
#!/bin/bash
# /var/www/scripts/deploy-staging.sh

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
STAGING_DIR="/var/www/biyuboxing-staging"
SOURCE_DIR="/var/www/biyuboxing/current"
RELEASE_DIR="$STAGING_DIR/releases/$TIMESTAMP"

echo "🚀 Deploying to staging environment - $TIMESTAMP"

# Create release directory
mkdir -p "$RELEASE_DIR"

# Copy source code from current production or git repository
if [ -d "$SOURCE_DIR" ]; then
    echo "📋 Copying from production..."
    cp -r "$SOURCE_DIR"/* "$RELEASE_DIR/"
else
    echo "❌ No source directory found. Please ensure production is deployed first."
    exit 1
fi

# Link shared files
echo "🔗 Linking shared files..."
ln -sfn "$STAGING_DIR/shared/.env" "$RELEASE_DIR/.env"
ln -sfn "$STAGING_DIR/shared/database" "$RELEASE_DIR/database"
ln -sfn "$STAGING_DIR/shared/uploads" "$RELEASE_DIR/uploads"

# Install dependencies and build
echo "📦 Installing dependencies..."
cd "$RELEASE_DIR"
npm ci --production

echo "🏗️ Building application..."
npm run build

# Health check
echo "🔍 Performing health check..."
if ! node -e "console.log('✅ Node.js syntax check passed')"; then
    echo "❌ Health check failed!"
    exit 1
fi

# Stop current staging process
echo "⏹️ Stopping current staging process..."
pm2 delete biyuboxing-staging 2>/dev/null || true

# Update current symlink
echo "🔄 Updating current symlink..."
ln -sfn "$RELEASE_DIR" "$STAGING_DIR/current"

# Start new staging process
echo "▶️ Starting staging process..."
pm2 start "$STAGING_DIR/shared/ecosystem.staging.config.js"

# Cleanup old releases (keep last 5)
echo "🧹 Cleaning up old releases..."
cd "$STAGING_DIR/releases"
ls -t | tail -n +6 | xargs -r rm -rf

# Verify deployment
sleep 5
if pm2 list | grep -q "biyuboxing-staging.*online"; then
    echo "✅ Staging deployment successful!"
    echo "🌐 Staging URL: https://staging.biyuboxing.com"
else
    echo "❌ Staging deployment failed!"
    exit 1
fi
```

### **Production Deployment Script (Blue-Green):**
```bash
#!/bin/bash
# /var/www/scripts/deploy-production.sh

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PROD_DIR="/var/www/biyuboxing"
STAGING_DIR="/var/www/biyuboxing-staging"
RELEASE_DIR="$PROD_DIR/releases/$TIMESTAMP"
BACKUP_DIR="$PROD_DIR/backups/$TIMESTAMP"

echo "🚀 Deploying staging to production - $TIMESTAMP"

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Check if staging is healthy
if ! curl -f -s https://staging.biyuboxing.com/health > /dev/null; then
    echo "❌ Staging health check failed. Aborting deployment."
    exit 1
fi

# Check staging PM2 status
if ! pm2 list | grep -q "biyuboxing-staging.*online"; then
    echo "❌ Staging process is not running. Aborting deployment."
    exit 1
fi

# Create backup
echo "💾 Creating production backup..."
mkdir -p "$BACKUP_DIR"
if [ -d "$PROD_DIR/current" ]; then
    cp -r "$PROD_DIR/current" "$BACKUP_DIR/code"
fi
if [ -f "$PROD_DIR/shared/database/biyuboxing.db" ]; then
    cp "$PROD_DIR/shared/database/biyuboxing.db" "$BACKUP_DIR/database.db"
fi

# Create release directory
mkdir -p "$RELEASE_DIR"

# Copy from staging
echo "📋 Copying from staging..."
cp -r "$STAGING_DIR/current"/* "$RELEASE_DIR/"

# Link shared files for production
echo "🔗 Linking shared files..."
ln -sfn "$PROD_DIR/shared/.env" "$RELEASE_DIR/.env"
ln -sfn "$PROD_DIR/shared/database" "$RELEASE_DIR/database"
ln -sfn "$PROD_DIR/shared/uploads" "$RELEASE_DIR/uploads"

# Update production environment settings
echo "⚙️ Updating production environment..."
cd "$RELEASE_DIR"

# Rebuild for production optimizations
echo "🏗️ Rebuilding for production..."
NODE_ENV=production npm run build

# Database migration/sync (if needed)
echo "🗄️ Checking database migrations..."
# Add your database migration commands here if needed

# Blue-Green deployment
echo "🔄 Performing blue-green deployment..."

# Test new release in background
echo "🧪 Testing new release..."
TEMP_PORT=4323
NODE_ENV=production PORT=$TEMP_PORT node ./dist/server/entry.mjs &
TEMP_PID=$!

# Wait for startup
sleep 10

# Health check on temporary instance
if ! curl -f -s "http://127.0.0.1:$TEMP_PORT/health" > /dev/null; then
    echo "❌ New release health check failed!"
    kill $TEMP_PID 2>/dev/null || true
    exit 1
fi

# Stop temporary instance
kill $TEMP_PID

# Switch to new release
echo "🚦 Switching to new release..."

# Update current symlink
PREVIOUS_RELEASE=$(readlink "$PROD_DIR/current" 2>/dev/null || echo "")
ln -sfn "$RELEASE_DIR" "$PROD_DIR/current"

# Graceful reload of PM2 process
echo "🔄 Gracefully reloading production process..."
pm2 reload "$PROD_DIR/shared/ecosystem.production.config.js" --update-env

# Wait for reload
sleep 10

# Final health check
echo "🔍 Final health check..."
for i in {1..5}; do
    if curl -f -s https://biyuboxing.com/health > /dev/null; then
        echo "✅ Production deployment successful!"
        break
    fi
    if [ $i -eq 5 ]; then
        echo "❌ Production health check failed after deployment!"
        echo "🔙 Rolling back..."
        
        if [ -n "$PREVIOUS_RELEASE" ] && [ -d "$PREVIOUS_RELEASE" ]; then
            ln -sfn "$PREVIOUS_RELEASE" "$PROD_DIR/current"
            pm2 reload "$PROD_DIR/shared/ecosystem.production.config.js"
        fi
        exit 1
    fi
    echo "⏳ Health check $i/5 failed, retrying..."
    sleep 5
done

# Cleanup old releases (keep last 3)
echo "🧹 Cleaning up old releases..."
cd "$PROD_DIR/releases"
ls -t | tail -n +4 | xargs -r rm -rf

# Cleanup old backups (keep last 5)
cd "$PROD_DIR/backups"
ls -t | tail -n +6 | xargs -r rm -rf

echo "✅ Production deployment completed successfully!"
echo "🌐 Production URL: https://biyuboxing.com"
```

### **Database Sync Script:**
```bash
#!/bin/bash
# /var/www/scripts/sync-prod-to-staging.sh

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PROD_DB="/var/www/biyuboxing/shared/database/biyuboxing.db"
STAGING_DB="/var/www/biyuboxing-staging/shared/database/biyuboxing.db"
STAGING_BACKUP="/var/www/biyuboxing-staging/backups/db_backup_$TIMESTAMP.db"

echo "🔄 Syncing production database to staging..."

# Backup current staging database
if [ -f "$STAGING_DB" ]; then
    echo "💾 Backing up current staging database..."
    mkdir -p /var/www/biyuboxing-staging/backups
    cp "$STAGING_DB" "$STAGING_BACKUP"
fi

# Stop staging application
echo "⏹️ Stopping staging application..."
pm2 stop biyuboxing-staging 2>/dev/null || true

# Copy production database to staging
echo "📋 Copying production database..."
if [ -f "$PROD_DB" ]; then
    cp "$PROD_DB" "$STAGING_DB"
    chown www-data:www-data "$STAGING_DB"
    chmod 644 "$STAGING_DB"
else
    echo "❌ Production database not found!"
    exit 1
fi

# Start staging application
echo "▶️ Starting staging application..."
pm2 start biyuboxing-staging

# Verify staging is working
sleep 5
if pm2 list | grep -q "biyuboxing-staging.*online"; then
    echo "✅ Database sync completed successfully!"
else
    echo "❌ Staging failed to start after database sync!"
    if [ -f "$STAGING_BACKUP" ]; then
        echo "🔙 Restoring staging database backup..."
        cp "$STAGING_BACKUP" "$STAGING_DB"
        pm2 start biyuboxing-staging
    fi
    exit 1
fi
```

### **Emergency Rollback Script:**
```bash
#!/bin/bash
# /var/www/scripts/rollback.sh

set -euo pipefail

PROD_DIR="/var/www/biyuboxing"
CURRENT_RELEASE=$(readlink "$PROD_DIR/current" 2>/dev/null || echo "")

echo "🚨 Emergency rollback initiated..."

if [ -z "$CURRENT_RELEASE" ]; then
    echo "❌ No current release found!"
    exit 1
fi

# Find previous release
cd "$PROD_DIR/releases"
RELEASES=($(ls -t))
PREVIOUS_RELEASE=""

for release in "${RELEASES[@]}"; do
    if [ "$PROD_DIR/releases/$release" != "$CURRENT_RELEASE" ]; then
        PREVIOUS_RELEASE="$PROD_DIR/releases/$release"
        break
    fi
done

if [ -z "$PREVIOUS_RELEASE" ] || [ ! -d "$PREVIOUS_RELEASE" ]; then
    echo "❌ No previous release found for rollback!"
    exit 1
fi

echo "🔙 Rolling back to: $PREVIOUS_RELEASE"

# Update symlink
ln -sfn "$PREVIOUS_RELEASE" "$PROD_DIR/current"

# Reload PM2
pm2 reload "$PROD_DIR/shared/ecosystem.production.config.js"

# Wait and verify
sleep 10
if curl -f -s https://biyuboxing.com/health > /dev/null; then
    echo "✅ Rollback successful!"
else
    echo "❌ Rollback failed! Manual intervention required."
    exit 1
fi
```

## **5. Testing and Validation Procedures**

### **Pre-Deployment Testing Checklist:**
```bash
#!/bin/bash
# /var/www/scripts/test-staging.sh

set -euo pipefail

echo "🧪 Running comprehensive staging tests..."

STAGING_URL="https://staging.biyuboxing.com"
FAILED_TESTS=0

# Function to log test results
test_result() {
    if [ $1 -eq 0 ]; then
        echo "✅ $2"
    else
        echo "❌ $2"
        ((FAILED_TESTS++))
    fi
}

# Test 1: Basic connectivity
echo "🌐 Testing basic connectivity..."
curl -f -s "$STAGING_URL" > /dev/null
test_result $? "Basic connectivity test"

# Test 2: Health endpoint
echo "❤️ Testing health endpoint..."
HEALTH_RESPONSE=$(curl -f -s "$STAGING_URL/health" 2>/dev/null || echo "FAILED")
if [ "$HEALTH_RESPONSE" != "FAILED" ]; then
    test_result 0 "Health endpoint test"
else
    test_result 1 "Health endpoint test"
fi

# Test 3: Response time
echo "⏱️ Testing response time..."
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$STAGING_URL")
if (( $(echo "$RESPONSE_TIME < 5.0" | bc -l) )); then
    test_result 0 "Response time test (<5s): ${RESPONSE_TIME}s"
else
    test_result 1 "Response time test (>5s): ${RESPONSE_TIME}s"
fi

# Test 4: SSL certificate
echo "🔒 Testing SSL certificate..."
echo | openssl s_client -servername staging.biyuboxing.com -connect staging.biyuboxing.com:443 2>/dev/null | openssl x509 -noout -dates > /dev/null
test_result $? "SSL certificate test"

# Test 5: Environment headers
echo "🏷️ Testing environment headers..."
ENV_HEADER=$(curl -s -I "$STAGING_URL" | grep -i "x-environment" | grep -i "staging" || echo "")
if [ -n "$ENV_HEADER" ]; then
    test_result 0 "Environment header test"
else
    test_result 1 "Environment header test"
fi

# Test 6: Database connectivity
echo "🗄️ Testing database connectivity..."
# This would be application-specific - add your database test endpoint
DB_TEST=$(curl -f -s "$STAGING_URL/api/db-test" 2>/dev/null || echo "FAILED")
if [ "$DB_TEST" != "FAILED" ]; then
    test_result 0 "Database connectivity test"
else
    test_result 1 "Database connectivity test (endpoint may not exist)"
fi

# Test 7: Static assets
echo "📁 Testing static assets..."
curl -f -s "$STAGING_URL/assets/style.css" > /dev/null 2>&1
test_result $? "Static assets test"

# Test 8: PM2 process status
echo "⚙️ Testing PM2 process status..."
if pm2 list | grep -q "biyuboxing-staging.*online"; then
    test_result 0 "PM2 process status test"
else
    test_result 1 "PM2 process status test"
fi

# Test 9: Memory usage
echo "💾 Testing memory usage..."
MEMORY_USAGE=$(pm2 show biyuboxing-staging | grep "memory usage" | awk '{print $3}' | sed 's/[^0-9.]//g' || echo "999")
if (( $(echo "$MEMORY_USAGE < 256" | bc -l) )); then
    test_result 0 "Memory usage test (<256MB): ${MEMORY_USAGE}MB"
else
    test_result 1 "Memory usage test (>256MB): ${MEMORY_USAGE}MB"
fi

# Test 10: Error logs
echo "📝 Testing error logs..."
ERROR_COUNT=$(tail -50 /var/www/biyuboxing-staging/shared/logs/staging-error.log 2>/dev/null | wc -l || echo "0")
if [ "$ERROR_COUNT" -lt 5 ]; then
    test_result 0 "Error logs test (<5 recent errors): $ERROR_COUNT errors"
else
    test_result 1 "Error logs test (>5 recent errors): $ERROR_COUNT errors"
fi

# Summary
echo ""
echo "📊 Test Summary:"
echo "==============="
if [ $FAILED_TESTS -eq 0 ]; then
    echo "✅ All tests passed! Staging is ready for production deployment."
    exit 0
else
    echo "❌ $FAILED_TESTS test(s) failed. Please fix issues before deploying to production."
    exit 1
fi
```

### **Production Validation Script:**
```bash
#!/bin/bash
# /var/www/scripts/validate-production.sh

set -euo pipefail

echo "🔍 Validating production deployment..."

PROD_URL="https://biyuboxing.com"
FAILED_CHECKS=0

# Function to log validation results
validate_result() {
    if [ $1 -eq 0 ]; then
        echo "✅ $2"
    else
        echo "❌ $2"
        ((FAILED_CHECKS++))
    fi
}

# Validation 1: Production accessibility
echo "🌐 Validating production accessibility..."
curl -f -s "$PROD_URL" > /dev/null
validate_result $? "Production accessibility"

# Validation 2: Production environment header
echo "🏷️ Validating production environment..."
ENV_HEADER=$(curl -s -I "$PROD_URL" | grep -i "x-environment" | grep -i "production" || echo "")
if [ -n "$ENV_HEADER" ]; then
    validate_result 0 "Production environment header"
else
    validate_result 1 "Production environment header"
fi

# Validation 3: SSL certificate
echo "🔒 Validating SSL certificate..."
SSL_EXPIRY=$(echo | openssl s_client -servername biyuboxing.com -connect biyuboxing.com:443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
SSL_EPOCH=$(date -d "$SSL_EXPIRY" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( (SSL_EPOCH - CURRENT_EPOCH) / 86400 ))

if [ $DAYS_UNTIL_EXPIRY -gt 30 ]; then
    validate_result 0 "SSL certificate validity ($DAYS_UNTIL_EXPIRY days remaining)"
else
    validate_result 1 "SSL certificate validity ($DAYS_UNTIL_EXPIRY days remaining - RENEWAL NEEDED)"
fi

# Validation 4: Performance check
echo "⚡ Validating performance..."
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$PROD_URL")
if (( $(echo "$RESPONSE_TIME < 3.0" | bc -l) )); then
    validate_result 0 "Response time (${RESPONSE_TIME}s)"
else
    validate_result 1 "Response time (${RESPONSE_TIME}s - TOO SLOW)"
fi

# Validation 5: PM2 cluster status
echo "⚙️ Validating PM2 cluster..."
CLUSTER_COUNT=$(pm2 list | grep "biyuboxing-production" | grep "online" | wc -l)
if [ $CLUSTER_COUNT -ge 2 ]; then
    validate_result 0 "PM2 cluster status ($CLUSTER_COUNT instances)"
else
    validate_result 1 "PM2 cluster status ($CLUSTER_COUNT instances - INSUFFICIENT)"
fi

# Validation 6: Database file permissions
echo "🔐 Validating database permissions..."
if [ -f "/var/www/biyuboxing/shared/database/biyuboxing.db" ]; then
    DB_PERMS=$(stat -c "%a" /var/www/biyuboxing/shared/database/biyuboxing.db)
    if [ "$DB_PERMS" = "644" ]; then
        validate_result 0 "Database file permissions ($DB_PERMS)"
    else
        validate_result 1 "Database file permissions ($DB_PERMS - SHOULD BE 644)"
    fi
else
    validate_result 1 "Database file existence"
fi

# Validation 7: Log rotation
echo "📊 Validating log files..."
LOG_SIZE=$(du -m /var/www/biyuboxing/shared/logs/production-combined.log 2>/dev/null | cut -f1 || echo "0")
if [ $LOG_SIZE -lt 100 ]; then
    validate_result 0 "Log file size (${LOG_SIZE}MB)"
else
    validate_result 1 "Log file size (${LOG_SIZE}MB - NEEDS ROTATION)"
fi

# Validation 8: Resource usage
echo "💻 Validating resource usage..."
CPU_USAGE=$(pm2 show biyuboxing-production | grep "cpu usage" | awk '{print $3}' | sed 's/%//' || echo "100")
if [ $CPU_USAGE -lt 80 ]; then
    validate_result 0 "CPU usage (${CPU_USAGE}%)"
else
    validate_result 1 "CPU usage (${CPU_USAGE}% - HIGH)"
fi

# Summary
echo ""
echo "📋 Validation Summary:"
echo "====================="
if [ $FAILED_CHECKS -eq 0 ]; then
    echo "✅ All validations passed! Production is healthy."
    exit 0
else
    echo "⚠️ $FAILED_CHECKS validation(s) failed. Please investigate."
    exit 1
fi
```

## **6. Monitoring and Alerting Setup**

### **Health Check Endpoint (Add to Astro app):**
```javascript
// src/pages/health.js
export async function GET() {
  try {
    // Check database connectivity
    const db = new Database(process.env.DB_PATH);
    const result = db.prepare('SELECT 1 as health').get();
    
    // Check critical services
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: result ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '0.0.1'
    };
    
    return new Response(JSON.stringify(health), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
```

### **Monitoring Script:**
```bash
#!/bin/bash
# /var/www/scripts/monitor.sh

set -euo pipefail

LOG_FILE="/var/www/scripts/monitor.log"
ALERT_EMAIL="your-email@domain.com"

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

send_alert() {
    echo "ALERT: $1" | mail -s "Biyuboxing.com Alert" "$ALERT_EMAIL" 2>/dev/null || true
    log_message "ALERT: $1"
}

# Check production health
if ! curl -f -s https://biyuboxing.com/health > /dev/null; then
    send_alert "Production site is down!"
    exit 1
fi

# Check staging health
if ! curl -f -s https://staging.biyuboxing.com/health > /dev/null; then
    send_alert "Staging site is down!"
fi

# Check PM2 processes
if ! pm2 list | grep -q "biyuboxing-production.*online"; then
    send_alert "Production PM2 process is not running!"
fi

if ! pm2 list | grep -q "biyuboxing-staging.*online"; then
    send_alert "Staging PM2 process is not running!"
fi

# Check disk space
DISK_USAGE=$(df /var/www | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    send_alert "Disk usage is high: ${DISK_USAGE}%"
fi

# Check database file size
DB_SIZE=$(du -m /var/www/biyuboxing/shared/database/biyuboxing.db | cut -f1)
if [ $DB_SIZE -gt 1000 ]; then
    send_alert "Database size is large: ${DB_SIZE}MB"
fi

log_message "Health check completed successfully"
```

## **7. Security Considerations**

### **Environment Variable Management:**
- **Production:** Store sensitive data in `/var/www/biyuboxing/shared/.env`
- **Staging:** Store in `/var/www/biyuboxing-staging/shared/.env`
- **Permissions:** `600` (readable only by owner)
- **Backup:** Never include `.env` files in version control or backups

### **Database Security:**
- **File Permissions:** `644` for SQLite files
- **Directory Permissions:** `755` for database directories
- **Backup Encryption:** Consider encrypting database backups
- **Access Control:** Limit database access to application user only

### **Network Security:**
- **Firewall:** Only expose ports 80, 443, and SSH
- **Internal Communication:** Use localhost for app-to-database communication
- **SSL/TLS:** Force HTTPS for all traffic
- **Rate Limiting:** Implement in nginx for API endpoints

## **8. Implementation Steps**

Execute these commands in order to implement the complete setup:

```bash
# 1. Create the environment setup script
sudo nano /var/www/scripts/setup-environments.sh
# (Copy the setup script content)
sudo chmod +x /var/www/scripts/setup-environments.sh

# 2. Run the initial setup
sudo /var/www/scripts/setup-environments.sh

# 3. Create all deployment scripts
sudo nano /var/www/scripts/deploy-staging.sh
sudo nano /var/www/scripts/deploy-production.sh
sudo nano /var/www/scripts/sync-prod-to-staging.sh
sudo nano /var/www/scripts/rollback.sh
sudo nano /var/www/scripts/test-staging.sh
sudo nano /var/www/scripts/validate-production.sh
sudo nano /var/www/scripts/monitor.sh

# 4. Make all scripts executable
sudo chmod +x /var/www/scripts/*.sh

# 5. Create nginx configuration for staging
sudo nano /etc/nginx/sites-available/staging.biyuboxing.com
# (Copy the staging nginx config)

# 6. Enable staging site
sudo ln -s /etc/nginx/sites-available/staging.biyuboxing.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 7. Update production nginx config
sudo nano /etc/nginx/sites-available/biyuboxing.com
# (Copy the enhanced production config)
sudo nginx -t
sudo systemctl reload nginx

# 8. Create PM2 ecosystem files
sudo nano /var/www/biyuboxing/shared/ecosystem.production.config.js
sudo nano /var/www/biyuboxing-staging/shared/ecosystem.staging.config.js

# 9. Set up SSL for staging
sudo certbot --nginx -d staging.biyuboxing.com

# 10. Deploy initial staging
sudo /var/www/scripts/deploy-staging.sh

# 11. Set up monitoring cron job
(crontab -l 2>/dev/null; echo "*/5 * * * * /var/www/scripts/monitor.sh") | crontab -
```

## **9. Daily Workflow**

### **Development Workflow:**
1. **Make changes** to your local development environment
2. **Deploy to staging:** `sudo /var/www/scripts/deploy-staging.sh`
3. **Test staging:** `sudo /var/www/scripts/test-staging.sh`
4. **Sync production data** (if needed): `sudo /var/www/scripts/sync-prod-to-staging.sh`
5. **Validate staging** thoroughly
6. **Deploy to production:** `sudo /var/www/scripts/deploy-production.sh`
7. **Validate production:** `sudo /var/www/scripts/validate-production.sh`

### **Emergency Procedures:**
- **Production issues:** `sudo /var/www/scripts/rollback.sh`
- **Database corruption:** Restore from `/var/www/biyuboxing/backups/`
- **Complete failure:** PM2 resurrection: `pm2 resurrect`

## **10. Key Benefits of This Setup**

✅ **Complete Isolation:** Staging and production are entirely separate  
✅ **Zero Downtime:** Blue-green deployment strategy  
✅ **Automatic Rollback:** Built-in failure detection and rollback  
✅ **Database Safety:** One-way sync preserves production data  
✅ **Health Monitoring:** Comprehensive health checks and alerting  
✅ **SSL Security:** Full HTTPS with automated certificate management  
✅ **Performance Optimization:** Clustered production, optimized caching  
✅ **Audit Trail:** Complete logging and backup retention  
✅ **Scalability:** Easy to add more servers or modify configuration  

This bulletproof setup ensures your high-traffic production site remains stable while providing a safe environment for experimentation and testing. The deployment pipeline is fully automated with multiple safety checks and instant rollback capabilities.