#!/bin/bash

echo "=== Fix de l'ordre des migrations matching_profile ==="
echo ""

# Le problème: CreateMatchingProfileTables a un timestamp trop élevé (1739750000000 = février 2025)
# Il doit être exécuté AVANT CreateJobMatchTable (1735900000000 = janvier 2025)

# Solution: Renommer le fichier avec un timestamp correct
OLD_FILE="src/database/migrations/1739750000000-CreateMatchingProfileTables.ts"
NEW_FILE="src/database/migrations/1735800000000-CreateMatchingProfileTables.ts"

if [ -f "$OLD_FILE" ]; then
    echo "1. Renommage du fichier de migration..."
    mv "$OLD_FILE" "$NEW_FILE"
    echo "   ✓ $OLD_FILE"
    echo "   → $NEW_FILE"
    
    echo ""
    echo "2. Mise à jour du nom de classe dans le fichier..."
    sed -i 's/CreateMatchingProfileTables1739750000000/CreateMatchingProfileTables1735800000000/g' "$NEW_FILE"
    echo "   ✓ Classe renommée"
    
    echo ""
    echo "3. Vérification..."
    grep "export class" "$NEW_FILE"
    
    echo ""
    echo "✅ Migration corrigée!"
    echo ""
    echo "Ordre d'exécution maintenant:"
    echo "  1. CreateMatchingProfileTables (1735800000000) - Crée matching_profile"
    echo "  2. CreateJobMatchTable (1735900000000) - Crée job_match avec FK vers matching_profile"
    echo ""
    echo "Vous pouvez maintenant relancer: npm run typeorm:migration:run"
else
    echo "❌ Fichier $OLD_FILE non trouvé"
    echo ""
    echo "Vérification des fichiers existants:"
    ls -la src/database/migrations/*MatchingProfile*.ts
fi
