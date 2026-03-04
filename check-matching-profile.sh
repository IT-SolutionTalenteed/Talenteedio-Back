#!/bin/bash

echo "=== Vérification de la table matching_profile ==="
echo ""

echo "1. La table matching_profile existe-t-elle?"
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema='talenteedio' AND table_name='matching_profile';"

echo ""
echo "2. Structure de la colonne id dans matching_profile:"
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_KEY FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='talenteedio' AND TABLE_NAME='matching_profile' AND COLUMN_NAME='id';"

echo ""
echo "3. Structure de la table job_match (si elle existe):"
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema='talenteedio' AND table_name='job_match';"

echo ""
echo "4. Recherche de tables similaires:"
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "SELECT table_name FROM information_schema.tables WHERE table_schema='talenteedio' AND table_name LIKE '%match%';"

echo ""
echo "5. Migration CreateJobMatchTable:"
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "SELECT * FROM migrations WHERE name LIKE '%JobMatch%';"
