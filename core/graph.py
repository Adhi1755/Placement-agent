"""LangGraph StateGraph builder — wires all agent nodes into the placement pipeline."""

from langgraph.graph import StateGraph, END

from core.state import PlacementState
from agents.orchestrator import orchestrator, route_from_orchestrator
from agents.resume_analyst import resume_analyst
from agents.recruiter import recruiter
from agents.advocate import advocate
from agents.skill_graph import skill_graph
from agents.interviewer import interviewer
from agents.parser_agent import parser_agent_node


def build_graph():
    """Build and compile the LangGraph StateGraph for the placement pipeline."""
    graph = StateGraph(PlacementState)

    # Register all nodes
    graph.add_node("orchestrator", orchestrator)
    graph.add_node("parser_agent", parser_agent_node)
    graph.add_node("resume_analyst", resume_analyst)
    graph.add_node("recruiter", recruiter)
    graph.add_node("advocate", advocate)
    graph.add_node("skill_graph", skill_graph)
    graph.add_node("interviewer", interviewer)

    # Entry point
    graph.set_entry_point("orchestrator")

    # Conditional routing from orchestrator
    graph.add_conditional_edges(
        "orchestrator",
        route_from_orchestrator,
        {
            "parser_agent":   "parser_agent",
            "resume_analyst": "resume_analyst",
            "recruiter":      "recruiter",
            "advocate":       "advocate",
            "skill_graph":    "skill_graph",
            "interviewer":    "interviewer",
            "done":           END,
        },
    )

    # After parser_agent, loop back to orchestrator
    graph.add_edge("parser_agent", "orchestrator")

    # After resume_analyst, loop back to orchestrator
    graph.add_edge("resume_analyst", "orchestrator")

    return graph.compile()
