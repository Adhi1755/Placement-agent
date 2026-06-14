"use client";

import React, { useState } from "react";
import { Video, FileText, Code2 } from "lucide-react";
import type { Report } from "@/lib/api";

function ResourceIcon({ res }: { res: string }) {
  const r = res.toLowerCase();
  if (r.includes("youtube") || r.includes("video") || r.includes("course"))
    return <Video className="h-3.5 w-3.5" />;
  if (r.includes("leetcode") || r.includes("practice") || r.includes("project"))
    return <Code2 className="h-3.5 w-3.5" />;
  return <FileText className="h-3.5 w-3.5" />;
}

export default function LearningPath({ report }: { report: Report }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const weeks = Array.from(new Set(report.sprint_plan.map((t) => t.week))).sort((a, b) => a - b);
  const total = report.sprint_plan.length;
  const completed = Object.values(done).filter(Boolean).length;

  if (!report.sprint_plan.length) {
    return <p className="text-sm text-ink-2">No plan was filed for this case.</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between border-l-2 border-seal bg-surface py-3 pl-4 pr-3 text-sm">
        <span className="text-ink-2">
          Close this plan and re-file to unlock your cross-examination.
        </span>
        <span className="nums shrink-0 pl-3 text-ink-3">
          {completed}/{total}
        </span>
      </div>

      <div className="space-y-7">
        {weeks.map((w) => {
          const tasks = report.sprint_plan.filter((t) => t.week === w);
          const hours = tasks.reduce((s, t) => s + (t.estimated_hours || 0), 0);
          return (
            <div key={w} className="grid grid-cols-[auto_1fr] gap-5 md:grid-cols-[6rem_1fr]">
              <div className="rule-t pt-3">
                <div className="font-display text-2xl font-semibold text-seal">W{w}</div>
                <div className="nums text-xs text-ink-3">~{hours}h</div>
              </div>
              <div className="rule-t space-y-2 pt-3">
                {tasks.map((t, i) => {
                  const key = `${w}-${i}`;
                  return (
                    <div key={key}>
                      <label className="flex cursor-pointer items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={!!done[key]}
                          onChange={(e) => setDone((d) => ({ ...d, [key]: e.target.checked }))}
                          className="mt-1 h-3.5 w-3.5 accent-[var(--color-seal)]"
                        />
                        <span className={done[key] ? "text-ink-3 line-through" : "text-ink"}>
                          {t.skill}
                        </span>
                      </label>
                      {t.resource && (
                        <div className="ml-6 mt-1 inline-flex items-center gap-1.5 text-xs text-ink-3">
                          <ResourceIcon res={t.resource} /> {t.resource}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
