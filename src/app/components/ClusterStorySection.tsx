import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { useLeistungenData } from "@/data/content";
import type { ClusterStoryStep } from "@/data/de/leistungen";

/**
 * ClusterStorySection — VL-11-S1 (CONCEPT.md §S1, governing storyline, Christian 2026-10-19).
 *
 * One continuous, sticky inline-SVG graphic that builds up, layer by layer, as the reader
 * scrolls past the nine-step story next to it (desktop: side by side; mobile: the graphic
 * stays pinned to the top of the viewport, the text scrolls beneath it). Follows the gate-2
 * pick, `design/handoff/cluster-grafik/variant-a.html` — mapped onto this project's own
 * components and tokens, not copied as markup (per the screen-design skill's "Implementing").
 *
 * SSR-safe by construction (VL-10-S1 is live): the default render — used on the server, before
 * hydration, and forever under `prefers-reduced-motion: reduce` or with JS disabled — is already
 * the fully built end state of the graphic plus the complete ordered list of nine steps, with no
 * animation. `useReducedMotion()` (motion/react) is read only inside `useEffect`, which is also
 * where the only `window`/`IntersectionObserver` use lives; nothing here touches `window`,
 * `document` or `matchMedia` at module scope or during render. When motion is allowed, that same
 * effect starts the scroll-driven reveal: an `IntersectionObserver` marks the step whose text
 * block is passing the viewport as `active` (the dot/highlight that can move back and forth) and
 * raises `revealed` to `Math.max(revealed, activeIndex + 1)` — a value that can only grow, so a
 * layer that has been built never un-builds on scrolling back up.
 *
 * Keyboard: the step navigator below the graphic is nine real buttons (`aria-current="step"` on
 * the active one); activating one sets `active`/`revealed` directly, so no actual scrolling is
 * ever required to reach or read any step.
 *
 * Reusable scene geometry for the later explainer video (VL-11-D6) — the node/arrow vocabulary
 * this SVG draws, one part per name, and the theme.css token each is drawn in:
 *   our-cluster       — the left hub, Venture Labs' own cluster; visible from step 1, constant,
 *                        never dims — var(--blue), literal #2b95f6 (PulseJourney's own accent)
 *   input-channel     — the four channel badges feeding the concept node, step 1 — #2b95f6
 *   concept           — the document node, step 2 — var(--primary)
 *   handover-arrow    — the arrow from the concept node to our-cluster, step 3 —
 *                        var(--brand-violet-bright)
 *   agent             — the inner-ring dots inside our-cluster, step 4 — var(--brand-violet-bright)
 *   client-cluster    — the right hub, the client's own cluster; dashed/absent until step 4,
 *                        solid from step 5 — neutral rgba(255,255,255,.45) (their infrastructure)
 *   install           — the checkmark badge beside client-cluster, step 5 —
 *                        var(--brand-violet-bright)
 *   telemetry-impulse — the travelling dot on the upper our-cluster⇄client-cluster line, step 6 —
 *                        var(--brand-lavender)
 *   update-arrow      — the lower, dashed our-cluster→client-cluster line, step 6 —
 *                        var(--brand-lavender)
 *   loop-arrow        — the curved arrow from the telemetry line back to the concept node,
 *                        step 7 — #2b95f6
 *   growth-ring       — the outer ring around client-cluster, dashed in step 8, solid in step 9 —
 *                        var(--amber), literal #fda700
 *   area-tile         — the four growth-ring tiles, step 8 — #fda700
 */

const TOTAL_STEPS = 9;

/** One accent per step, in storyline order — the dot/active colour and the SVG layer colour. */
const STEP_ACCENTS = [
  "#2b95f6", // 0 input
  "#8129ff", // 1 concepts
  "#a318f8", // 2 handover
  "#a318f8", // 3 build
  "#a318f8", // 4 install
  "#d9aeff", // 5 telemetry
  "#2b95f6", // 6 loop
  "#fda700", // 7 growth
  "#8129ff", // 8 service
];

/** Index of the area that carries the "Beispiel"/"Example" Tap2Link tag (step 8's third tile). */
const EXAMPLE_AREA_INDEX = 2;

const ACTIVE_TEXT_DARK = "#0e0d13";
const ACTIVE_TEXT_LIGHT = "#ffffff";

/** WCAG relative luminance of a `#rrggbb` hex colour. */
function relLuminance(hex: string): number {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const toLinear = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG contrast ratio between two relative luminances. */
function contrastRatio(l1: number, l2: number): number {
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

const DARK_LUMINANCE = relLuminance(ACTIVE_TEXT_DARK);

/** The active step-navigator button's foreground: the fixed dark text (used elsewhere in this
 * component) fails 4.5:1 normal-text contrast on the darker/more saturated accents (Reviewer
 * finding, round 3 — e.g. #8129ff/#a318f8 sit at ~3.4–3.7:1 against #0e0d13); picking whichever
 * of the two fixed foregrounds clears 4.5:1 against the step's own accent keeps every active
 * button legible without a per-step hand-picked colour. */
function activeNavTextColor(accent: string): string {
  const accentLuminance = relLuminance(accent);
  return contrastRatio(accentLuminance, DARK_LUMINANCE) >= 4.5 ? ACTIVE_TEXT_DARK : ACTIVE_TEXT_LIGHT;
}

interface ClusterGraphicProps {
  revealed: number;
  active: number;
  reducedMotion: boolean;
}

/** Opacity of a layer whose own step index is `stepIndex`: hidden until built, dimmed once the
 * story has moved past it, full while it is the active step. */
function layerOpacity(stepIndex: number, revealed: number, active: number): number {
  if (stepIndex > revealed - 1) return 0;
  return stepIndex === active ? 1 : 0.45;
}

/**
 * The one decorative, `aria-hidden` inline-SVG scene. No text node carries any language — every
 * readable word lives in the real-DOM step list next to it (criterion 9), so this graphic alone
 * never needs a translation.
 */
function ClusterGraphic({ revealed, active, reducedMotion }: ClusterGraphicProps) {
  const ourClusterOpacity = revealed > 0 ? 1 : 0; // never dims once built
  const clientSolid = revealed >= 5; // from step 5 (install) onward
  const growthSolid = revealed >= 9; // step 9 (service)
  // Criterion 8: zero animation under reduced motion — every layer's opacity transition is
  // disabled outright, so a navigator jump (which changes `active`, not `revealed`) can never
  // fade a layer in or out.
  const opacityTransition = reducedMotion ? "none" : "opacity 0.4s ease";

  return (
    <svg
      viewBox="0 0 800 320"
      aria-hidden="true"
      focusable="false"
      className="w-full h-[170px] lg:h-auto"
    >
      {/* our-cluster */}
      <g style={{ opacity: ourClusterOpacity, transition: opacityTransition }}>
        <circle cx="110" cy="170" r="46" fill="none" stroke="#2b95f6" strokeWidth="1.5" />
        <circle cx="110" cy="170" r="3.5" fill="#2b95f6" />
      </g>

      {/* input-channel badges (step 0) */}
      <g style={{ opacity: layerOpacity(0, revealed, active), transition: opacityTransition }}>
        <rect x="40" y="14" width="68" height="36" rx="9" fill="#2b95f61f" stroke="#2b95f6" strokeWidth="1.2" />
        <rect x="118" y="14" width="56" height="36" rx="9" fill="#2b95f61f" stroke="#2b95f6" strokeWidth="1.2" />
        <rect x="186" y="14" width="56" height="36" rx="9" fill="#2b95f61f" stroke="#2b95f6" strokeWidth="1.2" />
        <rect
          x="254"
          y="14"
          width="68"
          height="36"
          rx="9"
          fill="rgba(255,255,255,0.03)"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.2"
          strokeDasharray="3 4"
        />
      </g>

      {/* concept (step 1) */}
      <g style={{ opacity: layerOpacity(1, revealed, active), transition: opacityTransition }}>
        <path d="M74 50 Q180 92 350 95" fill="none" stroke="#8129ff" strokeWidth="1" opacity="0.55" />
        <path d="M146 50 Q230 88 350 98" fill="none" stroke="#8129ff" strokeWidth="1" opacity="0.55" />
        <path d="M214 50 Q280 84 350 101" fill="none" stroke="#8129ff" strokeWidth="1" opacity="0.55" />
        <path
          d="M288 50 Q320 80 350 95"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1"
          strokeDasharray="2 4"
        />
        <rect x="350" y="74" width="70" height="46" rx="10" fill="#8129ff1f" stroke="#8129ff" strokeWidth="1.4" />
        <path d="M363 90h44M363 98h44M363 106h28" stroke="#8129ff" strokeWidth="1.6" strokeLinecap="round" />
      </g>

      {/* handover-arrow (step 2) */}
      <g style={{ opacity: layerOpacity(2, revealed, active), transition: opacityTransition }}>
        <defs>
          <marker id="cs-arrow-handover" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" fill="#a318f8" />
          </marker>
        </defs>
        <path d="M360 122 Q255 165 158 168" fill="none" stroke="#a318f8" strokeWidth="2" markerEnd="url(#cs-arrow-handover)" />
      </g>

      {/* agent dots + build line + client-cluster outline (step 3) */}
      <g style={{ opacity: layerOpacity(3, revealed, active), transition: opacityTransition }}>
        <circle cx="100" cy="160" r="3" fill="#a318f8" />
        <circle cx="120" cy="160" r="3" fill="#a318f8" />
        <circle cx="110" cy="178" r="3" fill="#a318f8" />
        <line
          x1="156"
          y1="170"
          x2="586"
          y2="170"
          stroke="#a318f8"
          strokeWidth="2"
          strokeDasharray={clientSolid ? undefined : "3 6"}
        />
        <circle
          cx="630"
          cy="170"
          r="42"
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="1.5"
          strokeDasharray={clientSolid ? undefined : "4 5"}
        />
        <circle cx="630" cy="170" r="3.5" fill="#fff" opacity="0.8" />
      </g>

      {/* install badge (step 4) */}
      <g style={{ opacity: layerOpacity(4, revealed, active), transition: opacityTransition }}>
        <circle cx="630" cy="116" r="11" fill="#0e0d13" stroke="#a318f8" strokeWidth="1.5" />
        <path d="M625 116l3.5 4 7-8.5" fill="none" stroke="#a318f8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* telemetry-impulse + update-arrow (step 5) */}
      <g style={{ opacity: layerOpacity(5, revealed, active), transition: opacityTransition }}>
        <defs>
          <marker id="cs-arrow-telemetry" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" fill="#d9aeff" />
          </marker>
          <marker id="cs-arrow-update" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" fill="#d9aeff" />
          </marker>
        </defs>
        <line x1="156" y1="140" x2="586" y2="140" stroke="#d9aeff" strokeWidth="2" markerStart="url(#cs-arrow-telemetry)" />
        <circle cx="386" cy="140" r="4" fill="#fff" />
        <line
          x1="156"
          y1="200"
          x2="586"
          y2="200"
          stroke="#d9aeff"
          strokeWidth="1.6"
          strokeDasharray="3 5"
          markerEnd="url(#cs-arrow-update)"
        />
      </g>

      {/* loop-arrow (step 6) */}
      <g style={{ opacity: layerOpacity(6, revealed, active), transition: opacityTransition }}>
        <defs>
          <marker id="cs-arrow-loop" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" fill="#2b95f6" />
          </marker>
        </defs>
        <path d="M330 140 C 300,70 350,75 388,96" fill="none" stroke="#2b95f6" strokeWidth="2" markerEnd="url(#cs-arrow-loop)" />
      </g>

      {/* growth-ring + area-tile (step 7) */}
      <g style={{ opacity: layerOpacity(7, revealed, active), transition: opacityTransition }}>
        <circle
          cx="630"
          cy="170"
          r="88"
          fill="none"
          stroke="#fda700"
          strokeWidth="1.6"
          strokeDasharray={growthSolid ? undefined : "4 6"}
        />
        <rect x="586" y="32" width="88" height="30" rx="8" fill="#fda7001a" stroke="#fda700" strokeWidth="1.2" />
        <rect x="690" y="156" width="88" height="30" rx="8" fill="#fda7001a" stroke="#fda700" strokeWidth="1.2" />
        <rect x="586" y="258" width="88" height="30" rx="8" fill="#fda7001a" stroke="#fda700" strokeWidth="1.2" />
        <rect x="482" y="156" width="88" height="30" rx="8" fill="#fda7001a" stroke="#fda700" strokeWidth="1.2" />
      </g>

      {/* final 100% state (step 8) */}
      <g style={{ opacity: layerOpacity(8, revealed, active), transition: opacityTransition }}>
        <text x="630" y="176" textAnchor="middle" fill="#8129ff" fontSize="16" fontWeight="700">
          100%
        </text>
      </g>
    </svg>
  );
}

export function ClusterStorySection() {
  const { t } = useTranslation();
  const { clusterStory } = useLeistungenData();
  const reducedMotion = useReducedMotion();

  // Default (server, pre-hydration, reduced-motion, no-JS): the fully built graphic.
  const [revealed, setRevealed] = useState(TOTAL_STEPS);
  const [active, setActive] = useState(TOTAL_STEPS - 1);

  const stepRefs = useRef<Array<HTMLLIElement | null>>([]);

  useEffect(() => {
    // Reduced motion (or matchMedia unavailable and treated as "no preference" by the hook, in
    // which case this simply never runs): stay on the fully built, static state above.
    if (reducedMotion) return;

    setRevealed(1);
    setActive(0);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const indexAttr = (entry.target as HTMLElement).dataset.stepIndex;
          if (indexAttr === undefined) continue;
          const index = Number(indexAttr);
          if (entry.isIntersecting) {
            setActive(index);
            setRevealed((prev) => Math.max(prev, index + 1));
          }
        }
      },
      { rootMargin: "-35% 0px -35% 0px", threshold: 0 }
    );

    for (const el of stepRefs.current) {
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [reducedMotion]);

  function jumpTo(index: number) {
    setActive(index);
    setRevealed((prev) => Math.max(prev, index + 1));
    stepRefs.current[index]?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  if (!clusterStory || clusterStory.steps.length === 0) return null;

  return (
    <section className="bg-[#0e0d13] py-24">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col gap-10">
        <div className="max-w-2xl flex flex-col gap-4">
          <h2
            id="cluster-story-heading"
            className="font-semibold text-white leading-tight"
            style={{ fontSize: "var(--text-section)" }}
          >
            {clusterStory.heading}
          </h2>
          <p
            className="text-white/60 font-light leading-relaxed"
            style={{ fontSize: "var(--text-body)" }}
          >
            {clusterStory.intro}
          </p>
        </div>

        <nav
          aria-label={t("leistungen.clusterStory.stepNavLabel")}
          className="flex flex-wrap gap-2"
        >
          {clusterStory.steps.map((step, index) => {
            const isActive = index === active;
            const accent = STEP_ACCENTS[index];
            return (
              <button
                key={step.id}
                type="button"
                aria-current={isActive ? "step" : undefined}
                onClick={() => jumpTo(index)}
                className="rounded-full px-4 py-2 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{
                  fontSize: "0.78rem",
                  backgroundColor: isActive ? accent : "rgba(255,255,255,0.04)",
                  color: isActive ? activeNavTextColor(accent) : "rgba(255,255,255,0.65)",
                  // Criterion 8: zero animation under reduced motion — the active/inactive
                  // colour swap must be instant, never a transition, in that mode.
                  transition: reducedMotion ? "none" : "background-color 0.2s ease, color 0.2s ease",
                }}
              >
                {index + 1} · {step.navLabel}
              </button>
            );
          })}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-16 items-start">
          <div
            // Reviewer finding (round 3): on the single-column layout (below `lg`) default grid
            // auto-placement gives this item its OWN row, sized to its own short content — the
            // sticky stage's containing block is then that short row, so it can never stay pinned
            // across the whole nine-step story. Forcing both this item and the `<ol>` below into
            // the SAME row (`grid-row: 1`) makes the shared row as tall as the `<ol>` (the taller
            // of the two), restoring a containing block that spans the whole story; `self-start`
            // keeps this item's own box small and pinned to the row's top instead of stretching.
            // Reviewer finding (round 4): fixing only `grid-row` left `grid-column` on `auto`, so
            // the auto-placement algorithm — finding column 1 of that row already taken by this
            // item — opened an IMPLICIT column 2 for the `<ol>` below instead of overlapping it in
            // column 1, putting the two side by side on mobile. Both items now also pin
            // `grid-column: 1` below `lg`, reset to `auto` at `lg` where the explicit 2-column
            // template already places them correctly (col 1 / col 2) without any override.
            className="[grid-row:1] [grid-column:1] lg:[grid-row:auto] lg:[grid-column:auto] lg:sticky lg:top-28 top-24 sticky self-start rounded-2xl bg-white/[0.015] p-4 md:p-6"
            style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }}
          >
            <ClusterGraphic revealed={revealed} active={active} reducedMotion={Boolean(reducedMotion)} />
          </div>

          <ol
            aria-label={clusterStory.heading}
            // Shares the sticky stage's row AND column (see the comments above) so that cell's
            // height follows the `<ol>`'s own (tall) content; `pt-[218px]` reserves exactly the
            // sticky stage's own rendered height below `lg` (170px graphic + up to 2×24px
            // `md:p-6` padding) so the first step's text never starts underneath it
            // (criterion 11).
            className="[grid-row:1] [grid-column:1] lg:[grid-row:auto] lg:[grid-column:auto] pt-[218px] lg:pt-0 flex flex-col gap-16 lg:gap-24"
          >
            {clusterStory.steps.map((step, index) => (
              <StoryStepItem
                key={step.id}
                step={step}
                index={index}
                total={TOTAL_STEPS}
                accent={STEP_ACCENTS[index]}
                setRef={(el) => {
                  stepRefs.current[index] = el;
                }}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function StoryStepItem({
  step,
  index,
  total,
  accent,
  setRef,
}: {
  step: ClusterStoryStep;
  index: number;
  total: number;
  accent: string;
  setRef: (el: HTMLLIElement | null) => void;
}) {
  const { t } = useTranslation();

  return (
    <li
      ref={setRef}
      data-step-index={index}
      className="flex flex-col gap-3 scroll-mt-28"
    >
      <span
        className="font-semibold uppercase tracking-[0.12em]"
        style={{ fontSize: "0.75rem", color: accent }}
      >
        {t("leistungen.clusterStory.stepOf", { current: index + 1, total })}
      </span>
      <h3
        className="font-semibold text-white leading-tight"
        style={{ fontSize: "var(--text-h2)" }}
      >
        {step.heading}
      </h3>
      <p
        className="text-white/65 font-light leading-relaxed max-w-xl"
        style={{ fontSize: "var(--text-body)" }}
      >
        {step.body}
      </p>

      {step.channels && (
        <div className="flex flex-wrap gap-2 mt-1">
          {step.channels.map((channel) => (
            <span
              key={channel.label}
              className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5 text-white/80"
              style={{ fontSize: "0.86rem" }}
            >
              {channel.label}
              {channel.status === "planned" && (
                <span
                  className="rounded-full font-bold uppercase tracking-wide px-2 py-0.5"
                  style={{
                    fontSize: "0.62rem",
                    background: "var(--brand-muted)",
                    color: "#1E1C27",
                  }}
                >
                  {t("leistungen.clusterStory.plannedChannelTag")}
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      {step.areas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
          {step.areas.map((area, areaIndex) => (
            <div
              key={area.label}
              className="flex items-center gap-2 flex-wrap rounded-xl bg-white/[0.03] px-3 py-2 text-white/78"
              style={{ fontSize: "0.88rem" }}
            >
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: "#fda700" }} aria-hidden />
              <span>{area.label}</span>
              {areaIndex === EXAMPLE_AREA_INDEX && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="font-semibold text-white/85">Tap2Link</span>
                  <span
                    className="rounded-full font-bold uppercase tracking-wide px-2 py-0.5"
                    style={{ fontSize: "0.6rem", background: "var(--brand-muted)", color: "#1E1C27" }}
                  >
                    {t("leistungen.exampleAgentLabel")}
                  </span>
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {step.billingNote && (
        <p className="font-medium text-white mt-1" style={{ fontSize: "1rem" }}>
          {step.billingNote}
        </p>
      )}
    </li>
  );
}
