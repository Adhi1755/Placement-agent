"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { Report, DebateEntry } from "@/lib/api";
import { Button, Stamp } from "@/components/ui";

const RECRUITER = "var(--color-recruiter)";
const ADVOCATE = "var(--color-advocate)";

interface Pair {
  target: string;
  recruiter?: DebateEntry;
  advocate?: DebateEntry;
}

export default function Debate({
  report,
  onContinue,
}: {
  report: Report;
  onContinue: () => void;
}) {
  const pairs = useMemo<Pair[]>(() => {
    const rec = report.debate_log.filter((d) => d.agent === "recruiter");
    const adv = report.debate_log.filter((d) => d.agent === "advocate");
    return rec.map((r, i) => ({
      target: r.target,
      recruiter: r,
      advocate: adv.find((a) => a.target === r.target) ?? adv[i],
    }));
  }, [report.debate_log]);

  const [revealed, setRevealed] = useState(0);
  const [showVerdict, setShowVerdict] = useState(false);

  useEffect(() => {
    if (revealed < pairs.length) {
      const t = setTimeout(() => setRevealed((n) => n + 1), revealed === 0 ? 600 : 1800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShowVerdict(true), 1100);
    return () => clearTimeout(t);
  }, [revealed, pairs.length]);

  const verdict = report.verdict ?? {};
  const finalReadiness =
    verdict.final_readiness ?? Math.round((report.readiness_score || 0) * 100);

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      {/* Masthead */}
      <div className="rule-b pb-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-seal">
          On the record
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink">The Hearing</h1>
      </div>

      {/* Counsel column headers */}
      <div className="mt-6 grid grid-cols-2">
        <div className="pr-6">
          <p className="font-display text-lg font-semibold" style={{ color: RECRUITER }}>
            Recruiter
          </p>
          <p className="text-xs uppercase tracking-[0.14em] text-ink-3">For the prosecution</p>
        </div>
        <div className="border-l border-rule pl-6">
          <p className="font-display text-lg font-semibold" style={{ color: ADVOCATE }}>
            Advocate
          </p>
          <p className="text-xs uppercase tracking-[0.14em] text-ink-3">For the defense</p>
        </div>
      </div>

      {/* Transcript */}
      <div className="mt-2 divide-y divide-rule">
        {pairs.slice(0, revealed).map((pair, i) => (
          <div key={i} className="grid grid-cols-2">
            <div className="py-5 pr-6">
              {pair.recruiter && <Argument entry={pair.recruiter} color={RECRUITER} side="left" />}
            </div>
            <div className="border-l border-rule py-5 pl-6">
              <AnimatePresence>
                {pair.advocate && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                    <Argument entry={pair.advocate} color={ADVOCATE} side="right" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      {revealed < pairs.length && (
        <p className="nums mt-6 text-center text-sm text-ink-3">
          Exhibit {revealed} of {pairs.length}…
        </p>
      )}

      {/* The ruling */}
      <AnimatePresence>
        {showVerdict && (
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 rounded-[4px] border-2 border-ink/15 bg-surface p-6"
          >
            <div className="flex items-start justify-between rule-b pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-3">
                  The committee finds
                </p>
                <p className="mt-1 font-display text-2xl font-semibold text-ink">
                  Readiness: <span className="nums">{finalReadiness}</span>
                  <span className="text-ink-3">/100</span>
                </p>
              </div>
              <Stamp>Ruling</Stamp>
            </div>

            <div className="mt-4 space-y-3">
              <Finding color={RECRUITER} lead="Prosecution prevails on" point={verdict.recruiter_wins_on?.point} detail={verdict.recruiter_wins_on?.detail} />
              <Finding color={ADVOCATE} lead="Defense prevails on" point={verdict.advocate_wins_on?.point} detail={verdict.advocate_wins_on?.detail} />
              <Finding color="var(--color-contested)" lead="Left contested" point={verdict.contested?.point} detail={verdict.contested?.detail} />
            </div>

            {verdict.summary && (
              <p className="mt-4 rule-t pt-4 text-ink-2">{verdict.summary}</p>
            )}

            <div className="mt-7">
              <Button size="lg" onClick={onContinue}>
                Read the full opinion <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Argument({
  entry,
  color,
  side,
}: {
  entry: DebateEntry;
  color: string;
  side: "left" | "right";
}) {
  const strength = Math.round((entry.strength ?? 0.6) * 100);
  return (
    <motion.div
      initial={{ opacity: 0, x: side === "left" ? -16 : 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color }}>
        {entry.target}
      </p>
      <p className="text-[15px] leading-relaxed text-ink">{entry.argument}</p>
      <div className="mt-2.5 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wide text-ink-3">Weight</span>
        <span className="h-1 w-20 rounded-full bg-sunken">
          <span className="block h-full rounded-full" style={{ width: `${strength}%`, background: color }} />
        </span>
      </div>
    </motion.div>
  );
}

function Finding({
  color,
  lead,
  point,
  detail,
}: {
  color: string;
  lead: string;
  point?: string;
  detail?: string;
}) {
  if (!point) return null;
  return (
    <div className="flex gap-3">
      <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
      <p className="text-sm text-ink">
        <span className="text-ink-3">{lead}: </span>
        <span className="font-semibold">{point}</span>
        {detail && <span className="text-ink-2"> — {detail}</span>}
      </p>
    </div>
  );
}
