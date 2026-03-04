#!/bin/bash

echo "=== Vérification des FK de matching_profile ==="
echo ""

echo "1. Vérifier les FK existantes sur matching_profile..."
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "
SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA='talenteedio' 
AND TABLE_NAME='matching_profile'
AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY CONSTRAINT_NAME;" 2>/dev/null

echo ""
echo "2. Vérifier si la FK FK_bc9a35573084281386d15677b3e existe..."
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "
SELECT COUNT(*) as count
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA='talenteedio' 
AND TABLE_NAME='matching_profile'
AND CONSTRAINT_NAME='FK_bc9a35573084281386d15677b3e';" 2>/dev/null

echo ""
echo "3. Vérifier toutes les FK vers user depuis matching_profile..."
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "
SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA='talenteedio' 
AND TABLE_NAME='matching_profile'
AND REFERENCED_TABLE_NAME='user';" 2>/dev/null
