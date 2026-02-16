#!/bin/bash

echo "🧹 Nettoyage du cache TypeScript..."
rm -rf .ts-node
find . -name "*.tsbuildinfo" -delete
rm -rf node_modules/.cache

echo "✅ Cache nettoyé"
echo ""
echo "🚀 Redémarrage du serveur..."
npm run dev
