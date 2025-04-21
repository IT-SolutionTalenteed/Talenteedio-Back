#!/bin/bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  

nvm use v18.17

# Start deployment
echo "🚀 Starting deployment..."

echo "🔄 Fetching latest changes from origin..."
git fetch origin

echo "🔙 Resetting to origin/main..."
git reset --hard origin/main

echo "⬇️️ Pulling from origin/main..."
git pull origin main

echo "📦 Installing npm dependencies..."
npm install

echo "🛠️ Building the application..."
npm run build

echo "🔄 Restarting supervisor"
sudo supervisorctl restart all

echo "Deployment completed successfully. 🎉🎉🎉"
