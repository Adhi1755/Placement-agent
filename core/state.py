"""Shared PlacementState TypedDict used by every agent node in the pipeline."""

from typing import TypedDict, List, Annotated
import operator


class DebateEntry(TypedDict):
    agent: str
    argument: str
    target: str


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
    skill_rubric: dict
    resume_structured: dict
    jd_structured: dict
    gap_list: List[str]
    readiness_score: float
    debate_log: List[DebateEntry]
    skill_dag: dict
    sprint_plan: List[SprintTask]
    interview_history: List[InterviewRound]
    current_phase: str
    errors: Annotated[List[str], operator.add]
