# 🚀 Démarrage Rapide - Service IA de Matching CV-Job

## ⚡ Installation en 3 étapes

### 1️⃣ Installer les dépendances

```bash
cd ai-service
./setup.sh
```

### 2️⃣ Configurer la clé API OpenAI

Éditer le fichier `.env` :

```bash
nano .env
```

Ajouter votre clé API :

```
OPENAI_API_KEY=sk-proj-votre_cle_ici
```

**Obtenir une clé** : https://platform.openai.com/api-keys

### 3️⃣ Tester

```bash
./test_example.sh
```

## ✅ C'est tout !

Le service est maintenant prêt à être utilisé par l'application.

## 📋 Structure des fichiers

```
ai-service/
├── cv_job_matcher.py    ← Script Python principal
├── requirements.txt     ← Dépendances
├── .env                ← Configuration (CRÉER CE FICHIER)
├── .env.example        ← Exemple
├── setup.sh            ← Installation automatique
├── test_example.sh     ← Script de test
├── venv/               ← Environnement virtuel (créé automatiquement)
└── README.md           ← Documentation complète
```

## 🔧 Commandes utiles

```bash
# Activer l'environnement Python
source venv/bin/activate

# Test manuel
python3 cv_job_matcher.py \
  --cv "Votre CV ici..." \
  --job-title "Titre du poste" \
  --job-description "Description..." \
  --job-skills "React,Node.js"

# Désactiver l'environnement
deactivate
```

## 💡 Utilisation dans l'application

1. L'utilisateur clique sur "Match" dans l'interface
2. Sélectionne un CV
3. Clique sur "Validate"
4. Le pourcentage s'affiche automatiquement (5-15 secondes)

## 📊 Coût

- ~$0.10 - $0.20 par analyse
- Utilise GPT-4o d'OpenAI

## 🆘 Problèmes ?

### Le script ne fonctionne pas

```bash
# Réinstaller
rm -rf venv
./setup.sh
```

### Erreur de clé API

Vérifier que :
- Le fichier `.env` existe
- La clé commence par `sk-proj-`
- Pas d'espaces dans le fichier

### Besoin d'aide ?

Consulter la [documentation complète](./README.md)

---

**Prêt à matcher des CVs ! 🎯**
