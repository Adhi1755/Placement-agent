"""Entry point — loads config, builds the LangGraph pipeline, and prints the career readiness report."""

import os
import sys
import json
import argparse
from pathlib import Path
from dotenv import load_dotenv

# Load .env before any other imports that might use env vars
load_dotenv()

# ── API key guard ────────────────────────────────────────────────────────────
api_key = os.environ.get("GOOGLE_API_KEY", "")
if not api_key or api_key.startswith("your-"):
    print(
        "\n[ERROR] GOOGLE_API_KEY is missing or still set to the placeholder value.\n"
        "Please open placement-agent/.env and replace it with your real Gemini key.\n"
        "Get one (free) at: https://aistudio.google.com/app/apikey\n"
    )
    sys.exit(1)

from core.graph import build_graph  # noqa: E402 — import after env is loaded


def build_cli() -> argparse.Namespace:
    """Build and parse CLI arguments."""
    parser = argparse.ArgumentParser(
        description="Placement Preparation Agent — Career Readiness Pipeline",
    )
    parser.add_argument(
        "--resume",
        default="data/sample_resume.pdf",
        help="Path to PDF, path to TXT, or raw resume text (default: data/sample_resume.pdf)",
    )
    parser.add_argument(
        "--jd",
        default="data/sample_jd.txt",
        help="Path to TXT, URL, or raw JD text (default: data/sample_jd.txt)",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Optional path to save the full JSON result",
    )
    return parser.parse_args()


def main():
    args = build_cli()

    graph = build_graph()

    initial_state = {
        "resume_text": args.resume,        # could be path OR raw text
        "job_description": args.jd,        # could be path, URL, or raw text
        "resume_source": args.resume,
        "jd_source": args.jd,
        "skill_rubric": {},
        "resume_structured": {},           # empty triggers parser_agent first
        "jd_structured": {},
        "analysis": {},
        "gap_list": [],
        "readiness_score": 0.0,
        "debate_log": [],
        "skill_dag": {},
        "sprint_plan": [],
        "interview_history": [],
        "current_phase": "start",
        "errors": [],
    }

    final_state = graph.invoke(initial_state)

    # ── Print report ─────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("          CAREER READINESS REPORT")
    print("=" * 60)

    # ── Candidate info from resume_structured ────────────────────────────────
    resume_s = final_state.get("resume_structured", {})
    jd_s = final_state.get("jd_structured", {})

    candidate_name = resume_s.get("name", "Unknown")
    role_title = jd_s.get("role_title", "Unknown Role")
    print(f"\nCandidate : {candidate_name}")
    print(f"Role      : {role_title}")

    # ── Readiness score ──────────────────────────────────────────────────────
    score = final_state.get("readiness_score", 0.0)
    print(f"\nReadiness Score: {score * 100:.0f}%")

    # ── Gap list ─────────────────────────────────────────────────────────────
    gap_list = final_state.get("gap_list", [])
    print(f"\nGap List ({len(gap_list)} items):")
    if gap_list:
        for i, gap in enumerate(gap_list, 1):
            print(f"  {i}. {gap}")
    else:
        print("  (none identified)")

    # ── Matched / strength / weakness from resume_analyst ────────────────────
    analysis = final_state.get("analysis", {})
    matched = analysis.get("matched_skills", [])
    print(f"\nMatched Skills:\n  {', '.join(matched) if matched else '(none)'}")

    strength = analysis.get("strength_summary", "")
    weakness = analysis.get("weakness_summary", "")
    if strength:
        print(f"\nStrength: {strength}")
    if weakness:
        print(f"Weakness: {weakness}")

    # ── Debate log (recruiter vs advocate) ───────────────────────────────────
    debate = final_state.get("debate_log", [])
    if debate:
        print(f"\nDebate ({len(debate)} entries):")
        for d in debate:
            print(f"  [{d.get('agent')}] ({d.get('target')}) {d.get('argument')}")

    # ── Sprint plan from skill_graph ─────────────────────────────────────────
    sprint = final_state.get("sprint_plan", [])
    if sprint:
        print(f"\nLearning Sprint Plan ({len(sprint)} tasks):")
        for t in sprint:
            print(f"  Week {t.get('week')}: {t.get('skill')} "
                  f"(~{t.get('estimated_hours')}h) — {t.get('resource')}")

    # ── Interview topics from JD ─────────────────────────────────────────────
    topics = jd_s.get("interview_likely_topics", [])
    if topics:
        print(f"\nInterview Likely Topics ({len(topics)}):")
        for t in topics:
            print(f"  • {t}")

    # ── ATS keyword analysis ─────────────────────────────────────────────────
    ats_keywords = jd_s.get("keywords_for_ats", [])
    # Substring match against all resume skill text (handles multi-word keywords).
    haystack = " ".join(
        resume_s.get("technical_skills", [])
        + resume_s.get("soft_skills", [])
        + [t for p in resume_s.get("projects", []) for t in p.get("tech_stack", [])]
    ).lower()
    if ats_keywords:
        matched_ats = [kw for kw in ats_keywords if kw.lower() in haystack]
        missing_ats = [kw for kw in ats_keywords if kw.lower() not in haystack]
        print(f"\nATS Keywords — Matched: {len(matched_ats)}, Missing: {len(missing_ats)}")
        if matched_ats:
            print(f"  ✅ Matched : {', '.join(matched_ats)}")
        if missing_ats:
            print(f"  ❌ Missing : {', '.join(missing_ats)}")

    # ── Errors ───────────────────────────────────────────────────────────────
    errors = final_state.get("errors", [])
    if errors:
        print("\n[Errors encountered]")
        for err in errors:
            print(f"  - {err}")

    print("\n" + "=" * 60 + "\n")

    # ── Save JSON output if requested ────────────────────────────────────────
    if args.output:
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)

        # Convert to JSON-serialisable form (filter out non-serialisable types)
        serialisable = {}
        for k, v in final_state.items():
            try:
                json.dumps(v)
                serialisable[k] = v
            except (TypeError, ValueError):
                serialisable[k] = str(v)

        out_path.write_text(json.dumps(serialisable, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"[main] Full result saved to {out_path}")


if __name__ == "__main__":
    main()
