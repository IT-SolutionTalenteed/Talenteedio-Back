#!/bin/bash

echo "=== Diagnostic des migrations restantes ==="
echo ""

echo "1. Nombre de migrations en base..."
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "
SELECT COUNT(*) as total FROM migrations;" 2>/dev/null

echo ""
echo "2. Dernières migrations exécutées..."
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "
SELECT timestamp, name 
FROM migrations 
ORDER BY timestamp DESC 
LIMIT 5;" 2>/dev/null

echo ""
echo "3. Vérifier si matching_profile existe..."
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "
SELECT COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_schema='talenteedio' 
AND table_name='matching_profile';" 2>/dev/null

echo ""
echo "4. Vérifier les FK de matching_profile..."
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "
SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA='talenteedio' 
AND TABLE_NAME='matching_profile'
AND REFERENCED_TABLE_NAME IS NOT NULL;" 2>/dev/null

echo ""
echo "5. Vérifier si company_match existe..."
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "
SELECT COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_schema='talenteedio' 
AND table_name='company_match';" 2>/dev/null

echo ""
echo "6. Vérifier si company_appointment existe..."
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "
SELECT COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_schema='talenteedio' 
AND table_name='company_appointment';" 2>/dev/null

echo ""
echo "=== Fin du diagnostic ==="
