"""Shared PlacementState TypedDict used by every agent node in the pipeline."""

from typing import TypedDict, List, Annotated
import operator


class DebateEntry(TypedDict):
    agent: str
    argument: str
    target: str
    strength: float  # 0.0–1.0, how strong this argument is (drives the card strength bar)


class InterviewRound(TypedDict):
    round_type: str
    question: str
    answer: str
    score: float
    feedback: str


class SprintTask(TypedDict):
    week: int
    skill: str
    resource: str
    estimated_hours: float


class PlacementState(TypedDict):
    resume_text: str
    job_description: str
    resume_source: str
    jd_source: str
    skill_rubric: dict
    resume_structured: dict
    jd_structured: dict
    analysis: dict
    dimensions: dict          # {technical, resume_quality, communication, domain_knowledge, cultural_fit}
    gap_list: List[str]
    readiness_score: float
    debate_log: Annotated[List[DebateEntry], operator.add]
    verdict: dict             # judge output: who wins what, contested, final_readiness, summary
    resume_rewrite: dict      # {rewritten_text, ats_before, ats_after, changes}
    skill_dag: dict
    sprint_plan: List[SprintTask]
    interview_history: List[InterviewRound]
    current_phase: str
    errors: Annotated[List[str], operator.add]
