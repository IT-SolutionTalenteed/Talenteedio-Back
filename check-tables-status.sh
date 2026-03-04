#!/bin/bash

echo "=== Vérification de l'état des tables ==="
echo ""

echo "1. Table wallets:"
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema='talenteedio' AND table_name='wallets';"

echo ""
echo "2. Table bookings:"
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema='talenteedio' AND table_name='bookings';"

echo ""
echo "3. Table wallet_transactions:"
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema='talenteedio' AND table_name='wallet_transactions';"

echo ""
echo "4. Migration CreateBookingAndWalletTables:"
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "SELECT * FROM migrations WHERE name='CreateBookingAndWalletTables1734000000000';"

echo ""
echo "5. Dernières migrations exécutées:"
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "SELECT id, timestamp, name FROM migrations ORDER BY id DESC LIMIT 5;"
