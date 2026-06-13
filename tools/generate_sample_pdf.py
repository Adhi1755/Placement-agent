"""Generate a realistic one-page resume PDF for testing the resume parser."""

import fitz  # PyMuPDF
import os


def generate_sample_resume_pdf(output_path: str = "data/sample_resume.pdf"):
    """Create a professional one-page resume PDF using PyMuPDF."""

    doc = fitz.open()
    page = doc.new_page(width=595, height=842)  # A4

    # ── Colour palette ───────────────────────────────────────────────────────
    navy = fitz.utils.getColor("navy")
    black = fitz.utils.getColor("black")
    dark_gray = (0.25, 0.25, 0.25)
    accent = (0.13, 0.35, 0.65)  # steel blue

    # ── Fonts ────────────────────────────────────────────────────────────────
    font_bold = "helv"   # Helvetica Bold (built-in)
    font_norm = "helv"   # Helvetica

    # ── Helper to draw a section heading with a horizontal rule ──────────────
    def section_heading(y: float, title: str) -> float:
        page.insert_text(
            fitz.Point(40, y), title.upper(),
            fontsize=10, fontname=font_bold, color=accent,
        )
        y += 4
        page.draw_line(fitz.Point(40, y), fitz.Point(555, y), color=accent, width=0.8)
        return y + 14

    # ── Helper to insert a wrapped text block ────────────────────────────────
    def text_block(y: float, text: str, fontsize: float = 9,
                   indent: float = 40, color=dark_gray, bold: bool = False) -> float:
        rect = fitz.Rect(indent, y, 555, y + 200)
        rc = page.insert_textbox(
            rect, text, fontsize=fontsize,
            fontname=font_bold if bold else font_norm,
            color=color, align=fitz.TEXT_ALIGN_LEFT,
        )
        # estimate lines used  (negative rc means overflow — ignore)
        lines_used = text.count("\n") + 1
        return y + lines_used * (fontsize + 3)

    y = 42

    # ══════════════════════════  HEADER  ══════════════════════════════════════
    page.insert_text(fitz.Point(40, y), "ADITHYA N", fontsize=20, fontname=font_bold, color=navy)
    y += 18
    page.insert_text(
        fitz.Point(40, y),
        "github.com/Adhi1755  |  adithyanagamuneendran.dev  |  Bangalore, India",
        fontsize=8.5, fontname=font_norm, color=dark_gray,
    )
    y += 20

    # ══════════════════════════  EDUCATION  ═══════════════════════════════════
    y = section_heading(y, "Education")
    page.insert_text(
        fitz.Point(40, y),
        "B.Tech in Computer Science & Engineering (Data Science Specialisation)",
        fontsize=9.5, fontname=font_bold, color=black,
    )
    y += 13
    page.insert_text(
        fitz.Point(40, y),
        "Dayananda Sagar University, Bangalore  |  CGPA: 8.74 / 10.0  |  Expected Graduation: May 2026",
        fontsize=8.5, fontname=font_norm, color=dark_gray,
    )
    y += 18

    # ══════════════════════════  TECHNICAL SKILLS  ════════════════════════════
    y = section_heading(y, "Technical Skills")
    skills = [
        ("Languages", "Python (Advanced), JavaScript (Intermediate), SQL"),
        ("ML / AI", "PyTorch, LangChain, Google Generative AI, NetworkX"),
        ("Web / APIs", "FastAPI, Next.js, React, REST APIs, WebSockets"),
        ("Databases", "ChromaDB, PostgreSQL, MongoDB"),
        ("DevOps", "Docker, Git, GitHub Actions"),
    ]
    for label, value in skills:
        page.insert_text(fitz.Point(40, y), f"{label}:", fontsize=8.5, fontname=font_bold, color=black)
        page.insert_text(fitz.Point(115, y), value, fontsize=8.5, fontname=font_norm, color=dark_gray)
        y += 12
    y += 4

    # ══════════════════════════  PROJECTS  ════════════════════════════════════
    y = section_heading(y, "Projects")

    projects = [
        {
            "title": "EmbedMindAI — Full-stack RAG Platform",
            "stack": "FastAPI, ChromaDB, LLaMA 3, WebSockets, Docker",
            "bullets": [
                "Built an end-to-end Retrieval-Augmented Generation platform supporting multi-format document ingestion, real-time streaming via WebSockets, and citation-aware answers.",
                "Integrated LLaMA 3 for generation with ChromaDB vector store; containerised with Docker Compose.",
            ],
        },
        {
            "title": "SkillSpark — AI Career Assessment Platform",
            "stack": "Next.js 15, React 19, GSAP, Recharts, Gemini API",
            "bullets": [
                "3rd place at Hackverse 2025.  Built an AI-powered career assessment tool with cinematic UI animations (GSAP) and interactive analytics dashboards (Recharts).",
            ],
        },
        {
            "title": "PharmaDemandSensing — Demand Forecasting System",
            "stack": "XGBoost, LSTM, Flask, Pandas, NumPy",
            "bullets": [
                "Trained XGBoost + LSTM ensemble on 18 months of pharmaceutical sales data; served predictions via Flask REST API with <80ms p95 latency.",
            ],
        },
        {
            "title": "GalaxyGeeks — Interactive Space Education Platform",
            "stack": "Three.js, Zustand, Next.js, NASA Open APIs",
            "bullets": [
                "NASA Space Apps Challenge 2024 global nominee.  Built a 3D interactive solar-system explorer using Three.js and Zustand state management.",
            ],
        },
    ]

    for proj in projects:
        page.insert_text(fitz.Point(40, y), proj["title"], fontsize=9, fontname=font_bold, color=black)
        y += 11
        page.insert_text(fitz.Point(48, y), proj["stack"], fontsize=7.5, fontname=font_norm, color=accent)
        y += 11
        for bullet in proj["bullets"]:
            rect = fitz.Rect(56, y - 2, 555, y + 40)
            page.insert_textbox(rect, f"• {bullet}", fontsize=7.8, fontname=font_norm, color=dark_gray)
            # estimate height
            estimated_lines = max(1, len(bullet) // 85 + 1)
            y += estimated_lines * 10 + 2
        y += 4

    # ══════════════════════════  ACHIEVEMENTS  ═══════════════════════════════
    y = section_heading(y, "Achievements")
    achievements = [
        "NASA Space Apps Challenge 2024 — Global Nominee",
        "Hackverse 2025 — 3rd Place (350+ participants)",
    ]
    for ach in achievements:
        page.insert_text(fitz.Point(48, y), f"• {ach}", fontsize=8.5, fontname=font_norm, color=dark_gray)
        y += 12

    # ══════════════════════════  LINKS  ═══════════════════════════════════════
    y += 4
    y = section_heading(y, "Links")
    page.insert_text(fitz.Point(48, y), "GitHub: github.com/Adhi1755", fontsize=8.5, fontname=font_norm, color=dark_gray)
    y += 12
    page.insert_text(fitz.Point(48, y), "Portfolio: adithyanagamuneendran.dev", fontsize=8.5, fontname=font_norm, color=dark_gray)

    # ── Save ─────────────────────────────────────────────────────────────────
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    doc.save(output_path)
    doc.close()
    print(f"[GeneratePDF] Saved resume PDF to {output_path}")


if __name__ == "__main__":
    # Resolve path relative to project root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    output = os.path.join(project_root, "data", "sample_resume.pdf")
    generate_sample_resume_pdf(output)
