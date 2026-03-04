#!/bin/bash

echo "=== Vérification des colonnes de la table company ==="

# 1. Vérifier si creationDate existe
echo "1. Vérifier si creationDate existe dans company..."
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "SHOW COLUMNS FROM company WHERE Field='creationDate';"

# 2. Afficher toutes les colonnes de company
echo ""
echo "2. Toutes les colonnes de la table company:"
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "SHOW COLUMNS FROM company;"

# 3. Vérifier les migrations liées à company
echo ""
echo "3. Migrations exécutées contenant 'company' dans le nom:"
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "SELECT timestamp, name FROM migrations WHERE name LIKE '%ompany%' ORDER BY timestamp;"

echo ""
echo "=== Fin de la vérification ==="
