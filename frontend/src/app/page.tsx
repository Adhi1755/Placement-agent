"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { streamAnalyze, type Report } from "@/lib/api";
import Landing from "@/components/screens/Landing";
import Wizard, { type WizardResult } from "@/components/screens/Wizard";
import Processing from "@/components/screens/Processing";
import ScoreReveal from "@/components/screens/ScoreReveal";
import Debate from "@/components/screens/Debate";
import Dashboard from "@/components/screens/Dashboard";

type Stage =
  | "landing"
  | "wizard"
  | "processing"
  | "reveal"
  | "debate"
  | "dashboard";

export default function Home() {
  const [stage, setStage] = useState<Stage>("landing");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Processing progress
  const [progStage, setProgStage] = useState("parsing");
  const [progLabel, setProgLabel] = useState("Parsing your resume…");
  const [progPct, setProgPct] = useState(5);

  async function runAnalysis(w: WizardResult) {
    setError(null);
    setReport(null);
    setProgStage("parsing");
    setProgLabel("Parsing your resume…");
    setProgPct(5);
    setStage("processing");

    // Compose JD text with the optional company / targeting context.
    const jd =
      w.jdText +
      (w.company ? `\n\nCompany: ${w.company}` : "") +
      `\n\nTarget role: ${w.role} · Company type: ${w.companyType}`;

    await streamAnalyze(
      w.file ? { file: w.file, jdText: jd } : { resumeText: w.resumeText, jdText: jd },
      {
        onProgress: (e) => {
          setProgStage(e.stage);
          setProgLabel(e.label);
          setProgPct(e.pct);
        },
        onDone: (rep) => {
          setReport(rep);
          if (rep.errors && rep.errors.length && !rep.dimensions?.technical) {
            setError(rep.errors.join("; "));
            setStage("wizard");
            return;
          }
          // brief beat on 100% before the reveal
          setProgPct(100);
          setTimeout(() => setStage("reveal"), 700);
        },
        onError: (msg) => {
          setError(`${msg} — is the backend running on the configured API base?`);
          setStage("wizard");
        },
      },
    );
  }

  return (
    <div className="relative min-h-screen">
      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {stage === "landing" && (
            <Landing onGetStarted={() => setStage("wizard")} />
          )}

          {stage === "wizard" && (
            <div>
              {error && (
                <div className="mx-auto max-w-2xl px-6 pt-6">
                  <p className="rounded-[3px] border border-seal/40 bg-seal/5 p-3 text-sm text-seal">
                    {error}
                  </p>
                </div>
              )}
              <Wizard onComplete={runAnalysis} />
            </div>
          )}

          {stage === "processing" && (
            <Processing stage={progStage} label={progLabel} pct={progPct} />
          )}

          {stage === "reveal" && report && (
            <ScoreReveal report={report} onContinue={() => setStage("debate")} />
          )}

          {stage === "debate" && report && (
            <Debate report={report} onContinue={() => setStage("dashboard")} />
          )}

          {stage === "dashboard" && report && (
            <Dashboard
              report={report}
              onRestart={() => {
                setReport(null);
                setError(null);
                setStage("landing");
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
