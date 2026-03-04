#!/bin/bash

echo "=== Fix de l'ordre des migrations pricing ==="
echo ""

# Le problème: CreatePricingTable a un timestamp trop élevé (1764819248000)
# Il doit être exécuté AVANT AddMeetingLinkToPricing (1734444000000)

# Solution: Renommer le fichier avec un timestamp correct
OLD_FILE="src/database/migrations/1764819248000-CreatePricingTable.ts"
NEW_FILE="src/database/migrations/1734400000000-CreatePricingTable.ts"

if [ -f "$OLD_FILE" ]; then
    echo "1. Renommage du fichier de migration..."
    mv "$OLD_FILE" "$NEW_FILE"
    echo "   ✓ $OLD_FILE"
    echo "   → $NEW_FILE"
    
    echo ""
    echo "2. Mise à jour du nom de classe dans le fichier..."
    sed -i 's/CreatePricingTable1764819248000/CreatePricingTable1734400000000/g' "$NEW_FILE"
    echo "   ✓ Classe renommée"
    
    echo ""
    echo "3. Vérification..."
    grep "export class" "$NEW_FILE"
    
    echo ""
    echo "✅ Migration corrigée!"
    echo ""
    echo "Ordre d'exécution maintenant:"
    echo "  1. CreatePricingTable (1734400000000) - Crée la table"
    echo "  2. AddMeetingLinkToPricing (1734444000000) - Ajoute la colonne"
    echo ""
    echo "Vous pouvez maintenant relancer: npm run typeorm:migration:run"
else
    echo "❌ Fichier $OLD_FILE non trouvé"
    echo ""
    echo "Vérification des fichiers existants:"
    ls -la src/database/migrations/*Pricing*.ts
fi
