"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  startInterview,
  scoreAnswer,
  type Report,
  type InterviewQuestion,
  type ScoreResult,
} from "@/lib/api";
import { Kicker, Badge, Button, Spinner } from "./ui";
import { cn } from "@/lib/cn";

const ROUNDS: { id: string; label: string }[] = [
  { id: "dsa", label: "DSA" },
  { id: "technical", label: "Technical" },
  { id: "system_design", label: "System Design" },
  { id: "hr", label: "HR" },
];

export default function Interview({ report }: { report: Report }) {
  const [round, setRound] = useState("technical");
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [scores, setScores] = useState<Record<number, ScoreResult>>({});
  const [loadingQ, setLoadingQ] = useState(false);
  const [scoringIdx, setScoringIdx] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadQuestions() {
    setLoadingQ(true);
    setError(null);
    setQuestions([]);
    setAnswers({});
    setScores({});
    try {
      const res = await startInterview(report.jd_structured, report.resume_structured, round, 3);
      setQuestions(res.questions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load questions");
    } finally {
      setLoadingQ(false);
    }
  }

  async function submitAnswer(idx: number) {
    setScoringIdx(idx);
    setError(null);
    try {
      const result = await scoreAnswer(questions[idx].question, answers[idx] ?? "", round);
      setScores((s) => ({ ...s, [idx]: result }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to score answer");
    } finally {
      setScoringIdx(null);
    }
  }

  return (
    <section>
      <Kicker>Cross-examination</Kicker>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {ROUNDS.map((r) => (
          <button
            key={r.id}
            onClick={() => setRound(r.id)}
            className={cn(
              "rounded-[3px] border px-3 py-1 text-sm transition",
              round === r.id
                ? "border-seal bg-seal/5 text-seal"
                : "border-rule-strong text-ink-2 hover:border-ink hover:text-ink",
            )}
          >
            {r.label}
          </button>
        ))}
        <Button size="sm" onClick={loadQuestions} disabled={loadingQ} className="ml-auto">
          {loadingQ ? <Spinner label="Summoning…" /> : "Begin"}
        </Button>
      </div>

      {error && (
        <p className="mb-3 rounded-[3px] border border-seal/40 bg-seal/5 p-2 text-sm text-seal">
          {error}
        </p>
      )}

      <div className="divide-y divide-rule">
        {questions.map((q, idx) => {
          const score = scores[idx];
          return (
            <div key={idx} className="py-5">
              <div className="mb-2 flex items-start justify-between gap-3">
                <p className="font-medium text-ink">
                  <span className="nums text-ink-3">Q{idx + 1}.</span> {q.question}
                </p>
                <div className="flex shrink-0 gap-1.5">
                  {q.focus && <Badge tone="ink">{q.focus}</Badge>}
                  <Badge tone="contested">{q.difficulty}</Badge>
                </div>
              </div>

              <textarea
                value={answers[idx] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [idx]: e.target.value }))}
                rows={4}
                placeholder="State your answer for the record…"
                className="w-full rounded-[3px] border border-rule-strong bg-surface p-2.5 text-sm text-ink placeholder:text-ink-3 outline-none transition focus:border-seal"
              />

              <Button
                size="sm"
                variant="secondary"
                onClick={() => submitAnswer(idx)}
                disabled={scoringIdx === idx}
                className="mt-2"
              >
                {scoringIdx === idx ? <Spinner label="Weighing…" /> : "Submit answer"}
              </Button>

              {score && (
                <div className="mt-3 rounded-[3px] border-l-2 border-seal bg-surface p-3 text-sm">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-semibold text-ink">Ruling:</span>
                    <Badge tone={score.score >= 7 ? "affirmed" : score.score >= 4 ? "contested" : "seal"}>
                      <span className="nums">{score.score}/10</span>
                    </Badge>
                  </div>
                  <p className="text-ink-2">
                    <span className="font-medium text-ink">Feedback:</span> {score.feedback}
                  </p>
                  {score.model_answer && (
                    <details className="group mt-2">
                      <summary className="flex cursor-pointer items-center gap-1 text-seal">
                        <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
                        Model answer
                      </summary>
                      <p className="mt-1 leading-relaxed text-ink-2">{score.model_answer}</p>
                    </details>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
