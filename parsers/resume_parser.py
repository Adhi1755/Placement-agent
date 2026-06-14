"""Resume parser — extracts structured data from PDF or plain text resumes."""

import re

from core.llm import call_json

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None


# ── PDF extraction ───────────────────────────────────────────────────────────

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from every page of a PDF using PyMuPDF.

    Pages are separated by a page-break marker.  Raises ValueError if the
    PDF is empty or the extracted text is too short to be useful.
    """
    if fitz is None:
        raise ImportError("PyMuPDF (fitz) is required for PDF parsing. Install with: pip install pymupdf")

    doc = fitz.open(pdf_path)
    page_count = doc.page_count

    if page_count == 0:
        doc.close()
        raise ValueError("PDF appears to be empty or unreadable")

    pages_text = []
    for page in doc:
        pages_text.append(page.get_text("text"))
    doc.close()

    raw = "\n\n--- PAGE BREAK ---\n\n".join(pages_text)

    # Collapse excessive whitespace (more than 2 consecutive newlines → 2)
    raw = re.sub(r"\n{3,}", "\n\n", raw)

    if len(raw.strip()) < 50:
        raise ValueError("PDF appears to be empty or unreadable")

    word_count = len(raw.split())
    print(f"[ResumeParser] Extracted {word_count} words from {page_count} page(s)")
    return raw.strip()


# ── TXT extraction ───────────────────────────────────────────────────────────

def extract_text_from_txt(txt_path: str) -> str:
    """Read a plain-text resume file. Raises ValueError if empty."""
    with open(txt_path, "r", encoding="utf-8") as f:
        content = f.read().strip()

    if not content:
        raise ValueError("Resume text file is empty")

    return content


# ── LLM-based structured parsing ────────────────────────────────────────────

_RESUME_SCHEMA = """\
{
  "name": string,
  "email": string or null,
  "phone": string or null,
  "github": string or null,
  "portfolio": string or null,
  "cgpa": string or null,
  "university": string or null,
  "degree": string or null,
  "graduation_year": string or null,
  "technical_skills": [list of strings],
  "soft_skills": [list of strings],
  "projects": [
    {
      "name": string,
      "tech_stack": [list of strings],
      "description": string,
      "achievement": string or null
    }
  ],
  "experience": [
    {
      "company": string,
      "role": string,
      "duration": string,
      "highlights": [list of strings]
    }
  ],
  "certifications": [list of strings],
  "achievements": [list of strings],
  "languages_known": [list of strings]
}"""

_EMPTY_RESULT = {
    "name": None,
    "email": None,
    "phone": None,
    "github": None,
    "portfolio": None,
    "cgpa": None,
    "university": None,
    "degree": None,
    "graduation_year": None,
    "technical_skills": [],
    "soft_skills": [],
    "projects": [],
    "experience": [],
    "certifications": [],
    "achievements": [],
    "languages_known": [],
}


def parse_resume_text(resume_text: str) -> dict:
    """Send resume text to Gemini and return a structured dict.

    On any failure a default dict with empty lists / null strings is returned.
    """
    system_prompt = (
        "You are a resume parser. Extract structured information from the resume text. "
        "Return ONLY valid JSON with exactly these fields:\n"
        f"{_RESUME_SCHEMA}\n"
        "No markdown fences. No preamble. Pure JSON only."
    )

    parsed = call_json(
        system_prompt,
        f"Parse this resume:\n\n{resume_text}",
        max_tokens=2000,
        default=None,
    )

    if not isinstance(parsed, dict):
        print("[ResumeParser] Parsing failed — returning empty result")
        return dict(_EMPTY_RESULT)

    # Validate critical list fields
    if not isinstance(parsed.get("technical_skills"), list):
        parsed["technical_skills"] = []
    if not isinstance(parsed.get("projects"), list):
        parsed["projects"] = []

    skills_count = len(parsed["technical_skills"])
    projects_count = len(parsed["projects"])
    print(f"[ResumeParser] Parsed successfully — {skills_count} skills, {projects_count} projects found")
    return parsed


# ── Main entry point ────────────────────────────────────────────────────────

def parse_resume(source: str) -> tuple[str, dict]:
    """Parse a resume from a PDF path, TXT path, or raw text string.

    Returns ``(raw_text, structured_dict)``.
    """
    source_stripped = source.strip()

    if source_stripped.lower().endswith(".pdf"):
        print("[ResumeParser] Source type detected: pdf")
        raw_text = extract_text_from_pdf(source_stripped)
    elif source_stripped.lower().endswith(".txt"):
        print("[ResumeParser] Source type detected: txt")
        raw_text = extract_text_from_txt(source_stripped)
    elif len(source_stripped) > 200 and "." not in source_stripped.split()[-1]:
        # Long text without a file extension → treat as raw resume text
        print("[ResumeParser] Source type detected: raw_text")
        raw_text = source_stripped
    else:
        # Fallback: try treating as raw text
        print("[ResumeParser] Source type detected: raw_text")
        raw_text = source_stripped

    structured = parse_resume_text(raw_text)
    return raw_text, structured
