#!/bin/bash

echo "=== Nettoyage de la migration dupliquée matching_profile ==="
echo ""

echo "1. Recherche des fichiers CreateMatchingProfileTables..."
ls -la src/database/migrations/*MatchingProfile*.ts 2>/dev/null

echo ""
echo "2. Vérification des migrations en base..."
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "
SELECT * FROM migrations 
WHERE name LIKE '%MatchingProfile%' 
ORDER BY timestamp;" 2>/dev/null

echo ""
OLD_FILE="src/database/migrations/1739750000000-CreateMatchingProfileTables.ts"

if [ -f "$OLD_FILE" ]; then
    echo "3. ⚠️  L'ancien fichier existe encore: $OLD_FILE"
    echo ""
    read -p "Voulez-vous supprimer ce fichier? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm "$OLD_FILE"
        if [ $? -eq 0 ]; then
            echo "   ✓ Fichier supprimé"
        else
            echo "   ❌ Erreur lors de la suppression"
            exit 1
        fi
    else
        echo "   Abandon"
        exit 1
    fi
else
    echo "3. ✓ L'ancien fichier n'existe plus"
fi

echo ""
echo "4. Vérification finale..."
ls -la src/database/migrations/*MatchingProfile*.ts 2>/dev/null

echo ""
echo "✅ Nettoyage terminé!"
echo ""
echo "Il ne devrait rester que: 1735800000000-CreateMatchingProfileTables.ts"
echo ""
echo "Vous pouvez maintenant relancer: npm run typeorm:migration:run"
