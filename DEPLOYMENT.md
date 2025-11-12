# BiYu Boxing Website Deployment Guide

## Server: 69.87.219.106 (Ubuntu with Nginx)

### Prerequisites on Server
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install PM2 for process management
sudo npm install -g pm2
```

### Deployment Steps

1. **Upload files to server:**
```bash
# On local machine, compress the website
tar -czf biyuboxing-clean.tar.gz -C /Users/wesleywalz/conductor biyuboxing-clean/

# Upload to server (replace with your method)
scp biyuboxing-clean.tar.gz user@69.87.219.106:/var/www/
```

2. **Extract and setup on server:**
```bash
# SSH into server
ssh user@69.87.219.106

# Extract website
cd /var/www/
sudo tar -xzf biyuboxing-clean.tar.gz
sudo mv biyuboxing-clean biyuboxing
sudo chown -R www-data:www-data biyuboxing
cd biyuboxing

# Install dependencies
npm install
```

3. **Restore database:**
```bash
# Create MongoDB user
mongosh
use admin
db.createUser({
  user: "root",
  pwd: "FO4pNNG7ZVAdE/lGv/lRbK7iroYec/Hpx+yYFK3MXNU=",
  roles: ["root"]
})
exit

# Restore database
mongorestore --username root --password "FO4pNNG7ZVAdE/lGv/lRbK7iroYec/Hpx+yYFK3MXNU=" --authenticationDatabase admin database/mongodump/
```

4. **Build and start website:**
```bash
# Build for production
npm run build

# Start with PM2
pm2 start npm --name "biyuboxing" -- start
pm2 save
pm2 startup
```

5. **Configure Nginx:**
```bash
# Create nginx config
sudo nano /etc/nginx/sites-available/biyuboxing
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name biyuboxing.com www.biyuboxing.com;
    
    location / {
        proxy_pass http://localhost:4321;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/biyuboxing /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

6. **SSL Certificate (Optional):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d biyuboxing.com -d www.biyuboxing.com
```

### Maintenance Commands
```bash
# Check status
pm2 status
pm2 logs biyuboxing

# Restart website
pm2 restart biyuboxing

# Update website
cd /var/www/biyuboxing
git pull  # if using git
npm run build
pm2 restart biyuboxing
```

### Database Content Summary
- **Events**: 4 records (Gloves & Glory, BiYu Brawl 3, etc.)
- **News**: 4 articles (BiYu Trio, Chavon Stillwell, etc.)
- **Fighters**: 7 fighters (Eridson Garcia, Chavon Stillwell, etc.)
- **Media**: 2 items
- **Settings**: Site configuration

The website will be accessible at http://69.87.219.106 or your domain name.