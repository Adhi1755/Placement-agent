// Shared primitives — "The Verdict" editorial tribunal register.
import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

// ── Button ───────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  // Oxblood seal — the committed action.
  primary: "bg-seal text-paper hover:bg-seal-deep",
  // Ruled ink outline — supporting action.
  secondary: "border border-ink/40 text-ink hover:border-ink hover:bg-ink/5",
  ghost: "text-ink-2 hover:text-ink",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-7 text-base gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-[3px] font-semibold transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-40",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

// ── Block (editorial container — ruled, not glass) ───────────────────────────

export function Block({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[4px] border border-rule-strong bg-surface p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

// Section kicker — small uppercase label over a topic.
export function Kicker({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-seal",
        className,
      )}
    >
      {children}
    </p>
  );
}

// Hairline divider, optionally with a heading sitting on the rule (masthead style).
export function Rule({ label, className }: { label?: string; className?: string }) {
  if (!label) return <hr className={cn("border-0 border-t border-rule", className)} />;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-3">
        {label}
      </span>
      <span className="h-px flex-1 bg-rule" />
    </div>
  );
}

// ── Badge ────────────────────────────────────────────────────────────────────

type Tone = "ink" | "seal" | "recruiter" | "advocate" | "affirmed" | "contested";

const TONES: Record<Tone, string> = {
  ink: "border-rule-strong text-ink-2",
  seal: "border-seal/40 text-seal",
  recruiter: "border-recruiter/40 text-recruiter",
  advocate: "border-advocate/40 text-advocate",
  affirmed: "border-affirmed/40 text-affirmed",
  contested: "border-contested/40 text-contested",
};

export function Badge({
  children,
  tone = "ink",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[3px] border bg-transparent px-2 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// The letterpress verdict stamp — the design's fingerprint.
export function Stamp({ children }: { children: React.ReactNode }) {
  return <span className="stamp">{children}</span>;
}

// ── ScoreNumeral (typographic, not a glowing ring) ───────────────────────────

export function ScoreNumeral({
  value,
  size = "lg",
}: {
  value: number; // 0..1
  size?: "sm" | "lg";
}) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="flex items-baseline gap-1">
      <span
        className={cn(
          "nums font-display font-semibold leading-none text-ink",
          size === "lg" ? "text-6xl" : "text-3xl",
        )}
      >
        {pct}
      </span>
      <span className="text-sm text-ink-3">/100</span>
    </div>
  );
}

// Thin ruled meter — replaces progress rings/bars.
export function Meter({ value, tone = "seal" }: { value: number; tone?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="h-1.5 w-full rounded-full bg-sunken">
      <div
        className="h-full rounded-full"
        style={{ width: `${pct}%`, background: `var(--color-${tone})` }}
      />
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-ink-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </span>
  );
}
