"""RecruiterAgent — adversarial agent that challenges resume claims against the JD."""

from core.state import PlacementState
from core.llm import call_json


def _clamp(v, lo=0.0, hi=1.0) -> float:
    try:
        return max(lo, min(hi, float(v)))
    except (TypeError, ValueError):
        return 0.6


def recruiter(state: PlacementState) -> dict:
    """Play a skeptical recruiter: poke holes in the candidate's fit.

    Produces 3-5 pointed challenges (depth-of-knowledge doubts, unverified
    claims, missing evidence) and appends them to ``debate_log`` tagged as the
    'recruiter'.
    """
    print("[RecruiterAgent] Generating challenges...")

    resume_s = state.get("resume_structured", {})
    jd_s = state.get("jd_structured", {})
    gaps = state.get("gap_list", [])

    system_prompt = (
        "You are a tough, skeptical technical recruiter reviewing a candidate for a role. "
        "Your job is to challenge the candidate: question shallow claims, flag missing "
        "evidence, and probe whether listed skills are real. Be specific and fair, not cruel.\n"
        "Return ONLY valid JSON: {\"challenges\": [{\"argument\": string, \"target\": string, "
        "\"strength\": number between 0 and 1}]}\n"
        "'target' is the skill/claim/section being challenged. 'strength' is how damaging the "
        "challenge is. Produce 3 to 5 challenges. No markdown. Pure JSON only."
    )

    user_message = (
        f"ROLE: {jd_s.get('role_title', 'Unknown')}\n"
        f"REQUIRED SKILLS: {', '.join(jd_s.get('required_skills', []))}\n\n"
        f"CANDIDATE SKILLS: {', '.join(resume_s.get('technical_skills', []))}\n"
        f"PROJECTS: {[p.get('name') for p in resume_s.get('projects', [])]}\n"
        f"IDENTIFIED GAPS: {', '.join(gaps)}"
    )

    data = call_json(system_prompt, user_message, max_tokens=1024, default={"challenges": []})
    challenges = data.get("challenges", [])

    entries = [
        {
            "agent": "recruiter",
            "argument": c.get("argument", ""),
            "target": c.get("target", ""),
            "strength": _clamp(c.get("strength", 0.6)),
        }
        for c in challenges
        if c.get("argument")
    ]

    print(f"[RecruiterAgent] Raised {len(entries)} challenge(s)")
    return {"debate_log": entries, "current_phase": "recruiter_done"}
