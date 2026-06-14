"use client";

import React, { useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import type { Report } from "@/lib/api";
import { Block, Kicker, Rule, Badge, Button, ScoreNumeral } from "@/components/ui";
import { cn } from "@/lib/cn";
import SkillGraphView from "@/components/dashboard/SkillGraphView";
import ResumeDiff from "@/components/dashboard/ResumeDiff";
import LearningPath from "@/components/dashboard/LearningPath";
import Interview from "@/components/Interview";

const DIM_LABELS: Record<string, string> = {
  technical: "Technical",
  resume_quality: "Résumé",
  communication: "Communication",
  domain_knowledge: "Domain",
  cultural_fit: "Culture",
};

export default function Dashboard({
  report,
  onRestart,
}: {
  report: Report;
  onRestart: () => void;
}) {
  const finalReadiness =
    report.verdict?.final_readiness ?? Math.round((report.readiness_score || 0) * 100);
  const isReady = finalReadiness >= 70;

  const tabs = [
    { id: "overview", label: "The opinion" },
    { id: "gaps", label: "Gaps & keywords" },
    { id: "resume", label: "Résumé, revised" },
    { id: "next", label: isReady ? "Cross-examination" : "Preparation" },
  ];
  const [tab, setTab] = useState("overview");

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Masthead */}
      <header className="rule-b flex flex-wrap items-end justify-between gap-4 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-seal">
            The opinion of the committee
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
            {report.candidate.name}
          </h1>
          <p className="text-ink-2">{report.role.title}</p>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <div className="nums font-display text-4xl font-semibold text-ink">
              {finalReadiness}
              <span className="text-lg text-ink-3">/100</span>
            </div>
            <p className="text-xs uppercase tracking-[0.14em] text-ink-3">Readiness</p>
          </div>
          <Button variant="secondary" size="sm" onClick={onRestart}>
            New case
          </Button>
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-8 md:flex-row">
        {/* TOC rail */}
        <aside className="md:w-52 md:shrink-0">
          <nav className="flex gap-1 md:flex-col">
            {tabs.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "group flex items-baseline gap-2.5 py-2 text-left text-sm transition",
                  tab === t.id ? "text-ink" : "text-ink-3 hover:text-ink-2",
                )}
              >
                <span
                  className={cn(
                    "nums text-xs",
                    tab === t.id ? "text-seal" : "text-ink-3",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "border-b pb-0.5",
                    tab === t.id ? "border-seal" : "border-transparent",
                  )}
                >
                  {t.label}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Body */}
        <main className="min-w-0 flex-1">
          {tab === "overview" && <Overview report={report} />}
          {tab === "gaps" && <GapsAts report={report} />}
          {tab === "resume" && (
            <section>
              <Kicker>Résumé, revised</Kicker>
              <ResumeDiff report={report} />
            </section>
          )}
          {tab === "next" &&
            (isReady ? (
              <Interview report={report} />
            ) : (
              <section>
                <Kicker>A seven-day plan</Kicker>
                <LearningPath report={report} />
              </section>
            ))}
        </main>
      </div>
    </div>
  );
}

function Overview({ report }: { report: Report }) {
  const radarData = Object.entries(DIM_LABELS).map(([k, label]) => ({
    dimension: label,
    value: Math.round((report.dimensions?.[k as keyof typeof report.dimensions] ?? 0) * 100),
  }));
  const v = report.verdict ?? {};

  return (
    <div className="space-y-8">
      <section>
        <Rule label="Findings by dimension" className="mb-4" />
        <div className="grid items-center gap-6 md:grid-cols-[1fr_1.1fr]">
          <div className="space-y-2.5">
            {Object.entries(DIM_LABELS).map(([k, label]) => {
              const val = report.dimensions?.[k as keyof typeof report.dimensions] ?? 0;
              return (
                <div key={k} className="grid grid-cols-[8rem_1fr_2.5rem] items-center gap-3">
                  <span className="text-sm text-ink-2">{label}</span>
                  <span className="h-1.5 rounded-full bg-sunken">
                    <span className="block h-full rounded-full bg-seal" style={{ width: `${Math.round(val * 100)}%` }} />
                  </span>
                  <span className="nums text-right text-sm text-ink">{Math.round(val * 100)}</span>
                </div>
              );
            })}
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="var(--color-rule-strong)" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: "var(--color-ink-2)", fontSize: 11 }} />
                <Radar dataKey="value" stroke="var(--color-seal)" fill="var(--color-seal)" fillOpacity={0.18} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[4px] border-l-2 border-recruiter bg-surface py-3 pl-4 pr-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-recruiter">Prosecution prevails on</p>
          <p className="mt-1 font-medium text-ink">{v.recruiter_wins_on?.point ?? "—"}</p>
          <p className="mt-1 text-sm text-ink-2">{v.recruiter_wins_on?.detail}</p>
        </div>
        <div className="rounded-[4px] border-l-2 border-advocate bg-surface py-3 pl-4 pr-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-advocate">Defense prevails on</p>
          <p className="mt-1 font-medium text-ink">{v.advocate_wins_on?.point ?? "—"}</p>
          <p className="mt-1 text-sm text-ink-2">{v.advocate_wins_on?.detail}</p>
        </div>
      </div>

      {v.summary && (
        <section>
          <Rule label="The verdict, in plain words" className="mb-3" />
          <p className="font-display text-lg leading-relaxed text-ink">{v.summary}</p>
        </section>
      )}
    </div>
  );
}

function GapsAts({ report }: { report: Report }) {
  const matched = report.ats?.matched ?? [];
  const missing = report.ats?.missing ?? [];
  const total = matched.length + missing.length;
  const pct = total ? Math.round((matched.length / total) * 100) : 0;

  return (
    <div className="space-y-8">
      <section>
        <Rule label="ATS keyword coverage" className="mb-4" />
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-ink-2">
            <span className="nums">{matched.length}</span> of <span className="nums">{total}</span> keywords found
          </span>
          <span className="nums font-display text-xl font-semibold text-ink">{pct}%</span>
        </div>
        <div className="mb-5 flex h-2.5 overflow-hidden rounded-full bg-sunken">
          <div className="bg-affirmed" style={{ width: `${pct}%` }} />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-affirmed">
              In evidence ({matched.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {matched.map((k) => <Badge key={k} tone="affirmed">{k}</Badge>)}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-seal">
              Missing ({missing.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {missing.map((k) => <Badge key={k} tone="seal">{k}</Badge>)}
            </div>
          </div>
        </div>
      </section>

      <section>
        <Rule label="Skill dependency map" className="mb-4" />
        <SkillGraphView report={report} />
      </section>
    </div>
  );
}
