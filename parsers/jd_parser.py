"""JD parser — extracts structured requirements from job description text or URL."""

import os
import re
import json
import anthropic
import urllib.request


# ── URL fetching ─────────────────────────────────────────────────────────────

def fetch_jd_from_url(url: str) -> str:
    """Fetch a job description page and strip HTML to plain text.

    Uses only ``urllib`` (no extra dependencies).  Raises ValueError if the
    extracted text is under 100 characters.
    """
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        html = resp.read().decode("utf-8", errors="replace")

    # Strip HTML tags
    text = re.sub(r"<[^>]+>", " ", html)
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()

    if len(text) < 100:
        raise ValueError("Could not extract meaningful text from URL")

    word_count = len(text.split())
    print(f"[JDParser] Fetched {word_count} words from URL")
    return text


# ── LLM-based structured parsing ────────────────────────────────────────────

_JD_SCHEMA = """\
{
  "role_title": string,
  "company_type": string (startup|mid-size|enterprise|unknown),
  "required_skills": [list of strings],
  "preferred_skills": [list of strings],
  "responsibilities": [list of strings],
  "experience_years": string or null,
  "education_requirement": string or null,
  "tech_stack_mentioned": [list of strings],
  "interview_likely_topics": [list of strings],
  "keywords_for_ats": [list of strings]
}"""

_EMPTY_JD = {
    "role_title": "",
    "company_type": "unknown",
    "required_skills": [],
    "preferred_skills": [],
    "responsibilities": [],
    "experience_years": None,
    "education_requirement": None,
    "tech_stack_mentioned": [],
    "interview_likely_topics": [],
    "keywords_for_ats": [],
}


def parse_jd_text(jd_text: str) -> dict:
    """Send JD text to Claude and return a structured dict.

    On JSON parse failure the raw response is printed for debugging and a
    default dict with empty lists is returned.
    """
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    system_prompt = (
        "You are a job description analyst. Extract structured requirements. "
        "Return ONLY valid JSON with exactly these fields:\n"
        f"{_JD_SCHEMA}\n"
        "No markdown. No preamble. Pure JSON only."
    )

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1500,
            system=system_prompt,
            messages=[{"role": "user", "content": f"Parse this job description:\n\n{jd_text}"}],
        )
        raw = message.content[0].text.strip()
        parsed = json.loads(raw)

        # Validate critical list field
        if not isinstance(parsed.get("required_skills"), list):
            parsed["required_skills"] = []

        role = parsed.get("role_title", "?")
        req_count = len(parsed["required_skills"])
        topic_count = len(parsed.get("interview_likely_topics", []))
        print(f"[JDParser] Parsed — role: {role}, {req_count} required skills, {topic_count} interview topics")
        return parsed

    except json.JSONDecodeError as e:
        print(f"[JDParser] JSON parse failure: {e}")
        print(f"[JDParser] Raw response:\n{raw}")
        return dict(_EMPTY_JD)

    except Exception as e:
        print(f"[JDParser] API error: {e}")
        return dict(_EMPTY_JD)


# ── Main entry point ────────────────────────────────────────────────────────

def parse_jd(source: str) -> tuple[str, dict]:
    """Parse a JD from a URL, TXT path, or raw text string.

    Returns ``(raw_text, structured_dict)``.
    """
    source_stripped = source.strip()

    if source_stripped.lower().startswith("http"):
        print("[JDParser] Source type: url")
        raw_text = fetch_jd_from_url(source_stripped)
    elif source_stripped.lower().endswith(".txt"):
        print("[JDParser] Source type: txt")
        with open(source_stripped, "r", encoding="utf-8") as f:
            raw_text = f.read().strip()
        if not raw_text:
            raise ValueError("JD text file is empty")
    else:
        print("[JDParser] Source type: raw_text")
        raw_text = source_stripped

    structured = parse_jd_text(raw_text)
    return raw_text, structured
