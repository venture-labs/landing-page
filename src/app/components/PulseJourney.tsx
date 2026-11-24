import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
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
 * Everything is driven by ONE continuous progress value from 0 to 1, in one
 * of two modes:
 * - `mode="scroll"` (homepage): a tall track with one sticky panel; progress
 *   is the (lightly smoothed) scroll position, so scrolling forward draws the
 *   lines in and scrolling back retracts them, without jumps.
 * - `mode="auto"` (/leistungen): a normal-height block; progress runs on a
 *   clock (AUTO_CYCLE seconds for all three phases, looping) while the block
 *   is on screen, pauses while the pointer rests on it, and the rail buttons
 *   jump to a phase.
 * Each phase owns a third of the progress: its icon draws in, holds, and
 * retracts before the next
 * phase's icon draws (Verstehen: a ? that retracts and is redrawn as a !;
 * Bauen: three isometric blocks; Dranbleiben: two arrows closing into a
 * circle). The phase rail under the icon is a three-part progress bar that
 * fills with the same value. The right column shows the active phase's name,
 * duration, keyword heading and one or two sentences; the CTA under it is the
 * same for every phase (talk about the Pulse Check, plus the deep link, or on
 * the homepage the link to all services).
 *
 * All three phases' texts are always in the markup (inactive ones faded out,
 * not unmounted), so the prerendered HTML carries every step for search
 * engines. The rail buttons scroll to their phase.
 */

export const STEP_ACCENTS: Record<CoreService["key"], string> = {
  check: "#2b95f6",
  build: "#a318f8",
  care: "#fda700",
};

const STEPS = 3;
const STROKE = 6;

/* ─── scroll-scrubbed strokes ────────────────────────────────────────── */

/**
 * A window of the track, in the phase's own 0–1 time: the stroke draws in
 * between `inFrom` and `inTo` and retracts between `outFrom` and `outTo`
 * (omit those for the last phase, whose icon stays). Converted to the
 * track's global progress by the phase index.
 */
type DrawWindow = { inFrom: number; inTo: number; outFrom?: number; outTo?: number };

function Stroke({
  d,
  progress,
  phase,
  win,
  accent,
  fill,
  reduced,
  skipWhenReduced,
}: {
  d: string;
  progress: MotionValue<number>;
  phase: number;
  win: DrawWindow;
  accent: string;
  fill?: string;
  reduced: boolean;
  /** The ? of Verstehen: with reduced motion only the finished ! is shown. */
  skipWhenReduced?: boolean;
}) {
  const g = (t: number) => (phase + t) / STEPS;
  const input = win.outFrom !== undefined && win.outTo !== undefined
    ? [g(win.inFrom), g(win.inTo), g(win.outFrom), g(win.outTo)]
    : [g(win.inFrom), g(win.inTo)];
  const output = input.length === 4 ? [0, 1, 1, 0] : [0, 1];

  // With reduced motion there is no drawing: a phase's finished icon is
  // simply there while that phase is active.
  const drawn = useTransform(progress, (p) =>
    !skipWhenReduced && Math.min(STEPS - 1, Math.floor(p * STEPS)) === phase ? 1 : 0
  );
  const scrubbed = useTransform(progress, input, output, { clamp: true });
  const pathLength = reduced ? drawn : scrubbed;
  const opacity = useTransform(pathLength, (v) => (v > 0.002 ? 1 : 0));

  return (
    <motion.path
      d={d}
      fill={fill ?? "none"}
      fillOpacity={fill ? pathLength : undefined}
      stroke={accent}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ pathLength, opacity }}
    />
  );
}

/* Verstehen: a ? that retracts and is redrawn as a ! while you scroll. */
const QUESTION = [
  "M70 76 C70 54 86 42 102 42 C120 42 132 55 132 72 C132 90 116 96 107 104 C101 109 100 114 100 124",
  "M100 150 L100 151",
];
const EXCLAIM = ["M100 44 L100 122", "M100 150 L100 151"];

/* Bauen: three isometric blocks drawn as line art, back to front; each block's
   faces fill with the stage colour as it draws, so the front block hides the
   lines behind it like a solid object. */
const ISO = 0.866;
function cube(cx: number, cy: number, s: number): string {
  const pts = {
    top: [cx, cy - s],
    ur: [cx + ISO * s, cy - s / 2],
    lr: [cx + ISO * s, cy + s / 2],
    bottom: [cx, cy + s],
    ll: [cx - ISO * s, cy + s / 2],
    ul: [cx - ISO * s, cy - s / 2],
  };
  const p = (pt: number[]) => `${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`;
  return (
    `M${p(pts.top)} L${p(pts.ur)} L${p(pts.lr)} L${p(pts.bottom)} L${p(pts.ll)} L${p(pts.ul)} Z ` +
    `M${p(pts.ul)} L${cx} ${cy} L${p(pts.ur)} M${cx} ${cy} L${p(pts.bottom)}`
  );
}
const S = 34;
const CUBES = [
  cube(85, 109, S), // back
  cube(85, 109 - S, S), // on top of the back block
  cube(85 + ISO * S, 109 + S / 2, S), // front right
];

/** The stage colour behind the icon: the accent at 8 % over the section's #181620. */
function stageFill(accent: string): string {
  const n = parseInt(accent.slice(1), 16);
  const mix = (c: number, b: number) => Math.round(c * 0.08 + b * 0.92);
  return `rgb(${mix(n >> 16, 0x18)}, ${mix((n >> 8) & 255, 0x16)}, ${mix(n & 255, 0x20)})`;
}

/* Dranbleiben: two arcs drawing towards each other, each ending in an arrow
   head that points at the other arc's start, closing into one circle. */
const CYCLE = [
  "M44.8 90.3 A56 56 0 0 1 152.6 80.8 M141.1 72.8 L152.6 80.8 L156.2 67.3",
  "M155.2 109.7 A56 56 0 0 1 47.4 119.2 M58.9 127.2 L47.4 119.2 L43.8 132.7",
];

/**
 * Every stroke's window: the same draw-in / hold / retract rhythm for all
 * three icons. `loop` (auto mode) also retracts the last icon, so the cycle
 * can start over without a jump; in scroll mode the last icon stays.
 */
type StrokeSpec = { key: string; d: string; phase: number; win: DrawWindow; fill?: string; skipWhenReduced?: boolean };
function iconStrokes(loop: boolean): StrokeSpec[] {
  const out: StrokeSpec[] = [];
  QUESTION.forEach((d, i) =>
    out.push({
      key: `q${i}`,
      d,
      phase: 0,
      win: { inFrom: 0.02 + i * 0.12, inTo: 0.22 + i * 0.04, outFrom: 0.34, outTo: 0.44 },
      skipWhenReduced: true,
    })
  );
  EXCLAIM.forEach((d, i) =>
    out.push({ key: `e${i}`, d, phase: 0, win: { inFrom: 0.46 + i * 0.08, inTo: 0.6 + i * 0.03, outFrom: 0.86, outTo: 0.97 } })
  );
  CUBES.forEach((d, i) =>
    out.push({
      key: `c${i}`,
      d,
      phase: 1,
      win: { inFrom: 0.04 + i * 0.1, inTo: 0.3 + i * 0.1, outFrom: 0.86, outTo: 0.97 },
      fill: stageFill(STEP_ACCENTS.build),
    })
  );
  CYCLE.forEach((d, i) =>
    out.push({
      key: `a${i}`,
      d,
      phase: 2,
      win: loop
        ? { inFrom: 0.04 + i * 0.12, inTo: 0.36 + i * 0.12, outFrom: 0.86, outTo: 0.97 }
        : { inFrom: 0.04 + i * 0.12, inTo: 0.36 + i * 0.12 },
    })
  );
  return out;
}
const STROKES_SCROLL = iconStrokes(false);
const STROKES_LOOP = iconStrokes(true);
/** Auto mode: seconds for one pass through all three phases. */
const AUTO_CYCLE = 18;
const PHASE_KEYS: CoreService["key"][] = ["check", "build", "care"];

/* ─── progress rail ──────────────────────────────────────────────────── */

function RailBar({ progress, i, accent }: { progress: MotionValue<number>; i: number; accent: string }) {
  const scaleX = useTransform(progress, [i / STEPS, (i + 1) / STEPS], [0, 1], { clamp: true });
  return (
    <span className="block h-[2px] w-full rounded-full bg-white/12 overflow-hidden">
      <motion.span className="block h-full w-full origin-left" style={{ scaleX, backgroundColor: accent }} />
    </span>
  );
}

/* ─── section ────────────────────────────────────────────────────────── */

export function PulseJourney({
  compact = false,
  mode = "scroll",
}: {
  compact?: boolean;
  mode?: "scroll" | "auto";
}) {
  const auto = mode === "auto";
  const { coreEyebrow, coreHeading, coreIntro, coreServices } = useLeistungenData();
  const { localizedPath } = useLocale();
  const { t } = useTranslation();
  const reduceMotion = Boolean(useReducedMotion());

  const headRef = useRef(null);
  const headInView = useInView(headRef, { once: true, margin: "-80px" });
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  // Scroll mode: 0 → 1 while the track scrolls past (its top at the viewport
  // top until its bottom at the viewport bottom), lightly smoothed so wheel
  // steps glide.
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  const scrolled = useSpring(scrollYProgress, { stiffness: 170, damping: 32, restDelta: 0.0005 });

  // Auto mode: the same 0 → 1, on a clock. With reduced motion it does not
  // run; the rail buttons then switch between the finished icons.
  const clock = useMotionValue(reduceMotion ? 0.5 / STEPS : 0);
  const inView = useInView(trackRef, { margin: "-15% 0px -15% 0px" });
  const [paused, setPaused] = useState(false);
  const [restart, setRestart] = useState(0);
  useEffect(() => {
    if (!auto || reduceMotion || paused || !inView) return;
    let controls: ReturnType<typeof animate> | undefined;
    const run = () => {
      controls = animate(clock, 1, {
        duration: (1 - clock.get()) * AUTO_CYCLE,
        ease: "linear",
        onComplete: () => {
          clock.set(0);
          run();
        },
      });
    };
    run();
    return () => controls?.stop();
  }, [auto, reduceMotion, paused, inView, restart, clock]);

  const progress = auto ? clock : scrolled;
  const strokes = auto ? STROKES_LOOP : STROKES_SCROLL;
  useMotionValueEvent(progress, "change", (p) => {
    const next = Math.min(STEPS - 1, Math.max(0, Math.floor(p * STEPS)));
    setIndex((current) => (current === next ? current : next));
  });

  function goTo(i: number) {
    if (auto) {
      // jump(), not set(): it stops the running clock first, which would
      // otherwise write its own value back over this one when stopped.
      clock.jump(reduceMotion ? (i + 0.5) / STEPS : i / STEPS + 0.001);
      setRestart((n) => n + 1);
      return;
    }
    const track = trackRef.current;
    if (!track) return;
    const top = window.scrollY + track.getBoundingClientRect().top;
    const distance = track.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: top + (distance * (i + 0.5)) / STEPS,
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

      {/* Scroll mode: the track, tall enough that each phase gets about a full
          screen of scrolling, with the panel pinned inside. Auto mode: just the
          panel, pausing while the pointer rests on it. */}
      <div
        ref={trackRef}
        className="relative"
        style={auto ? undefined : { height: "400vh" }}
        onMouseEnter={auto ? () => setPaused(true) : undefined}
        onMouseLeave={auto ? () => setPaused(false) : undefined}
      >
        <div
          className={
            auto
              ? "flex items-center py-16 lg:py-24"
              : "sticky top-20 lg:top-24 min-h-[calc(100vh-5rem)] lg:min-h-[calc(100vh-6rem)] flex items-center py-8"
          }
        >
          <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-8 lg:gap-20 items-center">
            {/* left: the icon and the progress rail */}
            <div className="flex flex-col gap-5 items-center lg:items-stretch">
              <div
                className="relative aspect-square w-40 sm:w-52 lg:w-full lg:max-w-[440px] rounded-[2rem] flex items-center justify-center transition-colors duration-700"
                style={{ backgroundColor: `${accent}14`, boxShadow: `inset 0 0 0 1px ${accent}40` }}
              >
                <svg
                  viewBox="0 0 200 200"
                  className="w-[62%] h-[62%] overflow-visible transition-[filter] duration-700"
                  style={{ filter: `drop-shadow(0 0 14px ${accent}55)` }}
                  aria-hidden
                >
                  {PHASE_KEYS.map((key, phase) => (
                    <g key={key}>
                      {strokes.filter((s) => s.phase === phase).map((s) => (
                        <Stroke
                          key={s.key}
                          d={s.d}
                          progress={progress}
                          phase={phase}
                          win={s.win}
                          accent={STEP_ACCENTS[key]}
                          fill={s.fill}
                          reduced={reduceMotion}
                          skipWhenReduced={s.skipWhenReduced}
                        />
                      ))}
                    </g>
                  ))}
                </svg>
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
                        className="w-full text-left flex flex-col gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white rounded-sm"
                      >
                        <RailBar progress={progress} i={i} accent={stepAccent} />
                        <span>
                          <span
                            className="block font-semibold uppercase tracking-[0.12em] transition-colors"
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
