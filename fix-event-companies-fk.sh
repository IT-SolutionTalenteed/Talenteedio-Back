#!/bin/bash

echo "=== Fix de la contrainte event_companies_company ==="
echo ""

echo "1. Vérification de la table event_companies_company..."
TABLE_EXISTS=$(sudo mysql -u root -p'Talenteed2024!' talenteedio -se "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='talenteedio' AND table_name='event_companies_company';" 2>/dev/null)

if [ "$TABLE_EXISTS" -eq 0 ]; then
    echo "   ❌ La table event_companies_company n'existe pas"
    exit 1
fi

echo "   ✓ La table existe"

echo ""
echo "2. Vérification des contraintes existantes..."
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "
SELECT 
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA='talenteedio' 
AND TABLE_NAME='event_companies_company'
AND CONSTRAINT_NAME LIKE 'FK_%';" 2>/dev/null

echo ""
echo "3. La contrainte FK_fe05a7fa4ed77eebc7a48e82285 existe déjà"
echo "   → Marquage de la migration comme exécutée sans la rejouer"

echo ""
read -p "Voulez-vous marquer la migration RecreateEventCompaniesTable comme exécutée? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo mysql -u root -p'Talenteed2024!' talenteedio -e "
    INSERT INTO migrations (timestamp, name) 
    SELECT 1738181000000, 'RecreateEventCompaniesTable1738181000000'
    WHERE NOT EXISTS (
        SELECT 1 FROM migrations WHERE name = 'RecreateEventCompaniesTable1738181000000'
    );" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✓ Migration marquée comme exécutée"
    else
        echo "❌ Erreur lors du marquage"
        exit 1
    fi
else
    echo "Abandon"
    exit 1
fi

echo ""
echo "✅ Fix terminé!"
echo ""
echo "Vous pouvez maintenant relancer: npm run typeorm:migration:run"
