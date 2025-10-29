#!/bin/bash

echo "🧪 Test du service IA de matching CV-Job"
echo "========================================"
echo ""

# Vérifier que l'environnement virtuel existe
if [ ! -d "venv" ]; then
    echo "❌ L'environnement virtuel n'existe pas."
    echo "   Exécutez d'abord: ./setup.sh"
    exit 1
fi

# Activer l'environnement virtuel
source venv/bin/activate

# Vérifier que le fichier .env existe
if [ ! -f ".env" ]; then
    echo "❌ Le fichier .env n'existe pas."
    echo "   Copiez .env.example vers .env et ajoutez votre clé API OpenAI"
    exit 1
fi

echo "📝 Test avec un exemple de CV et de poste..."
echo ""

# Exemple de CV
CV_TEXT="Développeur Full Stack Senior avec 6 ans d'expérience.
Compétences: React, Node.js, TypeScript, MongoDB, PostgreSQL, Docker, AWS.
Formation: Master en Informatique.
Expérience: 
- Lead Developer chez TechCorp (3 ans)
- Full Stack Developer chez StartupXYZ (3 ans)
Projets: Applications web scalables, APIs RESTful, microservices."

# Exemple de poste
JOB_TITLE="Senior Full Stack Developer"
JOB_DESC="Nous recherchons un développeur full stack expérimenté pour rejoindre notre équipe.
Vous travaillerez sur des applications web modernes utilisant React et Node.js."
JOB_SKILLS="React,Node.js,TypeScript,MongoDB,Docker"

echo "CV: $CV_TEXT"
echo ""
echo "Poste: $JOB_TITLE"
echo "Compétences requises: $JOB_SKILLS"
echo ""
echo "⏳ Analyse en cours (cela peut prendre 5-15 secondes)..."
echo ""

# Exécuter le matching
python3 cv_job_matcher.py \
  --cv "$CV_TEXT" \
  --job-title "$JOB_TITLE" \
  --job-description "$JOB_DESC" \
  --job-skills "$JOB_SKILLS" \
  --experience 5

echo ""
echo "✅ Test terminé!"
