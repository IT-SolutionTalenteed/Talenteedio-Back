#!/bin/bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm use v20

echo "🚀 Deploy backend"

# récupérer les dernières modifications
git fetch origin
git reset --hard origin/main
git pull origin main

# installer TOUTES les dépendances (y compris devDependencies pour le build)
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Build TypeScript (OBLIGATOIRE pour copier les fichiers .graphql et .handlebars)
echo "🔧 Building TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Deployment aborted."
    exit 1
fi

# restart backend via supervisor
echo "🔁 Restarting API"
sudo supervisorctl restart talenteed-back

echo "✅ Backend deployed"