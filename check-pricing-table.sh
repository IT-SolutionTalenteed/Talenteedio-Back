#!/bin/bash

echo "=== Vérification de la table pricing ==="
echo ""

echo "1. La table pricing existe-t-elle?"
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema='talenteedio' AND table_name='pricing';"

echo ""
echo "2. Recherche de tables similaires:"
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "SELECT table_name FROM information_schema.tables WHERE table_schema='talenteedio' AND table_name LIKE '%pric%';"

echo ""
echo "3. Migration CreatePricingTable existe-t-elle?"
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "SELECT * FROM migrations WHERE name LIKE '%Pricing%';"

echo ""
echo "4. Toutes les tables actuelles:"
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "SHOW TABLES;" | grep -i pric || echo "Aucune table contenant 'pric'"
