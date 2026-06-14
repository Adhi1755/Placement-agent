"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { ArrowRight } from "lucide-react";
import type { Report } from "@/lib/api";
import { Button } from "@/components/ui";

const DIM_LABELS: Record<string, string> = {
  technical: "Technical",
  resume_quality: "Résumé",
  communication: "Communication",
  domain_knowledge: "Domain",
  cultural_fit: "Culture",
};

function tier(pct: number): { label: string; line: string } {
  if (pct < 60)
    return { label: "Weak case", line: "The file has real gaps. Hear what the committee makes of it." };
  if (pct < 80)
    return { label: "Arguable", line: "Competitive, but not a lock. The debate will show you why." };
  return { label: "Strong case", line: "A strong profile. Let's confirm it survives the committee." };
}

export default function ScoreReveal({
  report,
  onContinue,
}: {
  report: Report;
  onContinue: () => void;
}) {
  const target = Math.round((report.readiness_score || 0) * 100);
  const [count, setCount] = useState(0);
  const t = tier(target);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 1300;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const radarData = Object.entries(DIM_LABELS).map(([k, label]) => ({
    dimension: label,
    value: Math.round((report.dimensions?.[k as keyof typeof report.dimensions] ?? 0) * 100),
  }));

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
      <div className="grid w-full items-center gap-12 md:grid-cols-2">
        {/* Verdict numeral */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-seal">
            Readiness for {report.role.title}
          </p>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="nums font-display text-[8rem] font-semibold leading-none text-ink">
              {count}
            </span>
            <span className="font-display text-2xl text-ink-3">/100</span>
          </div>
          <div className="mt-4 max-w-xs">
            <div className="h-1.5 w-full rounded-full bg-sunken">
              <motion.div
                className="h-full rounded-full bg-seal"
                initial={{ width: 0 }}
                animate={{ width: `${target}%` }}
                transition={{ duration: 1.3, ease: "easeOut" }}
              />
            </div>
          </div>
          <p className="mt-6 font-display text-2xl font-semibold text-ink">{t.label}.</p>
          <p className="mt-1 max-w-sm text-ink-2">{t.line}</p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.5 }}
            className="mt-8"
          >
            <Button size="lg" onClick={onContinue}>
              Hear the debate <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Dimension radar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="72%">
              <PolarGrid stroke="var(--color-rule-strong)" />
              <PolarAngleAxis dataKey="dimension" tick={{ fill: "var(--color-ink-2)", fontSize: 11 }} />
              <Radar
                dataKey="value"
                stroke="var(--color-seal)"
                fill="var(--color-seal)"
                fillOpacity={0.18}
                isAnimationActive
                animationDuration={1100}
                animationBegin={400}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
