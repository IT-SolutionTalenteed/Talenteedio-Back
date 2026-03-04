-- Script pour diagnostiquer et corriger le problème de la migration job_match

-- 1. Vérifier si matching_profile existe
SELECT 'Vérification de matching_profile:' as step;
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    COLUMN_TYPE,
    COLUMN_KEY
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA='talenteedio' 
AND TABLE_NAME='matching_profile' 
AND COLUMN_NAME='id';

-- 2. Vérifier si job existe
SELECT 'Vérification de job:' as step;
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    COLUMN_TYPE,
    COLUMN_KEY
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA='talenteedio' 
AND TABLE_NAME='job' 
AND COLUMN_NAME='id';

-- 3. Vérifier si job_match existe déjà
SELECT 'Vérification de job_match:' as step;
SELECT COUNT(*) as job_match_exists
FROM information_schema.tables 
WHERE table_schema='talenteedio' 
AND table_name='job_match';

-- 4. Si job_match existe, voir sa structure
SELECT 'Structure de job_match (si existe):' as step;
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_KEY
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA='talenteedio' 
AND TABLE_NAME='job_match'
ORDER BY ORDINAL_POSITION;
