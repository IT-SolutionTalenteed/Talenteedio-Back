#!/bin/bash

echo "=== Vérification des contraintes FK vers freelance ==="
echo ""

echo "1. Recherche de toutes les FK qui référencent freelance..."
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA='talenteedio' 
AND REFERENCED_TABLE_NAME='freelance'
ORDER BY TABLE_NAME;" 2>/dev/null

echo ""
echo "2. Vérification si la table freelance existe..."
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "
SELECT COUNT(*) as count 
FROM information_schema.tables 
WHERE table_schema='talenteedio' 
AND table_name='freelance';" 2>/dev/null

echo ""
echo "3. Vérification des données dans freelance..."
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "
SELECT COUNT(*) as total_freelances 
FROM freelance;" 2>/dev/null || echo "Table freelance n'existe pas ou est vide"
