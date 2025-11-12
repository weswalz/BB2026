#!/bin/bash
set -e

# --- Configuration ---
SERVER_USER="root"
SERVER_IP="69.87.219.106"
PROJECT_PATH="/var/www/biyuboxing"

echo "--- 🚀 Transferring project files to $SERVER_IP ---"

# Use rsync to efficiently transfer the project files.
rsync -avz --delete \
  --exclude="node_modules" \
  --exclude=".git" \
  --exclude=".env" \
  --exclude="releases" \
  --exclude="shared" \
  . "$SERVER_USER@$SERVER_IP:$PROJECT_PATH"

echo "--- ✅ Files transferred successfully! ---"