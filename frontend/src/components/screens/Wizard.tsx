"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Check, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";

export interface WizardResult {
  file: File | null;
  resumeText: string;
  jdText: string;
  company: string;
  role: string;
  companyType: string;
}

const ROLES = ["ML Engineer", "SDE", "Data Scientist", "Product", "Data Analyst"];
const COMPANY_TYPES = ["FAANG/MAANG", "Startup", "Service Company", "Mid-size Product"];
const STEP_LABELS = ["Evidence", "The posting", "The bench"];

export default function Wizard({
  onComplete,
}: {
  onComplete: (r: WizardResult) => void;
}) {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [companyType, setCompanyType] = useState(COMPANY_TYPES[0]);
  const [dragOver, setDragOver] = useState(false);

  const step1Ok = pasteMode ? resumeText.trim().length > 30 : !!file;
  const step2Ok = jdText.trim().length > 30;

  const next = () => setStep((s) => Math.min(2, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const finish = () =>
    onComplete({ file: pasteMode ? null : file, resumeText, jdText, company, role, companyType });

  const field =
    "w-full rounded-[3px] border border-rule-strong bg-surface p-3 text-sm text-ink placeholder:text-ink-3 outline-none transition focus:border-seal";

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      {/* Stepper */}
      <div className="mb-10 flex items-center gap-3">
        {STEP_LABELS.map((label, i) => (
          <React.Fragment key={label}>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "nums flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold transition",
                  i < step
                    ? "border-seal bg-seal text-paper"
                    : i === step
                      ? "border-seal text-seal"
                      : "border-rule-strong text-ink-3",
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn("text-sm", i === step ? "text-ink" : "text-ink-3")}>
                {label}
              </span>
            </div>
            {i < 2 && <span className="h-px w-6 bg-rule-strong" />}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="s1"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="font-display text-3xl font-semibold text-ink">Enter your résumé into evidence</h2>
            <p className="mb-6 mt-1 text-ink-2">PDF or TXT works best.</p>

            {!pasteMode ? (
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) setFile(f);
                }}
                className={cn(
                  "flex h-56 cursor-pointer flex-col items-center justify-center rounded-[4px] border border-dashed transition",
                  dragOver ? "border-seal bg-seal/5" : "border-rule-strong bg-surface hover:border-ink",
                )}
              >
                <input
                  type="file"
                  accept=".pdf,.txt"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                {file ? (
                  <motion.div
                    initial={{ scale: 0.96, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-2 text-center"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-affirmed/40 text-affirmed">
                      <Check className="h-6 w-6" />
                    </div>
                    <span className="font-medium text-ink">{file.name}</span>
                    <span className="text-xs text-ink-3">Click to replace</span>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <UploadCloud className="h-9 w-9 text-ink-3" />
                    <p className="text-ink-2">Drop your PDF here, or click to browse</p>
                  </div>
                )}
              </label>
            ) : (
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={9}
                placeholder="Paste your résumé text…"
                className={field}
              />
            )}

            <button
              onClick={() => setPasteMode((p) => !p)}
              className="mt-3 text-sm font-medium text-seal underline decoration-rule-strong underline-offset-4 hover:decoration-seal"
            >
              {pasteMode ? "← Upload a file instead" : "Or paste plain text"}
            </button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="s2"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="font-display text-3xl font-semibold text-ink">The posting in question</h2>
            <p className="mb-6 mt-1 text-ink-2">The full job description you&apos;re applying for.</p>
            <div className="relative">
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                rows={10}
                placeholder="Paste the full job description here…"
                className={field}
              />
              <span className="nums absolute bottom-3 right-3 text-xs text-ink-3">
                {jdText.length} chars
              </span>
            </div>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company name (optional)"
              className={cn(field, "mt-3")}
            />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="s3"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="mb-6 font-display text-3xl font-semibold text-ink">Who&apos;s judging?</h2>

            <p className="mb-2 text-sm font-medium text-ink-2">Role</p>
            <div className="mb-6 flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <Pill key={r} active={role === r} onClick={() => setRole(r)}>
                  {r}
                </Pill>
              ))}
            </div>

            <p className="mb-2 text-sm font-medium text-ink-2">Company type</p>
            <div className="flex flex-wrap gap-2">
              {COMPANY_TYPES.map((c) => (
                <Pill key={c} active={companyType === c} onClick={() => setCompanyType(c)}>
                  {c}
                </Pill>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-10 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={back}
          className={step === 0 ? "pointer-events-none opacity-0" : ""}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {step < 2 ? (
          <Button onClick={next} disabled={(step === 0 && !step1Ok) || (step === 1 && !step2Ok)}>
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={finish}>
            Convene the committee <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-[3px] border px-4 py-2 text-sm transition",
        active
          ? "border-seal bg-seal/5 text-seal"
          : "border-rule-strong text-ink-2 hover:border-ink hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
