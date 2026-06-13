"""Parser agent — runs resume and JD parsers, populates state before analysis."""

from core.state import PlacementState
from parsers.resume_parser import parse_resume
from parsers.jd_parser import parse_jd


def parser_agent_node(state: PlacementState) -> dict:
    """Parse both the resume and job description sources into structured data.

    This node should run as the first step in the pipeline.  It accepts file
    paths, URLs, or raw text in *resume_text* and *job_description* and
    replaces them with the extracted plain text while populating the
    ``resume_structured`` and ``jd_structured`` dicts.
    """
    print("[ParserAgent] Starting parsing phase...")

    result: dict = {}
    errors: list[str] = []
    resume_name = "?"
    role_title = "?"

    # ── Resume parsing ───────────────────────────────────────────────────
    try:
        raw_resume, resume_dict = parse_resume(state["resume_text"])
        result["resume_text"] = raw_resume
        result["resume_structured"] = resume_dict
        resume_name = resume_dict.get("name", "?")
    except Exception as e:
        errors.append(f"parser_agent (resume): {e}")
        print(f"[ParserAgent] Resume parsing error: {e}")
        result["resume_structured"] = {}

    # ── JD parsing ───────────────────────────────────────────────────────
    try:
        raw_jd, jd_dict = parse_jd(state["job_description"])
        result["job_description"] = raw_jd
        result["jd_structured"] = jd_dict
        role_title = jd_dict.get("role_title", "?")
    except Exception as e:
        errors.append(f"parser_agent (jd): {e}")
        print(f"[ParserAgent] JD parsing error: {e}")
        result["jd_structured"] = {}

    # ── Finalise ─────────────────────────────────────────────────────────
    if errors:
        result["errors"] = errors
        result["current_phase"] = "parsing_failed"
    else:
        result["current_phase"] = "parsing_done"

    print(f"[ParserAgent] Parsing complete — resume: {resume_name}, JD: {role_title}")
    return result
