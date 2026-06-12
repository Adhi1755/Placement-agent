"""Entry point — loads config, builds the LangGraph pipeline, and prints the career readiness report."""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load .env before any other imports that might use env vars
load_dotenv()

# ── API key guard ────────────────────────────────────────────────────────────
api_key = os.environ.get("ANTHROPIC_API_KEY", "")
if not api_key or api_key == "your-key-here":
    print(
        "\n[ERROR] ANTHROPIC_API_KEY is missing or still set to the placeholder value.\n"
        "Please open placement-agent/.env and replace 'your-key-here' with your real key.\n"
        "Get one at: https://console.anthropic.com/\n"
    )
    sys.exit(1)

from core.graph import build_graph  # noqa: E402 — import after env is loaded


def read_file(path: Path) -> str:
    """Read and return the contents of a file, exiting on failure."""
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError:
        print(f"[ERROR] Could not find required file: {path}")
        sys.exit(1)


def main():
    base = Path(__file__).parent

    resume_text = read_file(base / "data" / "sample_resume.txt")
    jd_text = read_file(base / "data" / "sample_jd.txt")

    graph = build_graph()

    initial_state = {
        "resume_text": resume_text,
        "job_description": jd_text,
        "skill_rubric": {},
        "resume_structured": {},
        "jd_structured": {},
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
    print("\n" + "=" * 40)
    print("=== Career Readiness Report ===")
    print("=" * 40)

    score = final_state.get("readiness_score", 0.0)
    print(f"Readiness Score: {score * 100:.0f}%\n")

    gap_list = final_state.get("gap_list", [])
    print("Gap List:")
    if gap_list:
        for i, gap in enumerate(gap_list, 1):
            print(f"  {i}. {gap}")
    else:
        print("  (none identified)")

    structured = final_state.get("resume_structured", {})
    matched = structured.get("matched_skills", [])
    print(f"\nMatched Skills:\n  {', '.join(matched) if matched else '(none)'}")

    strength = structured.get("strength_summary", "")
    weakness = structured.get("weakness_summary", "")
    if strength:
        print(f"\nStrength: {strength}")
    if weakness:
        print(f"Weakness: {weakness}")

    errors = final_state.get("errors", [])
    if errors:
        print("\n[Errors encountered]")
        for err in errors:
            print(f"  - {err}")

    print("=" * 40 + "\n")


if __name__ == "__main__":
    main()
