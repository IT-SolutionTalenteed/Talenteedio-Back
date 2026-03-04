#!/bin/bash

echo "=== Fix FK duplicate sur matching_profile ==="
echo ""

echo "1. Vérifier l'état actuel..."
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "
SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA='talenteedio' 
AND TABLE_NAME='matching_profile'
AND REFERENCED_TABLE_NAME='user';" 2>/dev/null

echo ""
echo "2. La FK existe déjà, marquer la migration comme exécutée..."
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "
INSERT INTO migrations (timestamp, name) 
VALUES (1739750000000, 'CreateMatchingProfileTables1739750000000')
ON DUPLICATE KEY UPDATE name=name;
SELECT '✅ Migration CreateMatchingProfileTables marquée comme exécutée!' as status;" 2>/dev/null

echo ""
echo "3. Vérification finale..."
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "
SELECT COUNT(*) as total_migrations 
FROM migrations;" 2>/dev/null

echo ""
echo "✅ Fix terminé! Vous pouvez maintenant relancer: npm run typeorm:migration:run"
