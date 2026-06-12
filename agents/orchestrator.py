"""Orchestrator agent — prints pipeline status and routes the graph to the next node."""

from core.state import PlacementState


def orchestrator(state: PlacementState) -> dict:
    """
    Prints the current pipeline status (phase, score, gap count) and returns an empty dict.
    Does NOT call any LLM.
    """
    phase = state.get("current_phase", "start")
    score = state.get("readiness_score", None)
    gaps = len(state.get("gap_list", []))

    score_str = f"{score:.2f}" if score is not None and score != 0.0 else "N/A"
    print(f"[Orchestrator] Phase: {phase} | Score: {score_str} | Gaps: {gaps}")

    return {}


def route_from_orchestrator(state: PlacementState) -> str:
    """
    Routing function for the conditional edge leaving the orchestrator node.

    Today's routing logic (Week 1):
    - gap_list is empty → run resume_analyst
    - debate_log is empty → done (skip adversarial agents for now)
    - otherwise → done
    """
    gap_list = state.get("gap_list", [])
    debate_log = state.get("debate_log", [])

    if not gap_list:
        return "resume_analyst"

    if not debate_log:
        return "done"

    return "done"
