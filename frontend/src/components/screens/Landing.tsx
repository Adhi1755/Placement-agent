"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button, Stamp, Rule } from "@/components/ui";

const STEPS = [
  {
    n: "01",
    title: "Submit the file",
    body: "Your résumé and the job description enter evidence. We read both in seconds.",
  },
  {
    n: "02",
    title: "Counsel argues",
    body: "A recruiter prosecutes the gaps; an advocate defends the strengths. On the record.",
  },
  {
    n: "03",
    title: "The verdict",
    body: "A readiness ruling, the contested points, and the plan to win the appeal.",
  },
];

const DIMENSIONS = [
  ["Technical", "Whether the stack on your résumé survives contact with the role's requirements."],
  ["Résumé quality", "Clarity, evidence, and whether your claims are backed by specifics."],
  ["Communication", "How well your projects and impact read to a reviewer in thirty seconds."],
  ["Domain knowledge", "Depth in the field the posting actually cares about — not adjacent ones."],
  ["Cultural fit", "Signals of how you'd land in this company's stage and team."],
];

const EXHIBITS = [
  {
    tag: "Exhibit A",
    title: "The debate, on the record",
    body: "Two agents argue your candidacy point by point — the recruiter pressing every unproven claim, the advocate answering with evidence from your file.",
    visual: "debate",
  },
  {
    tag: "Exhibit B",
    title: "A readiness verdict",
    body: "One number, defended. The committee weighs five dimensions and rules where you stand for this specific role — not a generic score.",
    visual: "verdict",
  },
  {
    tag: "Exhibit C",
    title: "Your résumé, revised",
    body: "An ATS-tailored rewrite with the keyword coverage measured before and after — so the lift is real, not asserted.",
    visual: "ats",
  },
  {
    tag: "Exhibit D",
    title: "The road to the appeal",
    body: "A skill-dependency map and a seven-day plan that orders what to learn first — prerequisites before payoffs.",
    visual: "plan",
  },
];

const FAQ = [
  ["Is this just an ATS score?", "No. The ATS coverage is one exhibit. The core is an adversarial reading of your whole profile against a specific posting, ending in a defended verdict and a plan."],
  ["What do I need to start?", "A résumé (PDF or pasted text) and the full job description. A target role and company type sharpen the ruling but are optional."],
  ["Does it make things up?", "The advocate argues only from what's in your file, and the ATS before/after is computed from real keyword coverage — not self-reported by the model."],
  ["How long does it take?", "Around a minute. You watch the committee convene in real time, then read the opinion."],
];

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Landing({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="min-h-screen">
      {/* Masthead */}
      <header className="sticky top-0 z-50 border-b border-ink/15 bg-paper/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="font-display text-lg font-semibold tracking-tight text-ink">
            Placement&nbsp;Agent
          </div>
          <nav className="flex items-center gap-6">
            <a href="#hearing" className="hidden text-sm text-ink-2 hover:text-ink sm:inline">
              How it works
            </a>
            <a href="#exhibits" className="hidden text-sm text-ink-2 hover:text-ink sm:inline">
              Exhibits
            </a>
            <a href="#faq" className="hidden text-sm text-ink-2 hover:text-ink sm:inline">
              FAQ
            </a>
            <Button size="sm" onClick={onGetStarted}>
              Get started
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-[1.15fr_0.85fr] md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-seal">
            The committee will see you now
          </p>
          <h1 className="font-display text-[clamp(2.75rem,6vw,4.75rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-ink">
            Know exactly where you stand before the interview does.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
            Two AI agents argue your profile like a real hiring committee — one
            prosecutes, one defends. A judge rules. You learn the truth while it
            still costs you nothing.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Button size="lg" onClick={onGetStarted}>
              Submit your case <ArrowRight className="h-4 w-4" />
            </Button>
            <a
              href="#hearing"
              className="text-sm font-medium text-ink underline decoration-rule-strong underline-offset-4 transition hover:decoration-ink"
            >
              See how it works
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-[4px] border border-rule-strong bg-surface p-6"
        >
          <div className="flex items-center justify-between rule-b pb-3">
            <span className="text-xs uppercase tracking-[0.16em] text-ink-3">
              Ruling · Case 2026-114
            </span>
            <span className="nums font-display text-3xl font-semibold text-ink">67</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-recruiter">
                Recruiter
              </p>
              <p className="text-ink-2">“No latency benchmarks on the RAG project.”</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-advocate">
                Advocate
              </p>
              <p className="text-ink-2">“The FastAPI stack matches the role exactly.”</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Stamp>Contested</Stamp>
          </div>
        </motion.div>
      </section>

      {/* The problem — editorial lead */}
      <section className="border-y border-rule bg-surface/50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <Reveal>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-seal">
              The problem
            </p>
            <h2 className="max-w-3xl font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-tight text-ink">
              Most candidates learn where they stood only after the rejection email.
            </h2>
            <div className="mt-6 grid max-w-4xl gap-8 text-ink-2 md:grid-cols-2">
              <p className="leading-relaxed">
                A résumé that feels strong to you can read as thin to a reviewer who
                has ninety seconds and a stack of two hundred. The gap between
                “I&apos;m qualified” and “they believe I&apos;m qualified” is invisible
                until it&apos;s too late to fix.
              </p>
              <p className="leading-relaxed">
                Placement Agent closes that gap before the application. It runs the
                argument a hiring committee would have about you — out loud, in
                writing — and hands you the transcript, the verdict, and the work.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* How the hearing works */}
      <section id="hearing" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-16">
        <Reveal>
          <Rule label="How the hearing works" className="mb-10" />
        </Reveal>
        <div className="divide-y divide-rule">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.08}>
              <div className="grid grid-cols-[auto_1fr] items-baseline gap-6 py-7 md:grid-cols-[5rem_1fr]">
                <span className="nums font-display text-4xl font-semibold text-seal md:text-5xl">
                  {s.n}
                </span>
                <div>
                  <h3 className="font-display text-xl font-semibold text-ink">{s.title}</h3>
                  <p className="mt-1.5 max-w-2xl text-ink-2">{s.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* What the committee weighs */}
      <section className="border-y border-rule bg-surface/50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <Reveal>
            <Rule label="What the committee weighs" className="mb-10" />
          </Reveal>
          <div className="grid gap-x-12 gap-y-7 md:grid-cols-2">
            {DIMENSIONS.map(([term, def], i) => (
              <Reveal key={term} delay={i * 0.06}>
                <div className="grid grid-cols-[1.5rem_1fr] gap-4 border-t border-rule pt-5">
                  <span className="nums text-sm text-seal">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink">{term}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-2">{def}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Exhibits — alternating asymmetric rows */}
      <section id="exhibits" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-16">
        <Reveal>
          <Rule label="Exhibits in every opinion" className="mb-12" />
        </Reveal>
        <div className="space-y-16">
          {EXHIBITS.map((ex, i) => {
            const flip = i % 2 === 1;
            return (
              <Reveal key={ex.tag}>
                <div className="grid items-center gap-8 md:grid-cols-2">
                  <div className={flip ? "md:order-2" : ""}>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-seal">
                      {ex.tag}
                    </p>
                    <h3 className="mt-2 font-display text-2xl font-semibold text-ink">
                      {ex.title}
                    </h3>
                    <p className="mt-2 max-w-md leading-relaxed text-ink-2">{ex.body}</p>
                  </div>
                  <div className={flip ? "md:order-1" : ""}>
                    <ExhibitVisual kind={ex.visual} />
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Sample ruling */}
      <section className="border-y border-rule bg-surface/50">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <Reveal>
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.16em] text-seal">
              From a sample opinion
            </p>
            <blockquote className="font-display text-[clamp(1.5rem,3vw,2.25rem)] font-medium leading-snug text-ink">
              “The candidate is competitive but not a lock. The strongest argument
              is a genuine production stack; the weakest is the absence of measured
              outcomes. Close the second and this becomes an offer.”
            </blockquote>
            <p className="mt-5 text-sm uppercase tracking-[0.14em] text-ink-3">
              — The committee, on a Machine Learning Engineer Intern case
            </p>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-6 py-16">
        <Reveal>
          <Rule label="On the record" className="mb-8" />
        </Reveal>
        <div className="divide-y divide-rule">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="font-display text-lg font-medium text-ink">{q}</span>
                <span className="font-display text-2xl text-seal transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-2xl leading-relaxed text-ink-2">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-ink/15">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-20 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-2xl font-display text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-tight text-ink">
            Argue your case before someone else gets to.
          </h2>
          <Button size="lg" onClick={onGetStarted}>
            Submit your case <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer / colophon */}
      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-base font-semibold text-ink-2">
            Placement Agent
          </span>
          <span>Set in Fraunces &amp; Hanken Grotesk · A hiring-committee simulator.</span>
        </div>
      </footer>
    </div>
  );
}

/* ── In-page exhibit visuals (honest, on-brand miniatures) ─────────────────── */

function ExhibitVisual({ kind }: { kind: string }) {
  const frame = "rounded-[4px] border border-rule-strong bg-surface p-5";

  if (kind === "debate") {
    return (
      <div className={frame}>
        <div className="grid grid-cols-2">
          <div className="pr-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-recruiter">
              Recruiter
            </p>
            <p className="text-sm text-ink-2">“Where are the latency numbers?”</p>
          </div>
          <div className="border-l border-rule pl-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-advocate">
              Advocate
            </p>
            <p className="text-sm text-ink-2">“End-to-end, deployed in Docker.”</p>
          </div>
        </div>
        <div className="mt-4 rule-t pt-3 text-[11px] uppercase tracking-wide text-ink-3">
          Exhibit · weight noted on both sides
        </div>
      </div>
    );
  }

  if (kind === "verdict") {
    return (
      <div className={frame}>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-ink-3">Readiness</p>
            <span className="nums font-display text-6xl font-semibold text-ink">67</span>
          </div>
          <Stamp>Ruling</Stamp>
        </div>
        <div className="mt-4 h-1.5 w-full rounded-full bg-sunken">
          <div className="h-full w-[67%] rounded-full bg-seal" />
        </div>
      </div>
    );
  }

  if (kind === "ats") {
    return (
      <div className={frame}>
        <p className="mb-3 text-xs uppercase tracking-[0.14em] text-ink-3">ATS keyword coverage</p>
        <div className="flex items-center gap-5">
          <div className="text-center">
            <div className="nums font-display text-3xl font-semibold text-seal">42</div>
            <div className="text-xs text-ink-3">before</div>
          </div>
          <ArrowRight className="h-5 w-5 text-ink-3" />
          <div className="text-center">
            <div className="nums font-display text-3xl font-semibold text-affirmed">68</div>
            <div className="text-xs text-ink-3">after</div>
          </div>
          <span className="nums text-sm font-medium text-affirmed">+26 pts</span>
        </div>
      </div>
    );
  }

  // plan / skill map
  return (
    <div className={frame}>
      <p className="mb-3 text-xs uppercase tracking-[0.14em] text-ink-3">Seven-day plan</p>
      <div className="space-y-2.5">
        {[
          ["W1", "Docker fundamentals"],
          ["W2", "Model serving & latency"],
          ["W3", "System design for ML"],
        ].map(([w, t]) => (
          <div key={w} className="flex items-baseline gap-3 border-t border-rule pt-2.5">
            <span className="font-display text-sm font-semibold text-seal">{w}</span>
            <span className="text-sm text-ink-2">{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
