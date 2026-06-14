"use client";

import React, { useState } from "react";
import { Pencil, Copy, Check, ArrowRight } from "lucide-react";
import type { Report } from "@/lib/api";

export default function ResumeDiff({ report }: { report: Report }) {
  const rw = report.resume_rewrite ?? {};
  const original = report.resume_text ?? "";
  const rewritten = rw.rewritten_text ?? "";
  const [copied, setCopied] = useState(false);

  if (!rewritten) {
    return <p className="text-sm text-ink-2">No revision was entered for this case.</p>;
  }

  const copy = async () => {
    await navigator.clipboard.writeText(rewritten);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div>
      {/* ATS before/after */}
      <div className="mb-5 flex items-center gap-5">
        <AtsFigure label="ATS before" value={rw.ats_before ?? 0} color="var(--color-seal)" />
        <ArrowRight className="h-5 w-5 text-ink-3" />
        <AtsFigure label="ATS after" value={rw.ats_after ?? 0} color="var(--color-affirmed)" />
        {typeof rw.ats_after === "number" && typeof rw.ats_before === "number" && (
          <span className="nums text-sm font-medium text-affirmed">
            +{Math.max(0, rw.ats_after - rw.ats_before)} pts
          </span>
        )}
      </div>

      {rw.changes && rw.changes.length > 0 && (
        <div className="mb-5 rounded-[4px] border border-rule bg-sunken/60 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-seal">
            <Pencil className="h-3.5 w-3.5" /> Amendments entered
          </p>
          <ul className="space-y-1.5 text-sm text-ink-2">
            {rw.changes.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-contested" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">As submitted</p>
          <pre className="h-[460px] overflow-auto whitespace-pre-wrap rounded-[4px] border border-rule bg-surface p-4 text-xs leading-relaxed text-ink-2">
            {original || "(original text unavailable)"}
          </pre>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-affirmed">As revised</p>
            <button
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-[3px] border border-rule-strong px-2.5 py-1 text-xs text-ink-2 transition hover:border-ink hover:text-ink"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="h-[460px] overflow-auto whitespace-pre-wrap rounded-[4px] border border-affirmed/40 bg-affirmed/5 p-4 text-xs leading-relaxed text-ink">
            {rewritten}
          </pre>
        </div>
      </div>
    </div>
  );
}

function AtsFigure({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className="nums font-display text-3xl font-semibold" style={{ color }}>
        {value}
      </div>
      <div className="text-xs text-ink-3">{label}</div>
    </div>
  );
}
