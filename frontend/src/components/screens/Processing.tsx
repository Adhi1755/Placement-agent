"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const STAGE_ORDER = [
  "parsing",
  "extracting",
  "scoring",
  "recruiter",
  "advocate",
  "planning",
  "verdict",
  "finalizing",
];

const FLOAT_CHIPS = [
  "FastAPI", "PyTorch", "ChromaDB", "Docker", "RAG", "Transformers",
  "Next.js", "PostgreSQL", "LangChain", "REST API",
];

const THINKING = {
  recruiter: ["No latency benchmarks…", "Production, or portfolio?", "Six months on RAG…"],
  advocate: ["The stack matches…", "Strong public record…", "Exceptional for a student…"],
};

export default function Processing({
  stage,
  label,
  pct,
}: {
  stage: string;
  label: string;
  pct: number;
}) {
  const idx = STAGE_ORDER.indexOf(stage);
  const reached = (s: string) => idx >= STAGE_ORDER.indexOf(s);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="flex w-full max-w-3xl flex-col items-center">
        <p className="mb-10 text-xs font-semibold uppercase tracking-[0.18em] text-seal">
          The committee is in session
        </p>

        <div className="relative mb-12 flex h-60 w-full items-center justify-center">
          {/* The case file */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{
              scale: reached("recruiter") ? 0.85 : 1,
              opacity: 1,
              x: reached("recruiter") ? -36 : 0,
            }}
            transition={{ duration: 0.6 }}
            className="relative h-44 w-36 overflow-hidden rounded-[3px] border border-rule-strong bg-surface"
          >
            <div className="space-y-2.5 p-3">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="h-1 rounded bg-rule"
                  style={{ width: `${58 + ((i * 13) % 36)}%` }}
                />
              ))}
            </div>
            {!reached("scoring") && (
              <motion.div
                initial={{ y: -8 }}
                animate={{ y: 176 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 h-px w-full bg-seal"
              />
            )}
          </motion.div>

          {/* Extracted skills — small ink tags */}
          <AnimatePresence>
            {reached("extracting") &&
              !reached("recruiter") &&
              FLOAT_CHIPS.map((chip, i) => {
                const angle = (i / FLOAT_CHIPS.length) * Math.PI * 2;
                const radius = 118 + (i % 3) * 22;
                return (
                  <motion.div
                    key={chip}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      x: Math.cos(angle) * radius,
                      y: Math.sin(angle) * radius * 0.6,
                    }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ delay: i * 0.07, duration: 0.4 }}
                    className="absolute rounded-[3px] border border-rule-strong bg-surface px-2 py-0.5 text-xs text-ink-2"
                  >
                    {chip}
                  </motion.div>
                );
              })}
          </AnimatePresence>

          {/* Counsel take their benches */}
          <AnimatePresence>
            {reached("recruiter") && (
              <>
                <Counsel
                  side="left"
                  label="RECRUITER"
                  color="var(--color-recruiter)"
                  active={stage === "recruiter"}
                  thinking={stage === "recruiter" ? THINKING.recruiter : []}
                />
                <Counsel
                  side="right"
                  label="ADVOCATE"
                  color="var(--color-advocate)"
                  active={stage === "advocate"}
                  thinking={stage === "advocate" ? THINKING.advocate : []}
                  delay={0.12}
                />
              </>
            )}
          </AnimatePresence>

          {/* Verdict being stamped — faint serif figure, no glow */}
          <AnimatePresence>
            {reached("verdict") && (
              <motion.div
                initial={{ opacity: 0, scale: 1.1, rotate: -8 }}
                animate={{ opacity: 1, scale: 1, rotate: -6 }}
                className="absolute"
              >
                <span className="nums font-display text-5xl font-semibold text-seal/25">
                  {Math.round(pct)}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="mb-6 font-display text-xl text-ink"
          >
            {label}
          </motion.p>
        </AnimatePresence>

        <div className="h-1.5 w-full max-w-md rounded-full bg-sunken">
          <motion.div
            className="h-full rounded-full bg-seal"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>
    </div>
  );
}

function Counsel({
  side,
  label,
  color,
  active,
  thinking,
  delay = 0,
}: {
  side: "left" | "right";
  label: string;
  color: string;
  active: boolean;
  thinking: string[];
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: side === "left" ? -110 : 110 }}
      animate={{ opacity: 1, x: side === "left" ? -130 : 130 }}
      transition={{ delay, duration: 0.6 }}
      className="absolute flex flex-col items-center"
    >
      <motion.div
        animate={active ? { opacity: [0.6, 1, 0.6] } : { opacity: 1 }}
        transition={{ duration: 1.4, repeat: active ? Infinity : 0 }}
        className="flex h-14 w-14 items-center justify-center rounded-full border-2 font-display text-lg font-semibold"
        style={{ borderColor: color, color }}
      >
        {label[0]}
      </motion.div>
      <span className="mt-2 text-[11px] font-bold tracking-[0.12em]" style={{ color }}>
        {label}
      </span>
      <div className="mt-2 h-8">
        <AnimatePresence>
          {thinking.map((t, i) => (
            <motion.p
              key={t}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2.4, delay: i * 0.8, repeat: Infinity, repeatDelay: thinking.length * 0.8 }}
              className="absolute max-w-[150px] -translate-x-1/2 text-center text-[11px] italic text-ink-3"
            >
              “{t}”
            </motion.p>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
