"""Resume parser — uses the Anthropic API to extract structured fields from plain-text resumes."""

import os
import json
import anthropic


def parse_resume(resume_text: str) -> dict:
    """
    Extract structured resume fields from plain text using Claude.

    Returns a dict with keys: name, skills, experience, projects, education, certifications.
    On any parsing failure, returns a dict with empty lists for each field.
    """
    print("[ResumeParser] Extracting structured data from resume text...")

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    system_prompt = (
        "You are a resume parsing assistant. "
        "Extract structured information from the resume text provided. "
        "Return ONLY valid JSON with these exact keys: "
        "name (string), skills (array of strings), experience (array of objects with keys: title, company, duration, description), "
        "projects (array of objects with keys: name, description, technologies), "
        "education (array of objects with keys: degree, institution, year, gpa), "
        "certifications (array of strings). "
        "No markdown. No preamble. Pure JSON only."
    )

    empty_result = {
        "name": "",
        "skills": [],
        "experience": [],
        "projects": [],
        "education": [],
        "certifications": [],
    }

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": f"Parse this resume:\n\n{resume_text}",
                }
            ],
        )
        raw = message.content[0].text.strip()
        parsed = json.loads(raw)
        print("[ResumeParser] Successfully parsed resume.")
        return parsed
    except json.JSONDecodeError as e:
        print(f"[ResumeParser] ERROR — JSON decode failed: {e}")
        empty_result["_error"] = f"JSON decode error: {e}"
        return empty_result
    except Exception as e:
        print(f"[ResumeParser] ERROR — API call failed: {e}")
        empty_result["_error"] = str(e)
        return empty_result
