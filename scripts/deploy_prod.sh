#!/bin/bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Force Node v20 (required for pdf-parse and pdfjs-dist)
nvm use v20 || nvm install v20

echo "🚀 Deploy backend"
echo "📌 Node version: $(node -v)"
echo "📌 NPM version: $(npm -v)"

# récupérer les dernières modifications
git fetch origin
git reset --hard origin/main
git pull origin main

# installer TOUTES les dépendances (y compris devDependencies pour le build)
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Build TypeScript (OBLIGATOIRE pour copier les fichiers .graphql et .handlebars)
echo "🔧 Building TypeScript..."
if ! npm run build; then
    echo "❌ Build failed! Deployment aborted."
    exit 1
fi

echo "✅ Build successful"

# restart backend via supervisor
echo "🔁 Restarting API"
sudo supervisorctl restart talenteed-back

echo "✅ Backend deployed"