#!/bin/bash

echo "=== Fix Migration RemoveFreelance ==="
echo ""

echo "1. Nettoyage des contraintes FK et table freelance..."
sudo mysql -u root -p'Talenteed2024!' talenteedio << 'EOF'
SET FOREIGN_KEY_CHECKS=0;

-- Supprimer les FK et colonnes de application
ALTER TABLE application DROP FOREIGN KEY IF EXISTS FK_application_freelance;
ALTER TABLE application DROP COLUMN IF EXISTS freelanceId;

-- Supprimer les FK et colonnes de lm
ALTER TABLE lm DROP FOREIGN KEY IF EXISTS FK_lm_freelance;
ALTER TABLE lm DROP COLUMN IF EXISTS freelanceId;

-- Supprimer les FK et colonnes de cv
ALTER TABLE cv DROP FOREIGN KEY IF EXISTS FK_cv_freelance;
ALTER TABLE cv DROP COLUMN IF EXISTS freelanceId;

-- Supprimer les FK et colonnes de user
ALTER TABLE user DROP FOREIGN KEY IF EXISTS FK_user_freelance;
ALTER TABLE user DROP COLUMN IF EXISTS freelanceId;

-- Supprimer la table junction
DROP TABLE IF EXISTS freelance_values_value;

-- Supprimer la table freelance
DROP TABLE IF EXISTS freelance;

SET FOREIGN_KEY_CHECKS=1;

SELECT '✅ Nettoyage terminé!' as status;
EOF

echo ""
echo "2. Marquer la migration comme exécutée..."
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "
INSERT INTO migrations (timestamp, name) 
VALUES (1740000000000, 'RemoveFreelance1740000000000')
ON DUPLICATE KEY UPDATE name=name;
SELECT '✅ Migration marquée comme exécutée!' as status;" 2>/dev/null

echo ""
echo "3. Vérification finale..."
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "
SELECT COUNT(*) as total_migrations 
FROM migrations;" 2>/dev/null

echo ""
echo "✅ Fix terminé! Vous pouvez maintenant relancer: npm run typeorm:migration:run"
