"""SkillGraphAgent — builds a skill-dependency DAG and a week-by-week sprint plan."""

import networkx as nx

from core.state import PlacementState
from core.llm import call_json


def skill_graph(state: PlacementState) -> dict:
    """Turn the identified gaps into an ordered learning plan.

    1. Ask the LLM for each gap skill: its prerequisites, difficulty, hours, and
       a concrete learning resource.
    2. Build a DAG with networkx and topologically sort it so prerequisites
       come first.
    3. Pack the ordered skills into weekly sprints (~10 study hours/week).
    """
    print("[SkillGraphAgent] Building skill DAG...")

    gaps = state.get("gap_list", [])
    jd_s = state.get("jd_structured", {})

    if not gaps:
        print("[SkillGraphAgent] No gaps — empty plan")
        return {"skill_dag": {"nodes": [], "edges": []}, "sprint_plan": [], "current_phase": "skill_graph_done"}

    system_prompt = (
        "You are a learning-path designer. For each skill gap, return prerequisites "
        "(only from within the same gap list — use [] if none), a difficulty, estimated "
        "study hours, one concrete free/cheap learning resource, an importance score, and "
        "short explanations.\n"
        "Return ONLY valid JSON: {\"skills\": [{\"skill\": string, \"prerequisites\": [string], "
        "\"difficulty\": \"beginner\"|\"intermediate\"|\"advanced\", \"estimated_hours\": number, "
        "\"resource\": string, \"importance\": number between 0 and 1, "
        "\"why_it_matters\": string (one sentence on why the role needs it), "
        "\"how_to_close\": string (one concrete sentence on how to close the gap)}]}\n"
        "Pure JSON only."
    )
    user_message = (
        f"TARGET ROLE: {jd_s.get('role_title', 'Unknown')}\n"
        f"SKILL GAPS TO PLAN: {gaps}"
    )

    data = call_json(system_prompt, user_message, max_tokens=2200, default={"skills": []})
    skills = data.get("skills", [])

    def _imp(v) -> float:
        try:
            return max(0.0, min(1.0, float(v)))
        except (TypeError, ValueError):
            return 0.6

    # ── Build DAG ────────────────────────────────────────────────────────────
    g = nx.DiGraph()
    meta = {}
    skill_names = {s.get("skill") for s in skills if s.get("skill")}
    for s in skills:
        name = s.get("skill")
        if not name:
            continue
        g.add_node(name)
        meta[name] = {
            "difficulty": s.get("difficulty", "intermediate"),
            "estimated_hours": float(s.get("estimated_hours", 8) or 8),
            "resource": s.get("resource", ""),
            "importance": _imp(s.get("importance", 0.6)),
            "why_it_matters": s.get("why_it_matters", ""),
            "how_to_close": s.get("how_to_close", ""),
            "status": "gap",
        }
        for prereq in s.get("prerequisites", []):
            if prereq in skill_names:
                g.add_edge(prereq, name)

    # Topological order (prerequisites first); fall back to insertion order on a cycle.
    try:
        ordered = list(nx.topological_sort(g))
    except nx.NetworkXUnfeasible:
        print("[SkillGraphAgent] Cycle detected — falling back to gap order")
        ordered = [s.get("skill") for s in skills if s.get("skill")]

    edges = [{"from": u, "to": v} for u, v in g.edges()]
    nodes = [
        {
            "id": n,
            **meta.get(
                n,
                {
                    "difficulty": "intermediate",
                    "estimated_hours": 8,
                    "resource": "",
                    "importance": 0.6,
                    "why_it_matters": "",
                    "how_to_close": "",
                    "status": "gap",
                },
            ),
        }
        for n in ordered
    ]

    # Add the candidate's matched skills as "have" nodes so the graph shows
    # strengths alongside gaps (green vs. red in the UI).
    matched = state.get("analysis", {}).get("matched_skills", [])
    existing = {n["id"].lower() for n in nodes}
    for skill in matched[:12]:  # cap to keep the graph readable
        if skill.lower() in existing:
            continue
        nodes.append(
            {
                "id": skill,
                "difficulty": "beginner",
                "estimated_hours": 0,
                "resource": "",
                "importance": 0.5,
                "why_it_matters": "",
                "how_to_close": "",
                "status": "have",
            }
        )
        existing.add(skill.lower())

    skill_dag = {"nodes": nodes, "edges": edges}

    # ── Pack into weekly sprints (~10 hrs/week) ────────────────────────────────
    sprint_plan = []
    week, week_hours = 1, 0.0
    WEEKLY_BUDGET = 10.0
    for n in ordered:
        m = meta.get(n, {})
        hrs = m.get("estimated_hours", 8.0)
        if week_hours + hrs > WEEKLY_BUDGET and week_hours > 0:
            week += 1
            week_hours = 0.0
        sprint_plan.append({
            "week": week,
            "skill": n,
            "resource": m.get("resource", ""),
            "estimated_hours": hrs,
        })
        week_hours += hrs

    print(f"[SkillGraphAgent] {len(nodes)} skills across {week} week(s)")
    return {"skill_dag": skill_dag, "sprint_plan": sprint_plan, "current_phase": "skill_graph_done"}
