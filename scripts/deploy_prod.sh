#!/bin/bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"   # charge NVM

nvm use v18.18

echo "🚀 Deploying backend..."

# Récupérer le code
git fetch origin
git reset --hard origin/main
git pull origin main

# Installer les dépendances
npm install

# Build TypeScript
echo "🔧 Building TypeScript..."
npm run build

# Redémarrer l'API via Supervisor
echo "🔁 Restarting API..."
sudo supervisorctl restart talenteed-back

echo "✅ Backend deployed successfully!"