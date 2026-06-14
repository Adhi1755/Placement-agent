// API client + shared types for the Placement Agent backend (FastAPI).

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export interface Project {
  name: string;
  tech_stack?: string[];
  description?: string;
  achievement?: string | null;
}

export interface DebateEntry {
  agent: "recruiter" | "advocate" | string;
  argument: string;
  target: string;
  strength?: number;
}

export interface SkillNode {
  id: string;
  difficulty: string;
  estimated_hours: number;
  resource: string;
  importance?: number;
  why_it_matters?: string;
  how_to_close?: string;
  status?: "gap" | "have" | "partial";
}

export interface SprintTask {
  week: number;
  skill: string;
  resource: string;
  estimated_hours: number;
}

export interface Dimensions {
  technical?: number;
  resume_quality?: number;
  communication?: number;
  domain_knowledge?: number;
  cultural_fit?: number;
}

export interface VerdictPoint {
  point: string;
  detail: string;
}

export interface Verdict {
  recruiter_wins_on?: VerdictPoint;
  advocate_wins_on?: VerdictPoint;
  contested?: VerdictPoint;
  final_readiness?: number;
  summary?: string;
}

export interface ResumeRewrite {
  rewritten_text?: string;
  changes?: string[];
  ats_before?: number;
  ats_after?: number;
}

export interface Report {
  candidate: {
    name: string;
    email?: string | null;
    github?: string | null;
    technical_skills: string[];
    projects: Project[];
  };
  role: {
    title: string;
    company_type?: string | null;
    required_skills: string[];
    interview_topics: string[];
  };
  readiness_score: number;
  dimensions: Dimensions;
  gap_list: string[];
  analysis: {
    matched_skills?: string[];
    missing_keywords?: string[];
    strength_summary?: string;
    weakness_summary?: string;
  };
  ats: { matched: string[]; missing: string[] };
  debate_log: DebateEntry[];
  verdict: Verdict;
  resume_rewrite: ResumeRewrite;
  skill_dag: { nodes: SkillNode[]; edges: { from: string; to: string }[] };
  sprint_plan: SprintTask[];
  jd_structured: Record<string, unknown>;
  resume_structured: Record<string, unknown>;
  resume_text: string;
  errors: string[];
}

export interface InterviewQuestion {
  question: string;
  difficulty: string;
  focus: string;
}

export interface ScoreResult {
  score: number;
  feedback: string;
  model_answer: string;
}

export interface ProgressEvent {
  type: "progress";
  phase: string;
  stage: string;
  label: string;
  pct: number;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new Error(`${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

// ── Streaming analyze (SSE over POST) ────────────────────────────────────────

export interface StreamHandlers {
  onProgress?: (e: ProgressEvent) => void;
  onDone?: (report: Report) => void;
  onError?: (message: string) => void;
}

/**
 * POST to the streaming endpoint and parse the text/event-stream response.
 * Pass either { resumeText } or { file } plus the JD text.
 */
export async function streamAnalyze(
  input: { resumeText?: string; file?: File; jdText: string },
  handlers: StreamHandlers,
): Promise<void> {
  let res: Response;
  if (input.file) {
    const form = new FormData();
    form.append("resume", input.file);
    form.append("jd_text", input.jdText);
    res = await fetch(`${API_BASE}/api/analyze/stream/upload`, {
      method: "POST",
      body: form,
    });
  } else {
    res = await fetch(`${API_BASE}/api/analyze/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume_text: input.resumeText ?? "", jd_text: input.jdText }),
    });
  }

  if (!res.ok || !res.body) {
    handlers.onError?.(`${res.status}: ${res.statusText}`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by a blank line.
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      const json = line.slice(5).trim();
      if (!json) continue;
      try {
        const evt = JSON.parse(json);
        if (evt.type === "progress") handlers.onProgress?.(evt as ProgressEvent);
        else if (evt.type === "done") handlers.onDone?.(evt.report as Report);
        else if (evt.type === "error") handlers.onError?.(evt.message as string);
      } catch {
        /* ignore malformed chunk */
      }
    }
  }
}

// ── Non-streaming + interview endpoints ──────────────────────────────────────

export async function startInterview(
  jdStructured: Record<string, unknown>,
  resumeStructured: Record<string, unknown>,
  roundType: string,
  numQuestions = 3,
): Promise<{ round_type: string; questions: InterviewQuestion[] }> {
  const res = await fetch(`${API_BASE}/api/interview/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jd_structured: jdStructured,
      resume_structured: resumeStructured,
      round_type: roundType,
      num_questions: numQuestions,
    }),
  });
  return handle(res);
}

export async function scoreAnswer(
  question: string,
  answer: string,
  roundType: string,
): Promise<ScoreResult> {
  const res = await fetch(`${API_BASE}/api/interview/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, answer, round_type: roundType }),
  });
  return handle<ScoreResult>(res);
}
