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

    Drives the full analysis pipeline:

        parser_agent → resume_analyst → recruiter → advocate → skill_graph → done

    Routing is driven by ``current_phase`` (the phase the *last* agent set), not
    by whether an agent produced any output. That keeps the pipeline moving even
    when a stage legitimately emits nothing (e.g. no recruiter challenges) or
    when an LLM call fails — otherwise the graph could loop on that stage forever.

    (The interviewer is interactive and runs via the API, not this graph.)
    """
    phase = state.get("current_phase", "start")

    # Each phase maps to the next node to run. Missing/unknown phases fall through
    # to the resume_structured check below (handles a fresh "start" state) or done.
    next_for_phase = {
        "parsing_done": "resume_analyst",
        "analysis_done": "recruiter",
        "recruiter_done": "advocate",
        "advocate_done": "skill_graph",
        "skill_graph_done": "judge",
        "judge_done": "resume_writer",
        "rewrite_done": "done",
    }

    # Any failure phase ends the run rather than retrying the failed stage.
    if phase.endswith("_failed"):
        return "done"

    if phase in next_for_phase:
        return next_for_phase[phase]

    # Fresh state (phase "start") or resume not parsed yet → parse first.
    if not state.get("resume_structured", {}):
        return "parser_agent"

    return "done"
