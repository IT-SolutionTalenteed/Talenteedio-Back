# CV-Job Matching AI Service

Service d'intelligence artificielle pour matcher les CVs des candidats avec les offres d'emploi en utilisant OpenAI GPT-4.

## 📁 Structure

```
ai-service/
├── cv_job_matcher.py    # Script principal de matching
├── requirements.txt     # Dépendances Python
├── .env.example        # Exemple de configuration
├── .env               # Configuration (à créer)
└── README.md          # Cette documentation
```

## 🚀 Installation

### 1. Créer un environnement virtuel Python

```bash
cd ai-service
python3 -m venv venv
source venv/bin/activate  # Sur Linux/Mac
# ou
venv\Scripts\activate  # Sur Windows
```

### 2. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 3. Configuration

Créer un fichier `.env` à partir de l'exemple :

```bash
cp .env.example .env
```

Éditer `.env` et ajouter votre clé API OpenAI :

```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
```

**Obtenir une clé API :** https://platform.openai.com/api-keys

### 4. Rendre le script exécutable

```bash
chmod +x cv_job_matcher.py
```

## 🧪 Test du service

### Test en ligne de commande

```bash
python3 cv_job_matcher.py \
  --cv "Développeur Full Stack avec 5 ans d'expérience en React, Node.js et TypeScript. Master en informatique." \
  --job-title "Senior Full Stack Developer" \
  --job-description "Nous recherchons un développeur expérimenté pour rejoindre notre équipe" \
  --job-skills "React,Node.js,TypeScript,MongoDB" \
  --experience 5
```

### Test avec un fichier CV

```bash
python3 cv_job_matcher.py \
  --cv /path/to/cv.txt \
  --job-title "Senior Developer" \
  --job-description "Description du poste..." \
  --job-skills "JavaScript,Python" \
  --output result.json
```

## 📊 Format de réponse

```json
{
  "overall_match_percentage": 85,
  "criteria_scores": [
    {
      "criterion": "Skills Match",
      "score": 90,
      "explanation": "Excellente maîtrise des technologies requises"
    },
    {
      "criterion": "Experience Level",
      "score": 85,
      "explanation": "5 ans d'expérience pertinente"
    }
  ],
  "strengths": [
    "Expertise en React et Node.js",
    "Expérience avec TypeScript",
    "Formation académique solide"
  ],
  "gaps": [
    "Expérience limitée avec MongoDB",
    "Pas de mention de tests unitaires"
  ],
  "recommendation": "Candidat très qualifié avec quelques lacunes mineures qui peuvent être comblées par formation."
}
```

## 🔧 Intégration avec Node.js

Le service est appelé depuis Node.js via le helper TypeScript :

```typescript
import { matchCVWithJob } from './helpers/ai/cv-matcher';

const result = await matchCVWithJob({
  cvText: "Contenu du CV...",
  jobTitle: "Senior Developer",
  jobDescription: "Description...",
  jobSkills: ["React", "Node.js"],
  experienceRequired: 5
});

console.log(`Match: ${result.overall_match_percentage}%`);
```

## 💰 Coûts OpenAI

- **Modèle utilisé :** GPT-4o (2024-08-06)
- **Coût estimé par analyse :** $0.10 - $0.20
- **Tokens moyens :** 2000-4000 par requête

### Optimisations possibles

1. **Cache :** Stocker les résultats pour éviter les analyses répétées
2. **Rate limiting :** Limiter le nombre de requêtes par utilisateur
3. **Batch processing :** Traiter plusieurs CVs en arrière-plan

## 🔒 Sécurité

- ✅ Clé API stockée dans `.env` (jamais dans le code)
- ✅ `.env` ajouté au `.gitignore`
- ✅ Validation des accès côté backend
- ✅ Seuls les talents peuvent matcher leurs propres CVs

## 📝 Critères d'évaluation

L'IA évalue les candidats sur 5 critères :

1. **Skills Match** - Compétences techniques et soft skills
2. **Experience Level** - Années et pertinence de l'expérience
3. **Education & Qualifications** - Formation académique
4. **Role Fit** - Adéquation avec les responsabilités
5. **Career Trajectory** - Progression de carrière

## ⚠️ Dépannage

### Erreur : "OpenAI library not installed"
```bash
pip install openai
```

### Erreur : "OPENAI_API_KEY environment variable not set"
Vérifier que le fichier `.env` existe et contient la clé API.

### Erreur : "Failed to start Python process"
Vérifier que Python 3 est installé :
```bash
python3 --version
```

### Timeout
L'analyse peut prendre 5-15 secondes. Augmenter le timeout si nécessaire.

## 📚 Documentation

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Python dotenv](https://pypi.org/project/python-dotenv/)

## 🔄 Mise à jour

Pour mettre à jour les dépendances :

```bash
pip install --upgrade -r requirements.txt
```

## 📞 Support

En cas de problème, vérifier :
1. La clé API OpenAI est valide
2. L'environnement virtuel est activé
3. Les dépendances sont installées
4. Le fichier `.env` est correctement configuré
