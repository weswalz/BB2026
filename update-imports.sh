#!/bin/bash

echo "🔄 Updating MongoDB imports to SQLite database imports..."

# Find and replace all mongodb.js imports
find src -name "*.astro" -o -name "*.js" -o -name "*.ts" | xargs sed -i 's/from.*mongodb\.js/from "..\/..\/lib\/database.js"/g'
find src -name "*.astro" -o -name "*.js" -o -name "*.ts" | xargs sed -i 's/from.*\.\.\/lib\/mongodb\.js/from "..\/lib\/database.js"/g'
find src -name "*.astro" -o -name "*.js" -o -name "*.ts" | xargs sed -i 's/from.*\.\.\/\.\.\/\.\.\/lib\/mongodb\.js/from "..\/..\/..\/lib\/database.js"/g'

echo "✅ Updated all imports from mongodb.js to database.js"

# Remove the old MongoDB file
rm -f src/lib/mongodb.js
echo "🗑️  Removed old mongodb.js file"

echo "🎉 Import update completed!"