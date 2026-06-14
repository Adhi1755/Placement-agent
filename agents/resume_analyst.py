"""ResumeAnalyst agent — compares candidate resume against JD and produces a readiness score."""

from core.state import PlacementState
from core.llm import call_json


def resume_analyst(state: PlacementState) -> dict:
    """
    Calls the LLM to compare the resume against the JD and returns gap_list,
    readiness_score, plus an ``analysis`` dict (matched_skills, strengths,
    weaknesses, ats coverage).

    Note: the parsed resume in ``resume_structured`` is left untouched — the
    analysis output lives under its own ``analysis`` key.
    """
    print("[ResumeAnalyst] Calling Gemini API...")

    system_prompt = (
        "You are a senior technical recruiter. Compare the candidate resume against the job description. "
        "Return ONLY valid JSON with these fields:\n"
        "- gap_list: array of strings, each a specific missing skill or experience\n"
        "- readiness_score: float between 0.0 and 1.0 (the overall readiness)\n"
        "- dimensions: object with FIVE float scores between 0.0 and 1.0:\n"
        "    technical, resume_quality, communication, domain_knowledge, cultural_fit\n"
        "- matched_skills: array of the most relevant strings present in both resume and JD (max 15)\n"
        "- missing_keywords: array of important JD keywords absent from the resume (max 15)\n"
        "- strength_summary: one sentence about the candidate's strongest area\n"
        "- weakness_summary: one sentence about the biggest gap\n"
        "No markdown. No preamble. Pure JSON only."
    )

    user_message = (
        f"RESUME:\n{state['resume_text']}\n\n"
        f"JOB DESCRIPTION:\n{state['job_description']}"
    )

    parsed = call_json(system_prompt, user_message, max_tokens=2048, default=None)

    if not isinstance(parsed, dict):
        msg = "resume_analyst: LLM returned no parseable JSON"
        print(f"[ResumeAnalyst] ERROR — {msg}")
        return {"errors": [msg], "current_phase": "analysis_failed"}

    gap_list = parsed.get("gap_list", [])
    readiness_score = float(parsed.get("readiness_score", 0.0))

    # Normalise the five dimensions, defaulting to the overall score if missing.
    raw_dims = parsed.get("dimensions", {}) or {}
    dim_keys = [
        "technical",
        "resume_quality",
        "communication",
        "domain_knowledge",
        "cultural_fit",
    ]
    dimensions = {}
    for k in dim_keys:
        try:
            dimensions[k] = float(raw_dims.get(k, readiness_score))
        except (TypeError, ValueError):
            dimensions[k] = readiness_score

    analysis = {
        "matched_skills": parsed.get("matched_skills", []),
        "missing_keywords": parsed.get("missing_keywords", []),
        "strength_summary": parsed.get("strength_summary", ""),
        "weakness_summary": parsed.get("weakness_summary", ""),
    }

    print(
        f"[ResumeAnalyst] Done. Score: {readiness_score:.2f} | Gaps found: {len(gap_list)}"
    )

    return {
        "gap_list": gap_list,
        "readiness_score": readiness_score,
        "dimensions": dimensions,
        "analysis": analysis,
        "current_phase": "analysis_done",
    }
