import sys
import json


def count_chars(cv_text: str, job_text: str) -> dict:
    cv = cv_text or ""
    job = job_text or ""
    return {
        "cvTextLength": len(cv),
        "jobTextLength": len(job),
    }


def main() -> None:
    try:
        data = json.load(sys.stdin)
        cv_text = data.get("cvText", "")
        job_text = data.get("jobText", "")
        result = count_chars(cv_text, job_text)
        print(json.dumps(result))
    except Exception:
        # Fallback in case of malformed input or unexpected error
        print(json.dumps({"cvTextLength": 0, "jobTextLength": 0}))


if __name__ == "__main__":
    main()


