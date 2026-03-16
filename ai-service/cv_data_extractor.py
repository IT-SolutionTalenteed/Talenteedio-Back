#!/usr/bin/env python3
"""
Extracteur de données CV
Extrait les compétences, langues, intérêts et formation d'un CV PDF
"""
import json
import sys
import argparse
import re
from typing import List, Dict, Any
import PyPDF2
import io

# Mots-clés pour identifier les sections
SKILLS_KEYWORDS = [
    'compétences', 'skills', 'technical skills', 'technologies', 'langages', 'programming',
    'outils', 'tools', 'frameworks', 'libraries', 'expertise', 'savoir-faire', 'compétences techniques'
]

LANGUAGES_KEYWORDS = [
    'langues', 'languages', 'idiomas', 'linguistic', 'parlé', 'spoken', 'écrit', 'written',
    'niveau', 'level', 'fluent', 'native', 'bilingue', 'bilingual'
]

INTERESTS_KEYWORDS = [
    'intérêts', 'interests', 'hobbies', 'loisirs', 'passions', 'centres d\'intérêt',
    'activités', 'activities', 'personnel', 'personal'
]

EDUCATION_KEYWORDS = [
    'formation', 'education', 'études', 'diplôme', 'degree', 'université', 'university',
    'école', 'school', 'master', 'bachelor', 'licence', 'doctorat', 'phd', 'certification'
]

EXPERIENCE_KEYWORDS = [
    'expérience', 'experience', 'professionnel', 'professional', 'carrière', 'career',
    'emploi', 'job', 'poste', 'position', 'travail', 'work'
]

# Compétences techniques validées (plus strictes)
VALID_TECHNICAL_SKILLS = [
    # Langages de programmation
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 
    'swift', 'kotlin', 'scala', 'r', 'matlab', 'perl', 'shell', 'bash', 'powershell',
    
    # Frameworks et librairies
    'react', 'angular', 'vue', 'vue.js', 'svelte', 'next.js', 'nuxt.js', 'gatsby',
    'node.js', 'nodejs', 'express', 'fastify', 'koa', 'nest.js', 'nestjs',
    'django', 'flask', 'fastapi', 'spring', 'spring boot', 'laravel', 'symfony',
    'rails', 'ruby on rails', 'asp.net', '.net', 'blazor',
    'jquery', 'bootstrap', 'tailwind', 'material-ui', 'ant design',
    
    # Bases de données
    'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'sqlite', 'oracle',
    'sql server', 'cassandra', 'dynamodb', 'firebase', 'supabase',
    
    # Cloud et DevOps
    'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'jenkins',
    'gitlab ci', 'github actions', 'terraform', 'ansible', 'vagrant',
    'nginx', 'apache', 'linux', 'ubuntu', 'centos', 'debian',
    
    # Outils de développement
    'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'slack',
    'vscode', 'intellij', 'eclipse', 'vim', 'emacs',
    
    # Technologies web
    'html', 'css', 'sass', 'scss', 'less', 'webpack', 'vite', 'parcel',
    'babel', 'eslint', 'prettier', 'jest', 'cypress', 'selenium',
    
    # Mobile
    'react native', 'flutter', 'ionic', 'xamarin', 'cordova',
    'android', 'ios', 'swift', 'objective-c',
    
    # Data Science / AI
    'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras',
    'jupyter', 'matplotlib', 'seaborn', 'plotly', 'tableau', 'power bi',
    
    # Autres
    'graphql', 'rest', 'api', 'microservices', 'websocket', 'grpc',
    'oauth', 'jwt', 'ssl', 'https', 'json', 'xml', 'yaml'
]

# Langues communes avec variations
LANGUAGE_PATTERNS = {
    'français': ['français', 'french', 'francais'],
    'anglais': ['anglais', 'english', 'anglaise'],
    'espagnol': ['espagnol', 'spanish', 'español', 'castellano'],
    'allemand': ['allemand', 'german', 'deutsch', 'allemande'],
    'italien': ['italien', 'italian', 'italiano', 'italienne'],
    'portugais': ['portugais', 'portuguese', 'português', 'portugaise'],
    'chinois': ['chinois', 'chinese', '中文', 'mandarin', 'chinoise'],
    'japonais': ['japonais', 'japanese', '日本語', 'japonaise'],
    'arabe': ['arabe', 'arabic', 'العربية'],
    'russe': ['russe', 'russian', 'русский', 'russe'],
    'néerlandais': ['néerlandais', 'dutch', 'nederlands'],
    'coréen': ['coréen', 'korean', '한국어'],
    'hindi': ['hindi', 'हिन्दी'],
    'malagasy': ['malagasy', 'malgache', 'madagasikara']
}

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extrait le texte d'un fichier PDF"""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
    except Exception as e:
        print(f"Error reading PDF: {e}", file=sys.stderr)
        return ""

def find_section_content(text: str, keywords: List[str]) -> str:
    """Trouve le contenu d'une section basée sur des mots-clés"""
    lines = text.split('\n')
    
    section_start = -1
    for i, line in enumerate(lines):
        line_lower = line.lower().strip()
        if any(keyword in line_lower for keyword in keywords):
            section_start = i
            break
    
    if section_start == -1:
        return ""
    
    # Extraire le contenu de la section
    section_content = []
    for i in range(section_start + 1, len(lines)):
        line = lines[i].strip()
        if not line:
            continue
        
        # Arrêter si on trouve une nouvelle section majeure
        line_lower = line.lower()
        if (any(keyword in line_lower for keyword in EDUCATION_KEYWORDS + EXPERIENCE_KEYWORDS) and
            line_lower not in [kw for kw in keywords]):
            break
        
        section_content.append(line)
        
        # Limiter à 8 lignes pour la section compétences
        if len(section_content) >= 8:
            break
    
    return '\n'.join(section_content)

def extract_skills(text: str) -> List[str]:
    """Extrait les compétences techniques du texte"""
    skills = []
    
    # Chercher dans la section compétences
    skills_section = find_section_content(text, SKILLS_KEYWORDS)
    text_to_analyze = skills_section if skills_section else text
    
    text_lower = text_to_analyze.lower()
    
    # Chercher les compétences validées uniquement
    for skill in VALID_TECHNICAL_SKILLS:
        if skill.lower() in text_lower:
            # Vérifier que c'est bien un mot entier (pas une partie d'un autre mot)
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, text_lower):
                skills.append(skill)
    
    # Supprimer les doublons et limiter à 12 compétences max
    skills = list(set(skills))[:12]
    return skills

def extract_languages(text: str) -> List[str]:
    """Extrait les langues du texte avec niveaux"""
    languages = []
    
    # Chercher dans la section langues
    languages_section = find_section_content(text, LANGUAGES_KEYWORDS)
    text_to_analyze = languages_section if languages_section else text
    
    text_lower = text_to_analyze.lower()
    
    # Chercher chaque langue avec son niveau
    for lang_name, patterns in LANGUAGE_PATTERNS.items():
        for pattern in patterns:
            if pattern.lower() in text_lower:
                # Chercher le contexte autour de la langue pour trouver le niveau
                lang_pattern = rf'{re.escape(pattern.lower())}[^\n]*'
                match = re.search(lang_pattern, text_lower)
                if match:
                    lang_context = match.group().strip()
                    
                    # Nettoyer et formater
                    if any(level in lang_context for level in ['natif', 'native', 'maternel']):
                        languages.append(f"{lang_name.capitalize()} (natif)")
                    elif any(level in lang_context for level in ['courant', 'fluent', 'bilingue']):
                        languages.append(f"{lang_name.capitalize()} (courant)")
                    elif any(level in lang_context for level in ['intermédiaire', 'intermediate', 'moyen']):
                        languages.append(f"{lang_name.capitalize()} (intermédiaire)")
                    elif any(level in lang_context for level in ['débutant', 'beginner', 'basic', 'notions']):
                        languages.append(f"{lang_name.capitalize()} (débutant)")
                    else:
                        languages.append(lang_name.capitalize())
                    break
    
    # Supprimer les doublons
    languages = list(set(languages))[:4]
    return languages

def extract_interests(text: str) -> List[str]:
    """Extrait les centres d'intérêt du texte"""
    interests = []
    
    # Chercher dans la section intérêts
    interests_section = find_section_content(text, INTERESTS_KEYWORDS)
    if interests_section:
        # Diviser par virgules, points-virgules ou nouvelles lignes
        interest_items = re.split(r'[,;\n]', interests_section)
        for item in interest_items:
            item = item.strip()
            if item and len(item) > 2 and len(item) < 50:
                interests.append(item)
    
    # Limiter le nombre d'intérêts
    interests = interests[:6]
    return interests

def extract_education(text: str) -> List[str]:
    """Extrait la formation du texte"""
    education = []
    
    # Chercher dans la section formation
    education_section = find_section_content(text, EDUCATION_KEYWORDS)
    if education_section:
        # Diviser par nouvelles lignes
        education_items = education_section.split('\n')
        for item in education_items:
            item = item.strip()
            if item and len(item) > 10 and len(item) < 200:
                education.append(item)
    
    # Limiter le nombre de formations
    education = education[:4]
    return education

def extract_experience_years(text: str) -> int:
    """Extrait le nombre d'années d'expérience"""
    text_lower = text.lower()
    
    # Patterns pour trouver les années d'expérience
    patterns = [
        r'(\d+)\s*(?:ans?|years?)\s*(?:d[\'e]|of)?\s*(?:expérience|experience)',
        r'(?:expérience|experience)\s*(?:de|of)?\s*(\d+)\s*(?:ans?|years?)',
        r'(\d+)\+?\s*(?:ans?|years?)\s*(?:dans|in|of)',
    ]
    
    years = []
    for pattern in patterns:
        matches = re.findall(pattern, text_lower)
        for match in matches:
            try:
                years.append(int(match))
            except ValueError:
                continue
    
    # Retourner la valeur la plus élevée trouvée (mais raisonnable)
    if years:
        max_years = max(years)
        return min(max_years, 50)  # Limiter à 50 ans max
    
    return 0

def extract_position(text: str) -> str:
    """Extrait le poste/titre professionnel du CV"""
    lines = text.split('\n')
    
    # Mots-clés qui indiquent un titre professionnel
    job_keywords = [
        'développeur', 'developer', 'ingénieur', 'engineer', 'consultant', 'manager', 
        'analyst', 'analyste', 'designer', 'architect', 'architecte', 'lead', 'senior', 
        'junior', 'chef', 'directeur', 'director', 'responsable', 'coordinateur',
        'spécialiste', 'specialist', 'expert', 'technicien', 'technician',
        'programmeur', 'programmer', 'administrateur', 'administrator',
        'product owner', 'scrum master', 'devops', 'fullstack', 'frontend', 'backend',
        'data scientist', 'data analyst', 'business analyst', 'project manager',
        'web developer', 'mobile developer', 'software engineer', 'system administrator'
    ]
    
    # Mots qui indiquent probablement un nom (à éviter)
    name_indicators = [
        'né', 'née', 'born', 'age', 'ans', 'years old', 'célibataire', 'marié', 'married',
        'single', 'permis', 'driving', 'license', 'nationalité', 'nationality'
    ]
    
    # Chercher dans tout le CV les lignes qui contiennent des mots-clés de poste
    potential_positions = []
    
    for i, line in enumerate(lines):
        line_clean = line.strip()
        line_lower = line_clean.lower()
        
        # Ignorer les lignes vides ou trop courtes/longues
        if len(line_clean) < 5 or len(line_clean) > 80:
            continue
            
        # Ignorer les lignes avec des coordonnées
        if re.search(r'[@\+\d{5}]', line_clean):
            continue
            
        # Ignorer les lignes avec des indicateurs de nom
        if any(indicator in line_lower for indicator in name_indicators):
            continue
            
        # Ignorer les noms (tout en majuscules sans mots-clés de poste)
        if line_clean.isupper() and not any(keyword in line_lower for keyword in job_keywords):
            continue
            
        # Ignorer les lignes qui sont clairement des noms (prénom + nom)
        words = line_clean.split()
        if len(words) == 2 and all(word[0].isupper() and word[1:].islower() for word in words):
            continue
        
        # Si la ligne contient des mots-clés de poste, c'est probablement un titre
        if any(keyword in line_lower for keyword in job_keywords):
            potential_positions.append((line_clean, i))
    
    # Si on a trouvé des positions potentielles, prendre la première
    if potential_positions:
        return potential_positions[0][0]
    
    # Sinon, chercher dans les premières lignes (après avoir sauté le nom)
    start_search = 2  # Commencer après les 2 premières lignes (nom probable)
    
    for i, line in enumerate(lines[start_search:start_search+8]):
        line_clean = line.strip()
        line_lower = line_clean.lower()
        
        # Ignorer les lignes vides ou trop courtes/longues
        if len(line_clean) < 5 or len(line_clean) > 80:
            continue
            
        # Ignorer les coordonnées
        if re.search(r'[@\+\d{5}]', line_clean):
            continue
            
        # Ignorer les indicateurs de nom
        if any(indicator in line_lower for indicator in name_indicators):
            continue
            
        # Ignorer les lignes avec des mots-clés de contact
        if any(word in line_lower for word in ['email', 'tel', 'phone', 'linkedin', 'github', 'portfolio', 'adresse', 'address']):
            continue
        
        # Ignorer les noms (tout en majuscules)
        if line_clean.isupper():
            continue
            
        # Ignorer les lignes qui sont clairement des noms
        words = line_clean.split()
        if len(words) == 2 and all(word[0].isupper() and word[1:].islower() for word in words):
            continue
        
        # Si c'est une ligne qui commence par une majuscule et semble être un titre
        if line_clean[0].isupper() and not any(char.isdigit() for char in line_clean):
            return line_clean
    
    return ""

def main():
    parser = argparse.ArgumentParser(description='Extract data from CV PDF')
    parser.add_argument('--cv-path', required=True, help='Path to CV PDF file')
    
    args = parser.parse_args()
    
    # Extraire le texte du PDF
    text = extract_text_from_pdf(args.cv_path)
    
    if not text:
        print(json.dumps({
            "error": "Could not extract text from PDF"
        }))
        return 1
    
    # Extraire les données
    result = {
        "skills": extract_skills(text),
        "languages": extract_languages(text),
        "interests": extract_interests(text),
        "education": extract_education(text),
        "experience": extract_experience_years(text),
        "position": extract_position(text)
    }
    
    # Retourner le résultat en JSON
    print(json.dumps(result, ensure_ascii=False))
    return 0

if __name__ == '__main__':
    sys.exit(main())