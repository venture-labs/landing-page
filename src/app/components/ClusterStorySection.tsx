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

/** Round 5 variant A icon library (design/handoff/cluster-grafik/variant-a.html `<defs>`): 24×24
 * glyphs stroked in `currentColor`, so each `<use>` takes its colour from the wrapping `<g color>`.
 * Rendered once inside the graphic itself, so ids stay unique per page. */
function ClusterIconDefs() {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.5 } as const;
  const round = { strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <defs>
      <radialGradient id="cs-glow-blue" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#2b95f6" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#2b95f6" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="cs-glow-neutral" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="cs-glow-amber" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fda700" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#fda700" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="cs-glow-primary" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#8129ff" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#8129ff" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="cs-fill-blue" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#5db1ff" />
        <stop offset="100%" stopColor="#2b95f6" />
      </linearGradient>
      <linearGradient id="cs-fill-violet" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#a318f8" />
        <stop offset="100%" stopColor="#8129ff" />
      </linearGradient>
      <linearGradient id="cs-fill-amber" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffc861" />
        <stop offset="100%" stopColor="#fda700" />
      </linearGradient>
      <linearGradient id="cs-fill-neutral" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.55" />
      </linearGradient>
      <filter id="cs-soft-glow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="5" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      {(
        [
          ["arrow-handover", "#a318f8", 7],
          ["arrow-telemetry", "#d9aeff", 6],
          ["arrow-loop", "#2b95f6", 7],
        ] as const
      ).map(([id, fill, size]) => (
        <marker key={id} id={`cs-${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth={size} markerHeight={size} orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill={fill} />
        </marker>
      ))}

      <symbol id="cs-icon-video" viewBox="0 0 24 24">
        <rect x="2" y="6" width="13" height="12" rx="2.5" {...s} strokeWidth="1.6" />
        <circle cx="8.5" cy="12" r="2.1" {...s} strokeWidth="1.4" />
        <path d="M15 10.5l6-3.2v9.4l-6-3.2" {...s} strokeWidth="1.6" strokeLinejoin="round" />
      </symbol>
      <symbol id="cs-icon-chat" viewBox="0 0 24 24">
        <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5v8A2.5 2.5 0 0 1 18.5 16H10l-5 4v-4H5.5A2.5 2.5 0 0 1 3 13.5z" {...s} strokeLinejoin="round" />
        <path d="M7.5 8.5h9M7.5 11.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </symbol>
      <symbol id="cs-icon-mail" viewBox="0 0 24 24">
        <rect x="2.5" y="5" width="19" height="14" rx="2.5" {...s} />
        <path d="M3.5 6.5l8.5 7 8.5-7" {...s} strokeLinejoin="round" />
      </symbol>
      <symbol id="cs-icon-whatsapp" viewBox="0 0 24 24">
        <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3z" {...s} strokeLinejoin="round" />
        <path d="M8.3 9.6c-.3 1 .1 2.2 1 3.4 1 1.3 2.2 2 3.3 2.2.9.2 1.6-.1 1.9-.6l.3-.6-1.7-.9c-.2.3-.5.6-.9.5-.6-.1-1.4-.6-2-1.4-.5-.7-.8-1.4-.7-2 0-.4.4-.6.7-.8l-.6-1.7z" fill="currentColor" stroke="none" />
      </symbol>
      <symbol id="cs-icon-doc" viewBox="0 0 24 24">
        <path d="M6 2.5h8l4 4v14.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1z" {...s} strokeLinejoin="round" />
        <path d="M14 2.5V7h4" {...s} strokeLinejoin="round" />
        <path d="M8 12h8M8 15.3h8M8 18.6h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </symbol>
      <symbol id="cs-icon-check-badge" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9.5" {...s} strokeWidth="1.6" />
        <path d="M8 12.3l2.6 2.6 5.4-6" {...s} strokeWidth="1.8" {...round} />
      </symbol>
      <symbol id="cs-icon-coin" viewBox="0 0 24 24">
        <ellipse cx="12" cy="7" rx="7.5" ry="3.2" {...s} />
        <path d="M4.5 7v4.2c0 1.8 3.4 3.2 7.5 3.2s7.5-1.4 7.5-3.2V7" {...s} />
        <path d="M4.5 11.2v4.4c0 1.8 3.4 3.2 7.5 3.2s7.5-1.4 7.5-3.2v-4.4" {...s} />
      </symbol>
      <symbol id="cs-icon-people" viewBox="0 0 24 24">
        <circle cx="8.5" cy="8" r="3" {...s} />
        <circle cx="16.5" cy="9" r="2.4" {...s} />
        <path d="M3 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" {...s} strokeLinecap="round" />
        <path d="M14.5 14.8c2.3.3 4 2 4 4.7" {...s} strokeLinecap="round" />
      </symbol>
      <symbol id="cs-icon-monitor" viewBox="0 0 24 24">
        <rect x="2.5" y="4" width="19" height="13" rx="2" {...s} />
        <path d="M8.5 20.5h7M12 17v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6.5 8.5l3 3-3 3M13.5 14.5h3" {...s} strokeWidth="1.4" {...round} />
      </symbol>
      <symbol id="cs-icon-chip" viewBox="0 0 24 24">
        <rect x="6.5" y="6.5" width="11" height="11" rx="1.6" {...s} />
        <rect x="9.5" y="9.5" width="5" height="5" rx="0.8" {...s} strokeWidth="1.3" />
        <path d="M9 2.5v3M12 2.5v3M15 2.5v3M9 18.5v3M12 18.5v3M15 18.5v3M2.5 9h3M2.5 12h3M2.5 15h3M18.5 9h3M18.5 12h3M18.5 15h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </symbol>
      <symbol id="cs-icon-node" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="2.6" fill="currentColor" />
        <circle cx="12" cy="4.5" r="1.7" fill="currentColor" opacity="0.85" />
        <circle cx="19" cy="16.3" r="1.7" fill="currentColor" opacity="0.85" />
        <circle cx="5" cy="16.3" r="1.7" fill="currentColor" opacity="0.85" />
        <path d="M12 7.1V9.6M17.4 15L13.9 13M6.6 15L10.1 13" stroke="currentColor" strokeWidth="1.3" />
      </symbol>
    </defs>
  );
}

function Icon({ name, x, y, size, color }: { name: string; x: number; y: number; size: number; color: string }) {
  return (
    <g color={color}>
      <use href={`#cs-icon-${name}`} x={x} y={y} width={size} height={size} />
    </g>
  );
}

interface ClusterGraphicProps {
  revealed: number;
  active: number;
  reducedMotion: boolean;
  /** True only once `prefers-reduced-motion: no-preference` is confirmed on the client. */
  pulse: boolean;
  channelLabels: string[];
}

/** Opacity of a layer whose own step index is `stepIndex`: hidden until built, dimmed once the
 * story has moved past it, full while it is the active step. */
function layerOpacity(stepIndex: number, revealed: number, active: number): number {
  if (stepIndex > revealed - 1) return 0;
  return stepIndex === active ? 1 : 0.45;
}

const CHANNEL_BADGES = [
  { icon: "video", x: 40, w: 74 },
  { icon: "chat", x: 128, w: 56 },
  { icon: "mail", x: 198, w: 56 },
  { icon: "whatsapp", x: 268, w: 74 },
] as const;

const CHANNEL_PLANNED_INDEX = 3;

const AREA_TILES = [
  { key: "bookkeeping", icon: "coin", x: 514, y: 26, connector: [560, 80, 560, 64] },
  { key: "crm", icon: "people", x: 656, y: 150, connector: [650, 170, 656, 170] },
  { key: "apps", icon: "monitor", x: 514, y: 258, connector: [560, 260, 560, 258] },
  { key: "models", icon: "chip", x: 372, y: 150, connector: [470, 170, 464, 170] },
] as const;

/**
 * The one decorative, `aria-hidden` inline-SVG scene (round 5 variant A: icon tiles, gradient hubs,
 * soft glows). Cumulative: each layer fades in at its own step and stays; the readable text of
 * every step lives in the real-DOM step list next to it. The short labels drawn inside the SVG are
 * a visual aid only and are hidden below `md`, where they would render at an unreadable size.
 *
 * Geometry: one coordinate space for all nine steps. The client hub sits at x=560 from the start
 * (the design moves it from 630 to 560 at the growth step; keeping it fixed means no layer ever
 * has to re-route).
 */
function ClusterGraphic({ revealed, active, reducedMotion, pulse, channelLabels }: ClusterGraphicProps) {
  const { t } = useTranslation();
  const ourClusterOpacity = revealed > 0 ? 1 : 0; // never dims once built
  const clientSolid = revealed >= 5; // from step 5 (install) onward
  const growthSolid = revealed >= 9; // step 9 (service)
  const buildLineVisible = revealed >= 4 && revealed < 6; // replaced by the telemetry/update pair
  // Zero animation under reduced motion — every layer's opacity transition is disabled outright,
  // so a navigator jump (which changes `active`, not `revealed`) can never fade a layer.
  const tr = reducedMotion ? "none" : "opacity 0.4s ease";
  const label = (props: React.SVGProps<SVGTextElement>, text: string) => (
    <text className="cs-label" textAnchor="middle" {...props}>
      {text}
    </text>
  );

  return (
    <svg
      viewBox="0 0 760 320"
      aria-hidden="true"
      focusable="false"
      className="w-full h-[170px] lg:h-auto max-md:[&_.cs-label]:hidden"
    >
      <ClusterIconDefs />

      {/* our-cluster */}
      <g style={{ opacity: ourClusterOpacity, transition: tr }}>
        <circle cx="110" cy="170" r="58" fill="url(#cs-glow-blue)" />
        <circle cx="110" cy="170" r="46" fill="none" stroke="url(#cs-fill-blue)" strokeWidth="2" />
        <g filter="url(#cs-soft-glow)">
          <Icon name="node" x={98} y={158} size={24} color="#2b95f6" />
        </g>
        {label({ x: 110, y: 246, fill: "#9ca3af", fontSize: 11, letterSpacing: 0.5 }, t("leistungen.clusterStory.graphic.ours"))}
      </g>

      {/* input-channel badges (step 0) */}
      <g style={{ opacity: layerOpacity(0, revealed, active), transition: tr }}>
        {CHANNEL_BADGES.map((b, i) => {
          const planned = i === CHANNEL_PLANNED_INDEX;
          return (
            <g key={b.icon}>
              <rect
                x={b.x}
                y={10}
                width={b.w}
                height={46}
                rx={10}
                fill={planned ? "rgba(255,255,255,0.03)" : "#2b95f61f"}
                stroke={planned ? "rgba(255,255,255,0.3)" : "#2b95f6"}
                strokeWidth="1.2"
                strokeDasharray={planned ? "3 4" : undefined}
              />
              <Icon name={b.icon} x={b.x + b.w / 2 - 9} y={16} size={18} color={planned ? "rgba(255,255,255,0.6)" : "#2b95f6"} />
              {label(
                { x: b.x + b.w / 2, y: 68, fill: planned ? "rgba(255,255,255,0.55)" : "#2b95f6", fontSize: 10 },
                channelLabels[i] ?? ""
              )}
              {planned && (
                <>
                  <rect x={b.x + b.w / 2 - 25} y={72} width={50} height={14} rx={7} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="2 2" />
                  {label({ x: b.x + b.w / 2, y: 82, fill: "rgba(255,255,255,0.55)", fontSize: 8 }, t("leistungen.clusterStory.plannedChannelTag"))}
                </>
              )}
            </g>
          );
        })}
      </g>

      {/* concept (step 1) */}
      <g style={{ opacity: layerOpacity(1, revealed, active), transition: tr }}>
        <path d="M77 56 Q180 95 355 95" fill="none" stroke="#8129ff" strokeWidth="1" opacity="0.55" />
        <path d="M156 56 Q230 90 355 98" fill="none" stroke="#8129ff" strokeWidth="1" opacity="0.55" />
        <path d="M226 56 Q280 85 355 101" fill="none" stroke="#8129ff" strokeWidth="1" opacity="0.55" />
        <path d="M305 56 Q330 80 355 95" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="2 4" />
        <circle cx="390" cy="98" r="46" fill="url(#cs-glow-primary)" />
        <rect x="354" y="74" width="72" height="48" rx="12" fill="url(#cs-fill-violet)" fillOpacity="0.18" stroke="#8129ff" strokeWidth="1.4" />
        <g filter="url(#cs-soft-glow)">
          <Icon name="doc" x={378} y={86} size={24} color="#8129ff" />
        </g>
        {label({ x: 390, y: 138, fill: "#8129ff", fontSize: 12, fontWeight: 600 }, t("leistungen.clusterStory.graphic.concept"))}
      </g>

      {/* handover-arrow (step 2) */}
      <g style={{ opacity: layerOpacity(2, revealed, active), transition: tr }}>
        <path d="M365 122 Q260 165 158 168" fill="none" stroke="#a318f8" strokeWidth="2.2" markerEnd="url(#cs-arrow-handover)" />
        {label({ x: 260, y: 148, fill: "#a318f8", fontSize: 12, fontWeight: 600 }, t("leistungen.clusterStory.graphic.handover"))}
      </g>

      {/* agent chips inside our-cluster (step 3) */}
      <g style={{ opacity: layerOpacity(3, revealed, active), transition: tr }} color="#a318f8" filter="url(#cs-soft-glow)">
        <use href="#cs-icon-chip" x={99} y={149} width={11} height={11} />
        <use href="#cs-icon-chip" x={112} y={149} width={11} height={11} />
        <use href="#cs-icon-chip" x={105.5} y={161} width={11} height={11} />
      </g>

      {/* build line (steps 3-5), client-cluster (dashed until installed) */}
      <g style={{ opacity: ourClusterOpacity && revealed >= 4 ? 1 : 0, transition: tr }}>
        <g style={{ opacity: buildLineVisible ? 1 : 0, transition: tr }}>
          <line
            x1="156"
            y1="170"
            x2="516"
            y2="170"
            stroke={clientSolid ? "url(#cs-fill-violet)" : "#a318f8"}
            strokeWidth="2.2"
            strokeDasharray={clientSolid ? undefined : "3 6"}
          />
          {!clientSolid && label({ x: 336, y: 156, fill: "#a318f8", fontSize: 12, fontWeight: 600 }, t("leistungen.clusterStory.graphic.build"))}
        </g>
        <circle cx="560" cy="170" r="50" fill="url(#cs-glow-neutral)" opacity={clientSolid ? 1 : 0.6} />
        <circle
          cx="560"
          cy="170"
          r="44"
          fill="none"
          stroke={clientSolid ? "url(#cs-fill-neutral)" : "rgba(255,255,255,0.4)"}
          strokeWidth="1.6"
          strokeDasharray={clientSolid ? undefined : "4 5"}
        />
        <Icon name="node" x={548} y={158} size={24} color={clientSolid ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.55)"} />
        {label(
          { x: 560, y: 246, fill: "#9ca3af", fontSize: 11, letterSpacing: 0.5 },
          clientSolid ? t("leistungen.clusterStory.graphic.theirs") : t("leistungen.clusterStory.graphic.theirsBuilding")
        )}
      </g>

      {/* install badge (step 4) */}
      <g style={{ opacity: layerOpacity(4, revealed, active), transition: tr }}>
        <circle cx="560" cy="116" r="13" fill="#0e0d13" stroke="url(#cs-fill-violet)" strokeWidth="1.6" filter="url(#cs-soft-glow)" />
        <Icon name="check-badge" x={549} y={105} size={22} color="#a318f8" />
      </g>

      {/* telemetry-impulse + update-arrow (step 5) */}
      <g style={{ opacity: layerOpacity(5, revealed, active), transition: tr }}>
        <line x1="156" y1="140" x2="516" y2="140" stroke="#d9aeff" strokeWidth="2" markerStart="url(#cs-arrow-telemetry)" />
        <circle cx="336" cy="140" r="5" fill="#fff" filter="url(#cs-soft-glow)">
          {pulse && revealed >= 6 && (
            <animate attributeName="cx" values="516;180;516" dur="5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1" />
          )}
        </circle>
        {label({ x: 220, y: 124, fill: "#d9aeff", fontSize: 12, fontWeight: 600 }, t("leistungen.clusterStory.graphic.telemetry"))}
        <line x1="156" y1="200" x2="516" y2="200" stroke="#d9aeff" strokeWidth="1.6" strokeDasharray="3 5" markerEnd="url(#cs-arrow-telemetry)" />
        {label({ x: 460, y: 218, fill: "#d9aeff", fontSize: 12, fontWeight: 600 }, t("leistungen.clusterStory.graphic.updates"))}
      </g>

      {/* loop-arrow (step 6) */}
      <g style={{ opacity: layerOpacity(6, revealed, active), transition: tr }}>
        <path d="M330 140 C 300,70 350,75 388,96" fill="none" stroke="url(#cs-fill-blue)" strokeWidth="2.2" markerEnd="url(#cs-arrow-loop)" />
        {label({ x: 300, y: 108, fill: "#2b95f6", fontSize: 12, fontWeight: 600 }, t("leistungen.clusterStory.graphic.loop"))}
      </g>

      {/* growth-ring + area tiles (step 7) */}
      <g style={{ opacity: layerOpacity(7, revealed, active), transition: tr }}>
        <circle
          cx="560"
          cy="170"
          r="90"
          fill="none"
          stroke="url(#cs-fill-amber)"
          strokeWidth={growthSolid ? 1.8 : 1.6}
          strokeDasharray={growthSolid ? undefined : "4 6"}
        />
        {AREA_TILES.map((a, i) => (
          <g key={a.key}>
            <line x1={a.connector[0]} y1={a.connector[1]} x2={a.connector[2]} y2={a.connector[3]} stroke="#fda700" strokeWidth="1.2" />
            <rect x={a.x} y={a.y} width={92} height={38} rx={10} fill="#fda7001a" stroke="#fda700" strokeWidth="1.2" />
            <Icon name={a.icon} x={a.x + 7} y={a.y + 5} size={16} color="#fda700" />
            {label(
              { x: a.x + 50, y: a.y + 23, fill: "#fff", fontSize: 10.5, fontWeight: 600 },
              t(`leistungen.clusterStory.graphic.area.${a.key}`)
            )}
            {i === EXAMPLE_AREA_INDEX && (
              <>
                <rect x={a.x + 71} y={a.y - 14} width={52} height={13} rx={6.5} fill="#c7c4d1" />
                {label({ x: a.x + 97, y: a.y - 4.5, fill: "#1E1C27", fontSize: 7.5, fontWeight: 700 }, t("leistungen.exampleAgentLabel").toUpperCase())}
              </>
            )}
          </g>
        ))}
      </g>

      {/* final 100% state (step 8) */}
      <g style={{ opacity: layerOpacity(8, revealed, active), transition: tr }}>
        <circle cx="560" cy="170" r="98" fill="none" stroke="#8129ff" strokeWidth="1" opacity="0.25" />
        <circle cx="560" cy="170" r="22" fill="#0e0d13" filter="url(#cs-soft-glow)" />
        <text className="cs-label" x="560" y="176" textAnchor="middle" fill="#8129ff" fontSize="15" fontWeight="700">
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
            className="[grid-row:1] [grid-column:1] lg:[grid-row:auto] lg:[grid-column:auto] lg:sticky lg:top-28 top-24 sticky self-start z-10 rounded-2xl bg-[#14131b] p-4 md:p-6"
            style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }}
          >
            <ClusterGraphic
              revealed={revealed}
              active={active}
              reducedMotion={Boolean(reducedMotion)}
              pulse={reducedMotion === false}
              channelLabels={clusterStory.steps[0]?.channels?.map((c) => c.label) ?? []}
            />
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
      // Below lg the graphic is pinned at top-24 (96px) and is at most 218px tall (170px svg + md:p-6),
      // so its bottom edge is at 314px; the scroll margin keeps a navigator jump below it (review).
      className="flex flex-col gap-3 scroll-mt-[330px] lg:scroll-mt-28"
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
