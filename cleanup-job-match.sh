#!/bin/bash

echo "=== Nettoyage de la table job_match incomplète ==="
echo ""

# Vérifier si job_match existe
JOB_MATCH_EXISTS=$(sudo mysql -u root -p'Talenteed2024!' talenteedio -se "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='talenteedio' AND table_name='job_match';" 2>/dev/null)

if [ "$JOB_MATCH_EXISTS" -eq 1 ]; then
    echo "⚠️  La table job_match existe (probablement incomplète)"
    echo ""
    echo "Suppression de la table..."
    sudo mysql -u root -p'Talenteed2024!' talenteedio -e "DROP TABLE IF EXISTS job_match;" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✓ Table job_match supprimée avec succès"
    else
        echo "❌ Erreur lors de la suppression"
        exit 1
    fi
else
    echo "✓ La table job_match n'existe pas (rien à nettoyer)"
fi

echo ""
echo "✅ Nettoyage terminé!"
