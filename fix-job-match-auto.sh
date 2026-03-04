#!/bin/bash

echo "=== Fix Migration job_match ==="
echo ""

# 1. Vérifier si matching_profile existe
echo "1. Vérification de matching_profile..."
MATCHING_PROFILE_EXISTS=$(sudo mysql -u root -p'Talenteed2024!' talenteedio -se "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='talenteedio' AND table_name='matching_profile';" 2>/dev/null)

if [ "$MATCHING_PROFILE_EXISTS" -eq 0 ]; then
    echo "   ❌ La table matching_profile n'existe pas!"
    echo ""
    echo "   Recherche de migrations matching_profile..."
    ls -la src/database/migrations/*MatchingProfile*.ts 2>/dev/null || echo "   Aucune migration trouvée"
    echo ""
    echo "   La table matching_profile doit être créée avant job_match"
    exit 1
fi

echo "   ✓ La table matching_profile existe"

# 2. Vérifier si job existe
echo ""
echo "2. Vérification de job..."
JOB_EXISTS=$(sudo mysql -u root -p'Talenteed2024!' talenteedio -se "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='talenteedio' AND table_name='job';" 2>/dev/null)

if [ "$JOB_EXISTS" -eq 0 ]; then
    echo "   ❌ La table job n'existe pas!"
    exit 1
fi

echo "   ✓ La table job existe"

# 3. Vérifier si job_match existe (partiellement créée)
echo ""
echo "3. Vérification de job_match..."
JOB_MATCH_EXISTS=$(sudo mysql -u root -p'Talenteed2024!' talenteedio -se "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='talenteedio' AND table_name='job_match';" 2>/dev/null)

if [ "$JOB_MATCH_EXISTS" -eq 1 ]; then
    echo "   ⚠️  La table job_match existe déjà (probablement incomplète)"
    echo ""
    echo "   Suppression de la table incomplète..."
    sudo mysql -u root -p'Talenteed2024!' talenteedio -e "DROP TABLE IF EXISTS job_match;" 2>/dev/null
    echo "   ✓ Table job_match supprimée"
else
    echo "   ✓ La table job_match n'existe pas (normal)"
fi

# 4. Vérifier les types de colonnes
echo ""
echo "4. Vérification des types de colonnes..."
sudo mysql -u root -p'Talenteed2024!' talenteedio -e "
SELECT 
    'matching_profile.id' as colonne,
    COLUMN_TYPE as type,
    COLUMN_KEY as key_type
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA='talenteedio' 
AND TABLE_NAME='matching_profile' 
AND COLUMN_NAME='id'
UNION ALL
SELECT 
    'job.id' as colonne,
    COLUMN_TYPE as type,
    COLUMN_KEY as key_type
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA='talenteedio' 
AND TABLE_NAME='job' 
AND COLUMN_NAME='id';
" 2>/dev/null

echo ""
echo "✅ Diagnostic terminé!"
echo ""
echo "Vous pouvez maintenant relancer:"
echo "   npm run typeorm:migration:run"
