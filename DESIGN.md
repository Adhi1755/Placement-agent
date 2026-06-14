# DESIGN.md — Placement Agent

> **Direction: "The Verdict" — Editorial Tribunal.**
> Once locked, this file is law. Deviations edit DESIGN.md first, then code.

## Aesthetic direction (the 3 words)
**Editorial · judicial · weighty.** A printed verdict from a hiring committee — broadsheet
dossier, not a SaaS dashboard. Every choice serves the metaphor of a credible ruling.

Traceable to purpose (Ch1–2): the product *is* a committee delivering a verdict (recruiter vs.
advocate vs. judge). A light, paper, serif, ink-on-stock register makes that verdict feel
authored and trustworthy — and deliberately rejects the cyan-on-dark · glass · gradient defaults.

## What this is NOT (anti-tells we are killing)
Dark-mode-by-default · cyan/teal accents · purple→blue gradients · glassmorphism panels ·
identical icon-above-heading card grids · everything centered · Geist/Inter as the safe font ·
neon glow. (See ai-tells.md.)

## Color tokens — "Navy Court" light scheme (WCAG-AA verified)

Navy seal on cream: blue carries trust + judicial authority (Ch9 cultural association) — the
natural register for a credible verdict. The accent token is named `--seal` (not a hue name) so
the palette can evolve without lying to future readers. Contrast ratios are vs. `--paper`.

```
/* Stock */
--paper:        #F1F0EA   /* page canvas — cool cream */
--surface:      #F8F7F1   /* raised stock (rare; editorial favors rules over cards) */
--sunken:       #E6E4DA   /* recessed wells (code blocks, transcript gutters) */

/* Ink (near-black, hue-shifted — never pure black) */
--ink:          #1A1A18   /* 15.3:1 — headings, body */
--ink-2:        #4D4D49   /* 7.4:1  — secondary text */
--ink-3:        #7E7E78   /* 3.6:1  — meta/labels (large only) */

/* Rules (decorative hairlines — intentionally subtle, not interactive) */
--rule:         #D8D6CC
--rule-strong:  #C1BEB1

/* Committed accent — the navy "verdict seal" (the ONE brand color) */
--seal:         #1E3A6E   /* 9.8:1; primary action, seals, emphasis */
--seal-deep:    #16294F   /* hover/active */

/* The two counsel — warm advances (prosecution), cool recedes (defense) (Ch9) */
--recruiter:    #8E3A22   /* warm oxblood ink — the skeptic, 6.6:1 */
--advocate:     #2E6B5E   /* cool teal-green ink — the defender, 5.4:1 */

/* Functional (tuned to the palette, not stock red/green/blue) */
--contested:    #8A5A12   /* ochre — warnings / contested verdict, 5.2:1 */
--affirmed:     #3C6238   /* muted green — success / strengths, 6.2:1 */
--negative:     #8E3A22   /* reuse oxblood ink — errors/negatives */
```

Depth comes from warm/cool ink relationships and ruled hairlines, NOT shadows or glass.
Shadows, where used, are warm and faint (`rgba(33,27,20,0.08)`), never pure black.

## Typography
- **Display / headings — Fraunces** (variable serif, optical display): the editorial "verdict"
  voice. High personality, authority. Tight leading, slight negative tracking on large sizes.
- **UI / body — Hanken Grotesk** (humanist grotesque): legible, characterful, left-aligned body.
  NOT Inter/Geist.
- **Data / scores** — Hanken Grotesk with `tabular-nums`; oversized score uses Fraunces display.

Type scale (modular ~1.25, body 16–17px):
```
Display  clamp(44px,6vw,76px) / Fraunces 600 / 1.02 / -0.02em
H1       36px / Fraunces 600 / 1.1  / -0.015em
H2       26px / Fraunces 600 / 1.2
H3       20px / Hanken 600   / 1.3
Body-L   18px / Hanken 400   / 1.6
Body     16px / Hanken 400   / 1.6
Small    14px / Hanken 400   / 1.5
Label    12px / Hanken 600   / 1.4 / 0.12em uppercase
```

## Composition (Ch6–7)
- **Left-aligned**, asymmetric. The landing hero anchors left, not centered.
- **Rules over cards.** Group with hairline rules + white-space rhythm; reserve bordered blocks
  for genuine containment (the verdict ruling, the rewrite).
- **One dominant element per view** (Ch6 dominance): hero headline; the score numeral; the
  verdict stamp.
- Debate = a **two-column transcript** split by a center rule, counsel labeled in their inks.
- Score = an **oversized Fraunces numeral** with a thin ruled meter — not a glowing ring.

## Memorable element (the fingerprint)
A letterpress-style **"VERDICT" stamp** (rotated, navy, slightly distressed border) on the
ruling — the one detail a generic AI wouldn't produce.

## Motion
Restrained, editorial. Entrances: opacity + small y, `ease-out`, 200–300ms. No bounce/elastic,
no glow pulses, no gradient sweeps. `prefers-reduced-motion` respected.
