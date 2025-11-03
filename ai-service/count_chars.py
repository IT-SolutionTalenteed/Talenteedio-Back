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


def compute_relevance_score(cv_text: str, job_text: str) -> tuple[int, str, str]:
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
        "Tu es un évaluateur de matching CV ↔ Offre d'emploi. "
        "Analyse la pertinence du texte de CV fourni par rapport au texte d'offre. "
        "Retourne UNIQUEMENT un JSON strict avec une clé 'score' (entier 0..100) où 0 signifie 'pas pertinent' et 100 'parfaitement aligné'."
    )
    user_prompt = (
        "CV_TEXT:\n" + cv_snippet + "\n\nJOB_TEXT:\n" + job_snippet + "\n\n"
        "Tâches:\n"
        "1) Évalue la pertinence globale (0..100).\n"
        "2) Fais une analyse détaillée de la correspondance (points forts, points faibles).\n"
        "3) Donne des recommandations concrètes et actionnables pour améliorer le score (format bref).\n\n"
        "Réponds en JSON STRICT: {\"score\": number, \"analysis\": string, \"recommendations\": string}."
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
    score = clamp_score(data.get("score", 0))
    analysis = str(data.get("analysis", ""))
    recommendations = str(data.get("recommendations", ""))
    return score, analysis, recommendations


def main() -> None:
    payload = json.load(sys.stdin)
    cv_text = payload.get("cvText", "")
    job_text = payload.get("jobText", "")
    score, analysis, recommendations = compute_relevance_score(cv_text, job_text)
    print(json.dumps({"score": score, "analysis": analysis, "recommendations": recommendations}))


if __name__ == "__main__":
    main()


