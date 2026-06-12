"""Job description parser — uses the Anthropic API to extract structured fields from JD text."""

import os
import json
import anthropic


def parse_jd(jd_text: str) -> dict:
    """
    Extract structured JD fields from plain text using Claude.

    Returns a dict with keys: role_title, required_skills, preferred_skills,
    responsibilities, experience_years.
    On any parsing failure, returns a dict with empty values for each field.
    """
    print("[JDParser] Extracting structured data from job description...")

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    system_prompt = (
        "You are a job description parsing assistant. "
        "Extract structured information from the job description provided. "
        "Return ONLY valid JSON with these exact keys: "
        "role_title (string), required_skills (array of strings), "
        "preferred_skills (array of strings), "
        "responsibilities (array of strings), "
        "experience_years (number — use 0 if not specified). "
        "No markdown. No preamble. Pure JSON only."
    )

    empty_result = {
        "role_title": "",
        "required_skills": [],
        "preferred_skills": [],
        "responsibilities": [],
        "experience_years": 0,
    }

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": f"Parse this job description:\n\n{jd_text}",
                }
            ],
        )
        raw = message.content[0].text.strip()
        parsed = json.loads(raw)
        print("[JDParser] Successfully parsed job description.")
        return parsed
    except json.JSONDecodeError as e:
        print(f"[JDParser] ERROR — JSON decode failed: {e}")
        empty_result["_error"] = f"JSON decode error: {e}"
        return empty_result
    except Exception as e:
        print(f"[JDParser] ERROR — API call failed: {e}")
        empty_result["_error"] = str(e)
        return empty_result
