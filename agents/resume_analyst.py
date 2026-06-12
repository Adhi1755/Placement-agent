"""ResumeAnalyst agent — compares candidate resume against JD and produces a readiness score."""

import os
import json
import anthropic

from core.state import PlacementState


def resume_analyst(state: PlacementState) -> dict:
    """
    Calls Claude to compare the resume against the JD and returns gap_list,
    readiness_score, matched_skills, strength_summary, and weakness_summary.
    """
    print("[ResumeAnalyst] Calling Claude API...")

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    system_prompt = (
        "You are a senior technical recruiter. Compare the candidate resume against the job description. "
        "Return ONLY valid JSON with these fields:\n"
        "- gap_list: array of strings, each a specific missing skill or experience\n"
        "- readiness_score: float between 0.0 and 1.0\n"
        "- matched_skills: array of strings present in both resume and JD\n"
        "- strength_summary: one sentence about the candidate's strongest area\n"
        "- weakness_summary: one sentence about the biggest gap\n"
        "No markdown. No preamble. Pure JSON only."
    )

    user_message = (
        f"RESUME:\n{state['resume_text']}\n\n"
        f"JOB DESCRIPTION:\n{state['job_description']}"
    )

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )
        raw = message.content[0].text.strip()
        parsed = json.loads(raw)

        gap_list = parsed.get("gap_list", [])
        readiness_score = float(parsed.get("readiness_score", 0.0))

        print(
            f"[ResumeAnalyst] Done. Score: {readiness_score:.2f} | Gaps found: {len(gap_list)}"
        )

        return {
            "gap_list": gap_list,
            "readiness_score": readiness_score,
            "resume_structured": parsed,
            "current_phase": "analysis_done",
        }

    except json.JSONDecodeError as e:
        error_msg = f"resume_analyst: JSON decode error — {e}"
        print(f"[ResumeAnalyst] ERROR — {error_msg}")
        return {"errors": [error_msg], "current_phase": "analysis_failed"}
    except Exception as e:
        error_msg = f"resume_analyst: {e}"
        print(f"[ResumeAnalyst] ERROR — {error_msg}")
        return {"errors": [error_msg], "current_phase": "analysis_failed"}
