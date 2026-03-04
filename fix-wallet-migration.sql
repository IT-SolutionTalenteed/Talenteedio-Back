-- Script pour corriger le problème de migration des tables wallets/bookings
-- Les tables existent déjà, on marque juste la migration comme exécutée

-- Vérifier si la migration existe déjà
SELECT * FROM migrations WHERE name = 'CreateBookingAndWalletTables1734000000000';

-- Si elle n'existe pas, l'insérer manuellement
INSERT INTO migrations (timestamp, name) 
SELECT 1734000000000, 'CreateBookingAndWalletTables1734000000000'
WHERE NOT EXISTS (
    SELECT 1 FROM migrations WHERE name = 'CreateBookingAndWalletTables1734000000000'
);

-- Vérifier que c'est bien ajouté
SELECT * FROM migrations WHERE name = 'CreateBookingAndWalletTables1734000000000';
