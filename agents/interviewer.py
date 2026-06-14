"""InterviewerAgent — conducts multi-round mock interviews.

The interview is interactive, so the real work lives in two standalone
functions the API drives turn-by-turn:

  * ``generate_questions`` — produce questions for a given round.
  * ``score_answer``       — grade a candidate answer and give feedback.

The ``interviewer`` graph node is a thin no-op kept for graph compatibility;
the linear pipeline does not run a full interview on its own.
"""

from core.state import PlacementState
from core.llm import call_json

ROUNDS = ["dsa", "technical", "system_design", "hr"]


def generate_questions(jd_structured: dict, resume_structured: dict, round_type: str, n: int = 3) -> list[dict]:
    """Generate *n* interview questions for the given round, tailored to the JD + resume."""
    system_prompt = (
        f"You are an interviewer running the '{round_type}' round. Generate {n} interview "
        "questions appropriate for this round, tailored to the role and the candidate. "
        "Mix difficulty. For DSA give problem statements; for HR give behavioral prompts.\n"
        "Return ONLY valid JSON: {\"questions\": [{\"question\": string, \"difficulty\": "
        "\"easy\"|\"medium\"|\"hard\", \"focus\": string}]}\nPure JSON only."
    )
    user_message = (
        f"ROLE: {jd_structured.get('role_title', 'Unknown')}\n"
        f"REQUIRED SKILLS: {', '.join(jd_structured.get('required_skills', []))}\n"
        f"LIKELY TOPICS: {', '.join(jd_structured.get('interview_likely_topics', []))}\n"
        f"CANDIDATE SKILLS: {', '.join(resume_structured.get('technical_skills', []))}"
    )
    data = call_json(system_prompt, user_message, max_tokens=1200, default={"questions": []})
    return data.get("questions", [])


def score_answer(question: str, answer: str, round_type: str) -> dict:
    """Grade a single answer. Returns {score: 0-10, feedback, model_answer}."""
    system_prompt = (
        f"You are grading a candidate's answer in a '{round_type}' interview round. "
        "Be a fair but rigorous evaluator.\n"
        "Return ONLY valid JSON: {\"score\": number (0-10), \"feedback\": string, "
        "\"model_answer\": string (a concise strong answer)}\nPure JSON only."
    )
    user_message = f"QUESTION:\n{question}\n\nCANDIDATE ANSWER:\n{answer or '(no answer given)'}"
    data = call_json(
        system_prompt, user_message, max_tokens=1000,
        default={"score": 0, "feedback": "Could not evaluate the answer.", "model_answer": ""},
    )
    try:
        data["score"] = float(data.get("score", 0))
    except (TypeError, ValueError):
        data["score"] = 0.0
    return data


def interviewer(state: PlacementState) -> dict:
    """Graph node — interviews are interactive, so this is a no-op placeholder."""
    print("[InterviewerAgent] Interactive interview runs via the API, not the linear graph.")
    return {"current_phase": "interview_ready"}
