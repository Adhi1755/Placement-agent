# Placement Agent

A multi-agent **career-readiness** tool. Give it a résumé and a job description and it produces:

- a **readiness score** and skill-gap list (résumé vs. JD),
- an **ATS keyword** coverage breakdown,
- a **recruiter-vs-advocate debate** (one agent challenges the candidate, the other defends),
- a **learning sprint plan** built from a skill-dependency DAG (prerequisites first, ~10 hrs/week),
- an interactive **mock interview** (DSA / technical / system-design / HR) with per-answer scoring.

The backend is a [LangGraph](https://github.com/langchain-ai/langgraph) pipeline of Gemini-powered
agents, exposed over a FastAPI server. The frontend is a Next.js (App Router) app.

## Architecture

```
                         ┌──────────────── orchestrator (router) ───────────────┐
 resume + JD  ─►  parser_agent ─► resume_analyst ─► recruiter ─► advocate ─► skill_graph ─► done
                  (PDF/TXT/URL)   (score + gaps)    (challenge)  (rebut)     (DAG + sprint)
                                                                                   │
 mock interview (interactive, on-demand via API): interviewer.generate_questions / score_answer
```

Routing is driven by `current_phase`, so a stage that legitimately emits nothing (or hits an
LLM error) still advances the pipeline instead of looping.

### Layout

| Path | What it is |
|------|------------|
| `agents/` | The agent nodes (parser, resume_analyst, recruiter, advocate, skill_graph, interviewer, orchestrator) |
| `core/graph.py` | LangGraph wiring | 
| `core/state.py` | Shared `PlacementState` |
| `core/llm.py` | Gemini helper (model id + JSON calls) |
| `parsers/` | Résumé (PDF/TXT) and JD (URL/TXT) extractors |
| `api/server.py` | FastAPI server |
| `main.py` | CLI entry point (prints a text report) |
| `frontend/` | Next.js UI |

## Setup

### 1. Backend

```bash
cd placement-agent
python3 -m venv venv            # the repo already ships a venv/
./venv/bin/python -m pip install -r requirements.txt
```

Add your key to `.env` (the committed file has a placeholder). The project runs entirely on
Google Gemini — a free key works:

```
GOOGLE_API_KEY=...        # get one free at https://aistudio.google.com/app/apikey
GEMINI_MODEL=gemini-2.5-flash-lite   # optional override (this is the default)
```

> **Free-tier quota matters here.** A single analysis makes ~8 Gemini calls (parse résumé,
> parse JD, score, recruiter, advocate, skill-graph, judge, résumé rewrite). The default model
> is **`gemini-2.5-flash-lite`** because it has the most generous free daily quota. Avoid
> `gemini-2.5-flash` on a free key — its free tier is ~20 requests/day, enough for only ~2
> analyses. The `gemini-2.0-flash*` models report a quota of `0`. Quotas are **per-model**, so
> if one is exhausted you can switch `GEMINI_MODEL` to another. Thinking is disabled in
> `core/llm.py` so the whole output-token budget goes to the answer.

> ⚠️ Until `GOOGLE_API_KEY` is a real key, the pipeline runs but every LLM call returns an
> auth error and you'll get a zero-score report with errors listed.

Run the CLI:

```bash
./venv/bin/python main.py --resume data/sample_resume.pdf --jd data/sample_jd.txt
```

Run the API (used by the frontend):

```bash
./venv/bin/python -m uvicorn api.server:app --reload --port 8000
```

Key endpoints:
- `GET /api/health`
- `POST /api/analyze` (JSON) / `POST /api/analyze/upload` (multipart résumé file) — full report
- `POST /api/analyze/stream` / `POST /api/analyze/stream/upload` — **SSE**: streams per-stage
  progress events, ending with a `done` event carrying the report (drives the processing screen)
- `POST /api/interview/start`, `POST /api/interview/score`

The pipeline now also produces: **5-dimension scores**, a **judge verdict** (recruiter-wins /
advocate-wins / contested / final readiness), a **résumé rewrite** with deterministic ATS
before/after, and a **skill graph** with importance + why/how-to-close per node.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

The frontend reads `NEXT_PUBLIC_API_BASE` (default `http://localhost:8000`, set in
`frontend/.env.local`). Start the backend first, then open the app.

The UI is a single-page **state machine** (no auth):

```
Landing → 3-step Wizard (resume / JD / role) → Processing (live SSE animation)
        → Score Reveal (radar) → Recruiter-vs-Advocate Debate + Verdict
        → Results Dashboard (Overview · Skill Gaps + ATS graph · Resume diff · Learning Path / Mock Interview)
```

Built with Next.js 16 (App Router) + Tailwind v4, Framer Motion (transitions/sequencing),
Recharts (radar), and React Flow / `@xyflow/react` (skill graph). The dashboard's last tab is
gated on the verdict: **Learning Path** kanban if final readiness < 70, otherwise the
**Mock Interview** chat.
```
