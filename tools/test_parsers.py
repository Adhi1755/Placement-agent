"""Standalone parser test script — validates resume and JD parsers without LangGraph."""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure we can import from project root
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

load_dotenv(project_root / ".env")

from parsers.resume_parser import parse_resume  # noqa: E402
from parsers.jd_parser import parse_jd          # noqa: E402


def test_resume_pdf():
    """Test 1: Parse the sample PDF resume."""
    pdf_path = str(project_root / "data" / "sample_resume.pdf")
    print("\n" + "=" * 50)
    print("TEST 1: Resume PDF Parsing")
    print("=" * 50)

    if not os.path.exists(pdf_path):
        print(f"FAIL — PDF not found at {pdf_path}")
        return False

    try:
        raw_text, structured = parse_resume(pdf_path)

        print(f"\n  Name          : {structured.get('name')}")
        print(f"  Email         : {structured.get('email')}")
        print(f"  GitHub        : {structured.get('github')}")
        print(f"  Portfolio     : {structured.get('portfolio')}")
        print(f"  CGPA          : {structured.get('cgpa')}")
        print(f"  University    : {structured.get('university')}")
        print(f"  Degree        : {structured.get('degree')}")
        print(f"  Grad Year     : {structured.get('graduation_year')}")
        print(f"  Tech Skills   : {structured.get('technical_skills')}")
        print(f"  Soft Skills   : {structured.get('soft_skills')}")
        print(f"  Projects      : {[p.get('name') for p in structured.get('projects', [])]}")
        print(f"  Experience    : {structured.get('experience')}")
        print(f"  Certifications: {structured.get('certifications')}")
        print(f"  Achievements  : {structured.get('achievements')}")

        skills = structured.get("technical_skills", [])
        projects = structured.get("projects", [])

        assert len(skills) >= 5, f"Expected ≥5 skills, got {len(skills)}"
        assert len(projects) >= 3, f"Expected ≥3 projects, got {len(projects)}"

        print(f"\n  ✅ PASS — {len(skills)} skills, {len(projects)} projects")
        return True

    except AssertionError as e:
        print(f"\n  ❌ FAIL — Assertion: {e}")
        return False
    except Exception as e:
        print(f"\n  ❌ FAIL — Exception: {e}")
        return False


def test_resume_txt():
    """Test 2: Parse the sample TXT resume."""
    txt_path = str(project_root / "data" / "sample_resume.txt")
    print("\n" + "=" * 50)
    print("TEST 2: Resume TXT Parsing")
    print("=" * 50)

    if not os.path.exists(txt_path):
        print(f"FAIL — TXT not found at {txt_path}")
        return False

    try:
        raw_text, structured = parse_resume(txt_path)

        name = structured.get("name", "?")
        skills_count = len(structured.get("technical_skills", []))
        print(f"\n  Name        : {name}")
        print(f"  Skills count: {skills_count}")

        assert skills_count >= 1, f"Expected ≥1 skills, got {skills_count}"
        print(f"\n  ✅ PASS — name: {name}, {skills_count} skills")
        return True

    except Exception as e:
        print(f"\n  ❌ FAIL — {e}")
        return False


def test_jd_txt():
    """Test 3: Parse the sample JD text file."""
    jd_path = str(project_root / "data" / "sample_jd.txt")
    print("\n" + "=" * 50)
    print("TEST 3: JD TXT Parsing")
    print("=" * 50)

    if not os.path.exists(jd_path):
        print(f"FAIL — JD not found at {jd_path}")
        return False

    try:
        raw_text, structured = parse_jd(jd_path)

        role = structured.get("role_title", "?")
        topics = structured.get("interview_likely_topics", [])
        req_skills = structured.get("required_skills", [])
        ats = structured.get("keywords_for_ats", [])

        print(f"\n  Role Title        : {role}")
        print(f"  Required Skills   : {req_skills}")
        print(f"  Interview Topics  : {topics}")
        print(f"  ATS Keywords      : {ats}")

        assert len(req_skills) >= 1, f"Expected ≥1 required skills, got {len(req_skills)}"
        print(f"\n  ✅ PASS — role: {role}, {len(req_skills)} required skills, {len(topics)} topics")
        return True

    except Exception as e:
        print(f"\n  ❌ FAIL — {e}")
        return False


if __name__ == "__main__":
    results = []
    results.append(("Resume PDF", test_resume_pdf()))
    results.append(("Resume TXT", test_resume_txt()))
    results.append(("JD TXT", test_jd_txt()))

    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)
    all_pass = True
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status} — {name}")
        if not passed:
            all_pass = False

    print()
    sys.exit(0 if all_pass else 1)
