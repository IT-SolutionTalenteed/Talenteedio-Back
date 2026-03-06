#!/bin/bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm use v18.18

echo "🚀 Deploy backend"

# récupérer les dernières modifications
git fetch origin
git reset --hard origin/main
git pull origin main

# installer les dépendances en production
npm install --production --legacy-peer-deps

# optional: build TypeScript pour check, mais pas obligatoire
echo "🔧 Building TypeScript (optional)"
npm run build || echo "⚠️ Build failed, continue anyway"

# restart backend via supervisor
echo "🔁 Restarting API"
sudo supervisorctl restart talenteed-back

echo "✅ Backend deployed"