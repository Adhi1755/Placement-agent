"""ResumeWriterAgent — rewrites the resume tailored to the JD and scores ATS lift."""

from core.state import PlacementState
from core.llm import call_json


def _ats_coverage(text: str, keywords: list[str]) -> int:
    """Percentage of JD ATS keywords that appear (case-insensitive substring) in *text*."""
    if not keywords:
        return 0
    hay = (text or "").lower()
    hits = sum(1 for kw in keywords if kw.lower() in hay)
    return round(100 * hits / len(keywords))


def resume_writer(state: PlacementState) -> dict:
    """Produce an ATS-tailored rewrite of the resume.

    ``ats_before`` / ``ats_after`` are computed deterministically from JD keyword
    coverage on the original vs. rewritten text (no extra LLM call), so the
    numbers are honest rather than self-reported.
    """
    print("[ResumeWriterAgent] Rewriting resume for ATS...")

    original = state.get("resume_text", "")
    jd_s = state.get("jd_structured", {})
    gaps = state.get("gap_list", [])
    keywords = jd_s.get("keywords_for_ats", [])

    system_prompt = (
        "You are an expert technical resume writer. Rewrite the candidate's resume to better "
        "match the target role WITHOUT inventing experience, skills, or metrics they don't have. "
        "You may rephrase, surface relevant existing skills, add strong action verbs, quantify "
        "where the original implies numbers, and weave in JD keywords that genuinely apply.\n"
        "Return ONLY valid JSON:\n"
        '{"rewritten_text": string (the full rewritten resume in plain text),\n'
        ' "changes": [string, ...] (3-6 bullet notes on what you improved)}\n'
        "Pure JSON only."
    )
    user_message = (
        f"TARGET ROLE: {jd_s.get('role_title', 'Unknown')}\n"
        f"JD KEYWORDS TO INCORPORATE WHERE TRUE: {', '.join(keywords)}\n"
        f"KNOWN GAPS (do NOT fabricate these): {', '.join(gaps)}\n\n"
        f"ORIGINAL RESUME:\n{original}"
    )

    data = call_json(system_prompt, user_message, max_tokens=2500, default=None)
    if not isinstance(data, dict) or not data.get("rewritten_text"):
        print("[ResumeWriterAgent] Rewrite failed — keeping original")
        rewrite = {
            "rewritten_text": original,
            "changes": [],
            "ats_before": _ats_coverage(original, keywords),
            "ats_after": _ats_coverage(original, keywords),
        }
        return {"resume_rewrite": rewrite, "current_phase": "rewrite_done"}

    rewritten = data.get("rewritten_text", original)
    rewrite = {
        "rewritten_text": rewritten,
        "changes": data.get("changes", []),
        "ats_before": _ats_coverage(original, keywords),
        "ats_after": _ats_coverage(rewritten, keywords),
    }
    print(
        f"[ResumeWriterAgent] ATS {rewrite['ats_before']} -> {rewrite['ats_after']} "
        f"({len(rewrite['changes'])} changes)"
    )
    return {"resume_rewrite": rewrite, "current_phase": "rewrite_done"}
