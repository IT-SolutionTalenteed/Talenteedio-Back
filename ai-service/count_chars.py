import sys
import json
import os


try:
    from openai import OpenAI  # type: ignore
    _OPENAI_IMPORTED = True
except Exception:
    OpenAI = None  # type: ignore
    _OPENAI_IMPORTED = False


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MODEL_NAME = "gpt-4o-mini"


def clamp_score(value: float) -> int:
    try:
        v = float(value)
    except Exception:
        v = 0.0
    if v < 0:
        v = 0.0
    if v > 100:
        v = 100.0
    return int(round(v))


def compute_relevance_score(cv_text: str, job_text: str) -> dict:
    if not _OPENAI_IMPORTED:
        raise RuntimeError("Le package 'openai' n'est pas installé dans l'environnement Python.")
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY manquante dans l'environnement.")

    client = OpenAI(api_key=OPENAI_API_KEY)

    # Couper les textes trop longs pour éviter un dépassement de token
    max_chars = 20000
    cv_snippet = (cv_text or "")[:max_chars]
    job_snippet = (job_text or "")[:max_chars]

    system_prompt = (
        "Tu es un évaluateur expert de matching CV ↔ Offre d'emploi. "
        "Tu analyses la pertinence du profil du candidat par rapport à la fiche de poste. "
        "Tu produis une analyse argumentée, structurée et objective."
    )
    user_prompt = (
        "PROFIL DU CANDIDAT:\n" + cv_snippet + "\n\n"
        "FICHE DE POSTE:\n" + job_snippet + "\n\n"
        "TÂCHE I - ANALYSE DU PROFIL:\n"
        "1. Compare les compétences clés du candidat avec celles exigées dans la fiche de poste.\n"
        "2. Rédige une synthèse structurée de l'adéquation.\n"
        "3. Crée un tableau d'évaluation avec 4 colonnes:\n"
        "   - Critères\n"
        "   - Note (sur 10)\n"
        "   - Raisons de la Note\n"
        "   - Commentaires détaillés\n"
                "   Grille de notation: 1-3 = très insuffisant, 4-5 = insuffisant, 6-7 = correct, 8-9 = bon, 10 = excellent.\n\n"
        "TÂCHE II - CALCUL DU TAUX DE MATCH:\n"
        "1. Calcule le taux de correspondance global (%) basé sur la moyenne pondérée des notes.\n"
        "2. Interprète le résultat:\n"
        "   - ≥80% : Candidat fortement aligné\n"
        "   - <80% : Points à améliorer ou clarifier\n\n"
        "RÉPONDS EN JSON STRICT avec cette structure:\n"
        "{\n"
        "  \"matchPercentage\": number (0-100),\n"
        "  \"synthesis\": string,\n"
        "  \"evaluationTable\": [\n"
        "    {\n"
        "      \"criterion\": string,\n"
        "      \"score\": number (1-10),\n"
        "      \"reasons\": string,\n"
        "      \"comments\": string\n"
        "    }\n"
        "  ],\n"
        "  \"interpretation\": string,\n"
        "  \"recommendations\": string\n"
        "}"
    )

    chat = client.chat.completions.create(
        model=MODEL_NAME,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
    )

    content = (chat.choices[0].message.content or "{}").strip()
    data = json.loads(content)
    
    # Normaliser le matchPercentage
    match_percentage = clamp_score(data.get("matchPercentage", 0))
    
    return {
        "matchPercentage": match_percentage,
        "synthesis": str(data.get("synthesis", "")),
        "evaluationTable": data.get("evaluationTable", []),
        "interpretation": str(data.get("interpretation", "")),
        "recommendations": str(data.get("recommendations", ""))
    }


def main() -> None:
    payload = json.load(sys.stdin)
    cv_text = payload.get("cvText", "")
    job_text = payload.get("jobText", "")
    result = compute_relevance_score(cv_text, job_text)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()


