# 🤖 Configuration du Service IA de Matching CV-Job

## 📁 Structure du projet

```
Talenteedio-Back/
├── ai-service/              # Service IA séparé
│   ├── cv_job_matcher.py   # Script Python principal
│   ├── requirements.txt    # Dépendances Python
│   ├── .env               # Variables d'environnement (à créer)
│   ├── .env.example       # Exemple de configuration
│   ├── setup.sh           # Script d'installation automatique
│   ├── venv/              # Environnement virtuel Python
│   └── README.md          # Documentation détaillée
│
└── src/
    ├── graphql/resources/job/
    │   ├── schema.graphql  # Schema GraphQL avec matchCVWithJob
    │   └── resolver.ts     # Resolver pour le matching
    │
    └── helpers/ai/
        └── cv-matcher.ts   # Helper Node.js pour appeler Python
```

## 🚀 Installation Rapide

### Option 1 : Script automatique (Recommandé)

```bash
cd ai-service
./setup.sh
```

### Option 2 : Installation manuelle

```bash
cd ai-service

# 1. Créer l'environnement virtuel
python3 -m venv venv

# 2. Activer l'environnement
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# 3. Installer les dépendances
pip install -r requirements.txt

# 4. Créer le fichier .env
cp .env.example .env
```

## 🔑 Configuration de la clé API OpenAI

### 1. Obtenir une clé API

1. Aller sur https://platform.openai.com/api-keys
2. Créer un compte ou se connecter
3. Cliquer sur "Create new secret key"
4. Copier la clé (elle commence par `sk-proj-...`)

### 2. Configurer le fichier .env

Éditer `ai-service/.env` :

```bash
OPENAI_API_KEY=sk-proj-votre_cle_api_ici
```

⚠️ **IMPORTANT** : Ne jamais commiter le fichier `.env` dans Git !

## 🧪 Tester l'installation

### Test 1 : Vérifier l'installation

```bash
cd ai-service
source venv/bin/activate
python3 cv_job_matcher.py --help
```

### Test 2 : Test simple

```bash
python3 cv_job_matcher.py \
  --cv "Développeur Full Stack avec 5 ans d'expérience en React et Node.js" \
  --job-title "Senior Developer" \
  --job-description "Nous recherchons un développeur expérimenté" \
  --job-skills "React,Node.js,TypeScript"
```

Résultat attendu :
```json
{
  "overall_match_percentage": 85,
  "criteria_scores": [...],
  "strengths": [...],
  "gaps": [...],
  "recommendation": "..."
}
```

### Test 3 : Via l'API GraphQL

Démarrer le serveur Node.js puis :

```graphql
query {
  matchCVWithJob(input: { 
    cvId: "votre-cv-id", 
    jobId: "votre-job-id" 
  }) {
    overall_match_percentage
    criteria_scores {
      criterion
      score
      explanation
    }
    strengths
    gaps
    recommendation
  }
}
```

## 🔧 Intégration avec Node.js

Le service Python est appelé automatiquement par Node.js via :

1. **Frontend Angular** → Clique sur "Match"
2. **GraphQL Query** → `matchCVWithJob`
3. **Resolver TypeScript** → `src/graphql/resources/job/resolver.ts`
4. **Helper Node.js** → `src/helpers/ai/cv-matcher.ts`
5. **Script Python** → `ai-service/cv_job_matcher.py`
6. **OpenAI API** → Analyse IA
7. **Retour** → Pourcentage affiché dans le modal

## 📊 Coûts et limites

### Coûts OpenAI (GPT-4o)

- **Prix par 1K tokens** : ~$0.03 (input) / $0.06 (output)
- **Coût par analyse** : $0.10 - $0.20
- **Tokens moyens** : 2000-4000 par requête

### Recommandations

1. **Rate limiting** : Limiter à 10 analyses par utilisateur/jour
2. **Cache** : Stocker les résultats pour éviter les analyses répétées
3. **Monitoring** : Suivre l'utilisation de l'API OpenAI
4. **Budget** : Définir un budget mensuel sur OpenAI

## 🔒 Sécurité

✅ **Bonnes pratiques implémentées** :

- Clé API dans `.env` (jamais dans le code)
- `.env` dans `.gitignore`
- Authentification requise (seuls les talents)
- Validation des accès aux CVs
- Pas de logs des données sensibles

## ⚠️ Dépannage

### Erreur : "Python not found"

```bash
# Installer Python 3
sudo apt install python3 python3-venv python3-pip  # Ubuntu/Debian
brew install python3                                # macOS
```

### Erreur : "OPENAI_API_KEY not set"

Vérifier que :
1. Le fichier `ai-service/.env` existe
2. Il contient `OPENAI_API_KEY=sk-proj-...`
3. Pas d'espaces autour du `=`

### Erreur : "Module not found"

```bash
cd ai-service
source venv/bin/activate
pip install -r requirements.txt
```

### Timeout lors de l'analyse

L'analyse peut prendre 5-15 secondes. C'est normal.
Si timeout > 30s, vérifier la connexion internet et l'état de l'API OpenAI.

### Erreur : "Rate limit exceeded"

Vous avez dépassé le quota OpenAI. Solutions :
1. Attendre quelques minutes
2. Vérifier votre quota sur https://platform.openai.com/usage
3. Augmenter votre limite de quota

## 📝 TODO : Extraction du texte des CVs

Actuellement, le système utilise l'URL du CV comme placeholder.
Il faut implémenter l'extraction du texte :

### Installation des bibliothèques

```bash
npm install pdf-parse mammoth
```

### Implémentation dans `cv-matcher.ts`

```typescript
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import axios from 'axios';

export async function extractCVText(cvFileUrl: string): Promise<string> {
  // 1. Télécharger le fichier
  const response = await axios.get(cvFileUrl, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data);
  
  // 2. Détecter le type de fichier
  if (cvFileUrl.endsWith('.pdf')) {
    const data = await pdfParse(buffer);
    return data.text;
  } else if (cvFileUrl.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  
  throw new Error('Format de fichier non supporté');
}
```

## 📚 Documentation

- [README du service IA](./ai-service/README.md)
- [Documentation OpenAI](https://platform.openai.com/docs)
- [GraphQL Schema](./src/graphql/resources/job/schema.graphql)

## 🎯 Résumé des commandes

```bash
# Installation
cd ai-service && ./setup.sh

# Activer l'environnement
source ai-service/venv/bin/activate

# Test
python3 ai-service/cv_job_matcher.py --help

# Désactiver l'environnement
deactivate
```

## ✅ Checklist de déploiement

- [ ] Python 3 installé
- [ ] Dépendances installées (`pip install -r requirements.txt`)
- [ ] Fichier `.env` créé avec `OPENAI_API_KEY`
- [ ] Clé API OpenAI valide et avec crédit
- [ ] Test du script Python réussi
- [ ] Test de l'API GraphQL réussi
- [ ] Extraction du texte des CVs implémentée
- [ ] Rate limiting configuré
- [ ] Monitoring mis en place
- [ ] Budget OpenAI défini

---

**Support** : En cas de problème, consulter le [README détaillé](./ai-service/README.md)
