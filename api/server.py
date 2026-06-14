"""FastAPI server exposing the placement pipeline to the Next.js frontend.

Run with:  uvicorn api.server:app --reload --port 8000
"""

import os
import json
import tempfile
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()  # load GOOGLE_API_KEY before importing the agents

from fastapi import FastAPI, UploadFile, File, Form, HTTPException  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.responses import StreamingResponse  # noqa: E402
from pydantic import BaseModel  # noqa: E402

from core.graph import build_graph  # noqa: E402
from parsers.jd_parser import parse_jd  # noqa: E402
from agents.interviewer import generate_questions, score_answer, ROUNDS  # noqa: E402

app = FastAPI(title="Placement Agent API", version="1.0.0")

# Allow the Next.js dev server (and any localhost port) to call us.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Compile the LangGraph pipeline once at startup.
_graph = build_graph()


def _initial_state(resume_source: str, jd_source: str) -> dict:
    return {
        "resume_text": resume_source,
        "job_description": jd_source,
        "resume_source": resume_source,
        "jd_source": jd_source,
        "skill_rubric": {},
        "resume_structured": {},
        "jd_structured": {},
        "analysis": {},
        "dimensions": {},
        "gap_list": [],
        "readiness_score": 0.0,
        "debate_log": [],
        "verdict": {},
        "resume_rewrite": {},
        "skill_dag": {},
        "sprint_plan": [],
        "interview_history": [],
        "current_phase": "start",
        "errors": [],
    }


def _build_report(state: dict) -> dict:
    """Shape the final graph state into a clean JSON payload for the frontend."""
    resume_s = state.get("resume_structured", {})
    jd_s = state.get("jd_structured", {})
    analysis = state.get("analysis", {})

    ats_keywords = jd_s.get("keywords_for_ats", [])
    # Build one lowercase haystack from every skill-ish field on the resume so a
    # multi-word ATS phrase ("REST API", "Machine Learning") can match by substring.
    haystack = " ".join(
        [
            *resume_s.get("technical_skills", []),
            *resume_s.get("soft_skills", []),
            *[
                tech
                for proj in resume_s.get("projects", [])
                for tech in proj.get("tech_stack", [])
            ],
        ]
    ).lower()
    ats = {
        "matched": [kw for kw in ats_keywords if kw.lower() in haystack],
        "missing": [kw for kw in ats_keywords if kw.lower() not in haystack],
    }

    return {
        "candidate": {
            "name": resume_s.get("name", "Unknown"),
            "email": resume_s.get("email"),
            "github": resume_s.get("github"),
            "technical_skills": resume_s.get("technical_skills", []),
            "projects": resume_s.get("projects", []),
        },
        "role": {
            "title": jd_s.get("role_title", "Unknown Role"),
            "company_type": jd_s.get("company_type"),
            "required_skills": jd_s.get("required_skills", []),
            "interview_topics": jd_s.get("interview_likely_topics", []),
        },
        "readiness_score": state.get("readiness_score", 0.0),
        "dimensions": state.get("dimensions", {}),
        "gap_list": state.get("gap_list", []),
        "analysis": analysis,
        "ats": ats,
        "debate_log": state.get("debate_log", []),
        "verdict": state.get("verdict", {}),
        "resume_rewrite": state.get("resume_rewrite", {}),
        "skill_dag": state.get("skill_dag", {}),
        "sprint_plan": state.get("sprint_plan", []),
        "jd_structured": jd_s,
        "resume_structured": resume_s,
        "resume_text": state.get("resume_text", ""),
        "errors": state.get("errors", []),
    }


# ── SSE streaming ──────────────────────────────────────────────────────────────

# Human-friendly progress, keyed on the phase the last-run node set. The frontend
# uses `stage` to drive its engine-room animation and `pct` for the ring.
_PHASE_PROGRESS = {
    "start":            ("parsing",     "Parsing your resume…",                 8),
    "parsing_done":     ("extracting",  "Extracting skills and experience…",    20),
    "analysis_done":    ("scoring",     "Scoring your readiness…",              42),
    "recruiter_done":   ("recruiter",   "The recruiter is reviewing you…",      58),
    "advocate_done":    ("advocate",    "Your advocate is responding…",         70),
    "skill_graph_done": ("planning",    "Building your learning plan…",         82),
    "judge_done":       ("verdict",     "The committee is deliberating…",       92),
    "rewrite_done":     ("finalizing",  "Preparing your results…",              98),
}


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


def _stream_pipeline(initial_state: dict):
    """Run the graph with stream_mode='values' and yield SSE progress + final report.

    Each streamed value is a full state snapshot; we emit one progress event per
    distinct phase, then a final `done` event carrying the report.
    """
    last_phase = None
    final_state = initial_state
    try:
        for snapshot in _graph.stream(initial_state, stream_mode="values"):
            final_state = snapshot
            phase = snapshot.get("current_phase", "start")
            if phase != last_phase and phase in _PHASE_PROGRESS:
                last_phase = phase
                stage, label, pct = _PHASE_PROGRESS[phase]
                yield _sse({"type": "progress", "phase": phase, "stage": stage,
                            "label": label, "pct": pct})
        yield _sse({"type": "done", "report": _build_report(final_state)})
    except Exception as e:  # noqa: BLE001
        yield _sse({"type": "error", "message": str(e)})


_SSE_HEADERS = {"Cache-Control": "no-cache", "X-Accel-Buffering": "no",
                "Connection": "keep-alive"}


# ── Analyze ───────────────────────────────────────────────────────────────────

class AnalyzeTextRequest(BaseModel):
    resume_text: str
    jd_text: str


@app.get("/api/health")
def health():
    key = os.environ.get("GOOGLE_API_KEY", "")
    return {"status": "ok", "has_key": bool(key) and not key.startswith("your-")}


@app.post("/api/analyze")
def analyze_text(req: AnalyzeTextRequest):
    """Run the full pipeline on raw resume + JD text."""
    if not req.resume_text.strip() or not req.jd_text.strip():
        raise HTTPException(status_code=400, detail="resume_text and jd_text are required")
    state = _graph.invoke(_initial_state(req.resume_text, req.jd_text))
    return _build_report(state)


@app.post("/api/analyze/upload")
async def analyze_upload(
    resume: UploadFile = File(...),
    jd_text: str = Form(...),
):
    """Run the full pipeline on an uploaded resume file (PDF/TXT) + JD text."""
    suffix = Path(resume.filename or "resume.pdf").suffix or ".pdf"
    contents = await resume.read()
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        state = _graph.invoke(_initial_state(tmp_path, jd_text))
        return _build_report(state)
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


@app.post("/api/analyze/stream")
def analyze_stream(req: AnalyzeTextRequest):
    """Run the pipeline and stream SSE progress events, ending with the report."""
    if not req.resume_text.strip() or not req.jd_text.strip():
        raise HTTPException(status_code=400, detail="resume_text and jd_text are required")
    gen = _stream_pipeline(_initial_state(req.resume_text, req.jd_text))
    return StreamingResponse(gen, media_type="text/event-stream", headers=_SSE_HEADERS)


@app.post("/api/analyze/stream/upload")
async def analyze_stream_upload(
    resume: UploadFile = File(...),
    jd_text: str = Form(...),
):
    """Streaming variant that accepts an uploaded resume file (PDF/TXT)."""
    suffix = Path(resume.filename or "resume.pdf").suffix or ".pdf"
    contents = await resume.read()
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    def gen():
        try:
            yield from _stream_pipeline(_initial_state(tmp_path, jd_text))
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

    return StreamingResponse(gen(), media_type="text/event-stream", headers=_SSE_HEADERS)


# ── Interview ──────────────────────────────────────────────────────────────────

class InterviewStartRequest(BaseModel):
    jd_structured: dict
    resume_structured: dict
    round_type: str = "technical"
    num_questions: int = 3


class ScoreAnswerRequest(BaseModel):
    question: str
    answer: str
    round_type: str = "technical"


@app.get("/api/interview/rounds")
def interview_rounds():
    return {"rounds": ROUNDS}


@app.post("/api/interview/start")
def interview_start(req: InterviewStartRequest):
    if req.round_type not in ROUNDS:
        raise HTTPException(status_code=400, detail=f"round_type must be one of {ROUNDS}")
    questions = generate_questions(
        req.jd_structured, req.resume_structured, req.round_type, n=req.num_questions
    )
    return {"round_type": req.round_type, "questions": questions}


@app.post("/api/interview/score")
def interview_score(req: ScoreAnswerRequest):
    return score_answer(req.question, req.answer, req.round_type)
