#!/bin/bash

echo "🚀 Installation du service IA de matching CV-Job"
echo "=================================================="

# Vérifier si Python 3 est installé
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

echo "✅ Python 3 détecté: $(python3 --version)"

# Créer l'environnement virtuel
echo ""
echo "📦 Création de l'environnement virtuel..."
python3 -m venv venv

# Activer l'environnement virtuel
echo "🔄 Activation de l'environnement virtuel..."
source venv/bin/activate

# Installer les dépendances
echo "📥 Installation des dépendances..."
pip install --upgrade pip
pip install -r requirements.txt

# Rendre le script exécutable
echo "🔧 Configuration des permissions..."
chmod +x cv_job_matcher.py

# Créer le fichier .env si il n'existe pas
if [ ! -f .env ]; then
    echo "📝 Création du fichier .env..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Éditez le fichier .env et ajoutez votre clé API OpenAI"
    echo "   Fichier: ai-service/.env"
    echo "   Obtenir une clé: https://platform.openai.com/api-keys"
else
    echo "✅ Le fichier .env existe déjà"
fi

echo ""
echo "✨ Installation terminée avec succès!"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Éditez ai-service/.env et ajoutez votre OPENAI_API_KEY"
echo "   2. Testez le service avec:"
echo "      cd ai-service"
echo "      source venv/bin/activate"
echo "      python3 cv_job_matcher.py --help"
echo ""
