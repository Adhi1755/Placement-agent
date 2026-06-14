"""AdvocateAgent — defends the candidate, rebutting the recruiter's challenges."""

from core.state import PlacementState
from core.llm import call_json


def _clamp(v, lo=0.0, hi=1.0) -> float:
    try:
        return max(lo, min(hi, float(v)))
    except (TypeError, ValueError):
        return 0.6


def advocate(state: PlacementState) -> dict:
    """Play the candidate's advocate: respond to the recruiter's challenges.

    Reads the recruiter entries already in ``debate_log`` and produces a
    rebuttal for each, appending them tagged as the 'advocate'.
    """
    print("[AdvocateAgent] Generating rebuttals...")

    resume_s = state.get("resume_structured", {})
    analysis = state.get("analysis", {})
    debate = state.get("debate_log", [])
    challenges = [d for d in debate if d.get("agent") == "recruiter"]

    if not challenges:
        print("[AdvocateAgent] No challenges to rebut — skipping")
        return {"current_phase": "advocate_done"}

    system_prompt = (
        "You are a supportive career advocate defending a candidate. For each recruiter "
        "challenge, give a constructive rebuttal: highlight real evidence from the resume, "
        "reframe gaps as learnable, and stay honest (don't fabricate experience).\n"
        "Return ONLY valid JSON: {\"rebuttals\": [{\"argument\": string, \"target\": string, "
        "\"strength\": number between 0 and 1}]}\n"
        "Provide one rebuttal per challenge, matching the same 'target'. 'strength' is how "
        "convincing the rebuttal is. Pure JSON only."
    )

    user_message = (
        f"CANDIDATE STRENGTHS: {analysis.get('strength_summary', '')}\n"
        f"SKILLS: {', '.join(resume_s.get('technical_skills', []))}\n"
        f"PROJECTS: {[p.get('name') for p in resume_s.get('projects', [])]}\n\n"
        "RECRUITER CHALLENGES:\n"
        + "\n".join(f"- ({c.get('target')}) {c.get('argument')}" for c in challenges)
    )

    data = call_json(system_prompt, user_message, max_tokens=1200, default={"rebuttals": []})
    rebuttals = data.get("rebuttals", [])

    entries = [
        {
            "agent": "advocate",
            "argument": r.get("argument", ""),
            "target": r.get("target", ""),
            "strength": _clamp(r.get("strength", 0.6)),
        }
        for r in rebuttals
        if r.get("argument")
    ]

    print(f"[AdvocateAgent] Produced {len(entries)} rebuttal(s)")
    return {"debate_log": entries, "current_phase": "advocate_done"}
