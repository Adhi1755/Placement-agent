"""JudgeAgent — weighs the recruiter/advocate debate and delivers a verdict."""

from core.state import PlacementState
from core.llm import call_json


def judge(state: PlacementState) -> dict:
    """Read the debate + dimension scores and produce a structured verdict.

    Output (state key ``verdict``):
        recruiter_wins_on : {point, detail}   — the candidate's weakest agreed gap
        advocate_wins_on  : {point, detail}   — the strongest agreed strength
        contested         : {point, detail}   — the key arguable prep area
        final_readiness   : int 0–100
        summary           : 3-line plain-English verdict
    """
    print("[JudgeAgent] Weighing the debate...")

    debate = state.get("debate_log", [])
    dimensions = state.get("dimensions", {})
    overall = state.get("readiness_score", 0.0)

    if not debate:
        print("[JudgeAgent] No debate to judge — emitting a minimal verdict")
        return {
            "verdict": {
                "recruiter_wins_on": {"point": "", "detail": ""},
                "advocate_wins_on": {"point": "", "detail": ""},
                "contested": {"point": "", "detail": ""},
                "final_readiness": int(round(overall * 100)),
                "summary": "Not enough debate to render a verdict.",
            },
            "current_phase": "judge_done",
        }

    debate_text = "\n".join(
        f"[{d.get('agent')}] (target={d.get('target')}, strength={d.get('strength')}) {d.get('argument')}"
        for d in debate
    )

    system_prompt = (
        "You are the hiring-committee judge. Weigh the recruiter's challenges against the "
        "advocate's rebuttals and deliver a fair verdict.\n"
        "Return ONLY valid JSON with exactly these fields:\n"
        '{\n'
        '  "recruiter_wins_on": {"point": string, "detail": string},\n'
        '  "advocate_wins_on": {"point": string, "detail": string},\n'
        '  "contested": {"point": string, "detail": string},\n'
        '  "final_readiness": integer 0-100,\n'
        '  "summary": string (2-3 sentences, plain English)\n'
        '}\n'
        "recruiter_wins_on = the candidate's weakest agreed-upon gap. "
        "advocate_wins_on = the strongest agreed-upon strength. "
        "contested = the key arguable area the candidate should prepare. Pure JSON only."
    )
    user_message = (
        f"OVERALL READINESS (0-1): {overall}\n"
        f"DIMENSION SCORES: {dimensions}\n\n"
        f"DEBATE TRANSCRIPT:\n{debate_text}"
    )

    default = {
        "recruiter_wins_on": {"point": "", "detail": ""},
        "advocate_wins_on": {"point": "", "detail": ""},
        "contested": {"point": "", "detail": ""},
        "final_readiness": int(round(overall * 100)),
        "summary": "",
    }
    verdict = call_json(system_prompt, user_message, max_tokens=900, default=None)
    if not isinstance(verdict, dict):
        verdict = default
    else:
        # Make sure final_readiness is an int even if the model returned a string/float.
        try:
            verdict["final_readiness"] = int(round(float(verdict.get("final_readiness", overall * 100))))
        except (TypeError, ValueError):
            verdict["final_readiness"] = int(round(overall * 100))

    print(f"[JudgeAgent] Verdict ready — final readiness {verdict.get('final_readiness')}")
    return {"verdict": verdict, "current_phase": "judge_done"}
