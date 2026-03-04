#!/bin/bash

echo "=== Vérification du statut de la migration pricing ==="

# 1. Vérifier quelle migration pricing est enregistrée
echo "1. Migrations pricing enregistrées en base:"
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "SELECT timestamp, name FROM migrations WHERE name LIKE '%Pricing%' ORDER BY timestamp;"

# 2. Vérifier si la table pricing existe
echo ""
echo "2. Vérifier si la table pricing existe:"
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "SELECT COUNT(*) as table_exists FROM information_schema.tables WHERE table_schema='talenteedio' AND table_name='pricing';"

# 3. Vérifier les colonnes de pricing
echo ""
echo "3. Colonnes de la table pricing:"
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "SHOW COLUMNS FROM pricing;"

# 4. Vérifier les FK de pricing
echo ""
echo "4. Contraintes FK de pricing:"
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "
SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA='talenteedio' 
AND TABLE_NAME='pricing'
AND CONSTRAINT_NAME LIKE 'FK_%';"

# 5. Lister les fichiers de migration pricing dans le code
echo ""
echo "5. Fichiers de migration pricing dans le code:"
ls -la ~/sites/Talenteed-Back/src/database/migrations/ | grep -i pricing

echo ""
echo "=== Fin de la vérification ==="
