import { useId, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useLeistungenData } from "@/data/content";
import { useLocale } from "@/app/locale";
import { CTAS, EVENTS, PLACEMENTS, trackEvent } from "@/app/analytics";
import type { CoreService } from "@/data/de/leistungen";

/**
 * Check · Build · Care (`#ablauf`), on /leistungen and the homepage.
 *
 * Rebuilt 2026-11-25 as a calm, scroll-driven module: a tall track with one
 * sticky panel. Scrolling through the track steps through the three phases;
 * the icon on the left builds itself up for each phase (? turns into !, three
 * blocks stack, two arrows close into a circle), the right column shows only
 * the phase's name, duration, keyword heading and one or two sentences. The
 * CTA under the text is the same for every phase: talk about the Pulse Check,
 * plus the deep link (or, on the homepage, the link to all services).
 *
 * All three phases' texts are always in the markup (inactive ones faded out,
 * not unmounted), so the prerendered HTML carries every step for search
 * engines. The step buttons scroll to their phase instead of switching state,
 * so scroll position and active phase never disagree.
 */

export const STEP_ACCENTS: Record<CoreService["key"], string> = {
  check: "#2b95f6",
  build: "#a318f8",
  care: "#fda700",
};

const EASE = [0.16, 1, 0.3, 1] as const;

/* ─── the three icons ─────────────────────────────────────────────────── */

/** A circle with the icon's full footprint: SVG groups rotate around their
    bounding box, so this keeps the pivot at the centre of the 200×200 box. */
const Pivot = () => <circle cx="100" cy="100" r="58" fill="none" stroke="none" />;

function UnderstandIcon({ accent, still }: { accent: string; still: boolean }) {
  const glyph = { fontSize: 136, fontWeight: 600, fill: accent } as const;
  return (
    <>
      {!still && (
        <motion.text
          x="100"
          y="148"
          textAnchor="middle"
          style={glyph}
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 0.6 }}
          transition={{ delay: 0.55, duration: 0.3, ease: EASE }}
        >
          ?
        </motion.text>
      )}
      <motion.text
        x="100"
        y="148"
        textAnchor="middle"
        style={glyph}
        initial={still ? false : { opacity: 0, scale: 1.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 260, damping: 14 }}
      >
        !
      </motion.text>
    </>
  );
}

const BLOCKS = [
  { x: 38, y: 124 },
  { x: 106, y: 124 },
  { x: 72, y: 70 },
];

function BuildIcon({ accent, still }: { accent: string; still: boolean }) {
  return (
    <>
      {BLOCKS.map((b, i) => (
        <motion.rect
          key={i}
          x={b.x}
          y={b.y}
          width="56"
          height="42"
          rx="8"
          fill={`${accent}26`}
          stroke={accent}
          strokeWidth="6"
          initial={still ? false : { y: -90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 + i * 0.3, type: "spring", stiffness: 320, damping: 18 }}
        />
      ))}
    </>
  );
}

function CareIcon({ accent, still }: { accent: string; still: boolean }) {
  const marker = useId().replace(/:/g, "");
  const arc = {
    fill: "none",
    stroke: accent,
    strokeWidth: 7,
    strokeLinecap: "round" as const,
    markerEnd: `url(#${marker})`,
  };
  return (
    <>
      <defs>
        <marker
          id={marker}
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M1.5 1.5 L7.5 5 L1.5 8.5"
            fill="none"
            stroke={accent}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
      {/* Two arcs, each ending in an arrow that points at the other arc's
          start: they swing in from opposite sides and close into a circle. */}
      <motion.g
        initial={still ? false : { rotate: -110, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.9, ease: EASE }}
      >
        <Pivot />
        <path d="M44.8 90.3 A56 56 0 0 1 152.6 80.8" {...arc} />
      </motion.g>
      <motion.g
        initial={still ? false : { rotate: 110, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.9, ease: EASE }}
      >
        <Pivot />
        <path d="M155.2 109.7 A56 56 0 0 1 47.4 119.2" {...arc} />
      </motion.g>
    </>
  );
}

function StepIcon({ stepKey, accent, still }: { stepKey: CoreService["key"]; accent: string; still: boolean }) {
  return (
    <motion.svg
      key={stepKey}
      viewBox="0 0 200 200"
      className="w-[62%] h-[62%] overflow-visible"
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.25 }}
    >
      {stepKey === "check" && <UnderstandIcon accent={accent} still={still} />}
      {stepKey === "build" && <BuildIcon accent={accent} still={still} />}
      {stepKey === "care" && <CareIcon accent={accent} still={still} />}
    </motion.svg>
  );
}

/* ─── section ────────────────────────────────────────────────────────── */

export function PulseJourney({ compact = false }: { compact?: boolean }) {
  const { coreEyebrow, coreHeading, coreIntro, coreServices } = useLeistungenData();
  const { localizedPath } = useLocale();
  const { t } = useTranslation();
  const reduceMotion = Boolean(useReducedMotion());

  const headRef = useRef(null);
  const headInView = useInView(headRef, { once: true, margin: "-80px" });
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  // 0 → 1 while the track scrolls past: its top at the viewport top until its
  // bottom at the viewport bottom. Each phase owns a third of that distance.
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const next = Math.min(coreServices.length - 1, Math.max(0, Math.floor(p * coreServices.length)));
    setIndex((current) => (current === next ? current : next));
  });

  function goTo(i: number) {
    const track = trackRef.current;
    if (!track) return;
    const top = window.scrollY + track.getBoundingClientRect().top;
    const distance = track.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: top + (distance * (i + 0.5)) / coreServices.length,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  const active = coreServices[index] ?? coreServices[0];
  const accent = STEP_ACCENTS[active.key];
  const check = coreServices.find((s) => s.key === "check") ?? coreServices[0];
  const secondary = compact
    ? { label: t("leistungen.allServices"), href: "/leistungen" }
    : check.linkLabel && check.linkHref
      ? { label: check.linkLabel, href: check.linkHref }
      : null;

  return (
    <section className="bg-[#181620] pt-24" id="ablauf">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.div
          ref={headRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-4 max-w-5xl"
        >
          {coreEyebrow && (
            <span
              className="font-semibold uppercase tracking-[0.16em] text-[#8129ff]"
              style={{ fontSize: "var(--text-small)" }}
            >
              {coreEyebrow}
            </span>
          )}
          <h2 className="font-semibold text-white leading-tight" style={{ fontSize: "var(--text-hero)" }}>
            {coreHeading}
          </h2>
          <p className="text-white/60 font-light leading-relaxed max-w-2xl" style={{ fontSize: "var(--text-body)" }}>
            {coreIntro}
          </p>
        </motion.div>
      </div>

      {/* The track: tall enough that each phase gets about half a screen of scrolling. */}
      <div ref={trackRef} className="relative" style={{ height: "250vh" }}>
        <div className="sticky top-20 lg:top-24 min-h-[calc(100vh-5rem)] lg:min-h-[calc(100vh-6rem)] flex items-center py-8">
          <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-8 lg:gap-20 items-center">
            {/* left: the icon and the phase rail */}
            <div className="flex flex-col gap-5 items-center lg:items-stretch">
              <div
                className="relative aspect-square w-40 sm:w-52 lg:w-full lg:max-w-[440px] rounded-[2rem] flex items-center justify-center transition-colors duration-500"
                style={{ backgroundColor: `${accent}14`, boxShadow: `inset 0 0 0 1px ${accent}40` }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <StepIcon key={active.key} stepKey={active.key} accent={accent} still={reduceMotion} />
                </AnimatePresence>
              </div>

              <ol className="grid grid-cols-3 gap-2 w-full lg:max-w-[440px]">
                {coreServices.map((step, i) => {
                  const on = i === index;
                  const stepAccent = STEP_ACCENTS[step.key];
                  return (
                    <li key={step.key}>
                      <button
                        type="button"
                        onClick={() => goTo(i)}
                        aria-current={on ? "step" : undefined}
                        className="w-full text-left pt-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white rounded-sm"
                        style={{ borderTop: `2px solid ${on ? stepAccent : "rgba(255,255,255,0.12)"}` }}
                      >
                        <span
                          className="block font-semibold uppercase tracking-[0.12em]"
                          style={{ fontSize: "var(--text-small)", color: on ? stepAccent : "rgba(255,255,255,0.35)" }}
                        >
                          {step.step}
                        </span>
                        <span
                          className="block font-semibold transition-colors"
                          style={{ fontSize: "var(--text-body)", color: on ? "#ffffff" : "rgba(255,255,255,0.5)" }}
                        >
                          {step.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* right: the phase's short text (all three in the DOM, stacked), then the fixed CTA */}
            <div className="flex flex-col gap-8">
              <div className="grid">
                {coreServices.map((step, i) => {
                  const on = i === index;
                  const stepAccent = STEP_ACCENTS[step.key];
                  return (
                    <div
                      key={step.key}
                      aria-hidden={!on}
                      className={`[grid-area:1/1] flex flex-col gap-4 transition-all duration-500 ${
                        on ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
                      }`}
                    >
                      <span
                        className="font-semibold uppercase tracking-[0.12em]"
                        style={{ fontSize: "var(--text-small)", color: stepAccent }}
                      >
                        {step.title} · {step.meta}
                      </span>
                      <h3
                        className="font-semibold text-white leading-tight"
                        style={{ fontSize: "var(--text-section)" }}
                      >
                        {step.tagline}
                      </h3>
                      <p
                        className="text-white/60 font-light leading-relaxed max-w-xl"
                        style={{ fontSize: "var(--text-body)" }}
                      >
                        {step.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  to={`${localizedPath("/kontakt")}?topic=check`}
                  onClick={() => trackEvent(EVENTS.contactSent, PLACEMENTS.pulseJourney, CTAS.contact)}
                  className="inline-flex items-center gap-2 font-semibold text-white rounded-lg px-6 py-3 transition-transform hover:scale-[1.02]"
                  style={{ fontSize: "var(--text-btn)", backgroundColor: STEP_ACCENTS.check }}
                >
                  {check.ctaLabel}
                  <ArrowRight size={16} />
                </Link>
                {secondary && (
                  <Link
                    to={localizedPath(secondary.href)}
                    className="inline-flex items-center gap-1.5 text-white/70 hover:text-white underline underline-offset-4 decoration-white/25 hover:decoration-white/60 transition-colors"
                    style={{ fontSize: "var(--text-body)" }}
                  >
                    {secondary.label}
                    <ArrowRight size={15} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
