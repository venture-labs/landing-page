import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useLeistungenData } from "@/data/content";
import { useLocale } from "@/app/locale";
import { PulseCheckModal } from "@/app/components/PulseCheckModal";
import type { CoreService } from "@/data/de/leistungen";

export const STEP_ACCENTS: Record<CoreService["key"], string> = {
  check: "#2b95f6",
  build: "#a318f8",
  care: "#fda700",
};

/* ─── the pulse curve ────────────────────────────────────────────────────
   All three waveforms are sampled at the same x positions, so the path
   strings share a structure and motion can interpolate between them. */

const SAMPLES = 97;
const VIEW_W = 1200;
const BASELINE = 70;

/** `amplitude` is sampled on a fixed 0–48 scale, independent of SAMPLES. */
function buildPath(amplitude: (u: number) => number) {
  const points = Array.from({ length: SAMPLES }, (_, i) => {
    const progress = i / (SAMPLES - 1);
    const y = BASELINE - amplitude(progress * 48);
    return `${(progress * VIEW_W).toFixed(1)} ${y.toFixed(1)}`;
  });
  return `M ${points[0]} ${points.slice(1).map((p) => `L ${p}`).join(" ")}`;
}

/** Faint, irregular signal — something is happening, but nothing is legible yet. */
const CHECK_PATH = buildPath((u) => 5 * Math.sin(u * 1.7) + 3 * Math.sin(u * 0.55) + 2 * Math.sin(u * 3.1));

/** One decisive spike — the moment the lever gets pulled. */
const BUILD_PATH = buildPath((u) => {
  const spike = 58 * Math.exp(-((u - 26) ** 2) / 0.7);
  const dip = -20 * Math.exp(-((u - 24.2) ** 2) / 0.5);
  const undershoot = -14 * Math.exp(-((u - 27.8) ** 2) / 0.6);
  return spike + dip + undershoot + 2.5 * Math.sin(u * 0.9);
});

/** A steady, repeating rhythm — the system is alive and stays alive. */
const CARE_PATH = buildPath((u) => {
  const phase = u % 12;
  const beat = 30 * Math.exp(-((phase - 5) ** 2) / 0.5);
  const echo = -10 * Math.exp(-((phase - 3.4) ** 2) / 0.35);
  return beat + echo + 2 * Math.sin(u * 0.8);
});

const PATHS: Record<CoreService["key"], string> = {
  check: CHECK_PATH,
  build: BUILD_PATH,
  care: CARE_PATH,
};

function PulseCurve({ activeKey, accent }: { activeKey: CoreService["key"]; accent: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} 140`}
      preserveAspectRatio="none"
      className="w-full h-[110px] md:h-[140px] overflow-visible"
      aria-hidden
    >
      <defs>
        <linearGradient id="pulse-fade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={accent} stopOpacity="0" />
          <stop offset="0.15" stopColor={accent} stopOpacity="0.7" />
          <stop offset="0.85" stopColor={accent} stopOpacity="0.7" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>

      <line x1="0" y1={BASELINE} x2={VIEW_W} y2={BASELINE} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

      {/* every waveform is drawn; only the active one is faded in. The travelling
          beat rides along on a native SVG `pathLength` normalization (not
          motion's pathLength/pathOffset, which never animated reliably here) so
          the dash math stays a fixed 0 → -1000 regardless of path geometry. */}
      {(Object.keys(PATHS) as CoreService["key"][]).map((key) => (
        <motion.g
          key={key}
          animate={{ opacity: key === activeKey ? 1 : 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <path
            d={PATHS[key]}
            fill="none"
            stroke={STEP_ACCENTS[key]}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={0.3}
            vectorEffect="non-scaling-stroke"
          />
          {!reduceMotion && (
            <path
              d={PATHS[key]}
              pathLength={1000}
              fill="none"
              stroke="url(#pulse-fade)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="180 820"
              vectorEffect="non-scaling-stroke"
              className="pulse-curve-travel"
            />
          )}
        </motion.g>
      ))}
    </svg>
  );
}

/* ─── step rail ──────────────────────────────────────────────────────────── */

function StepRail({
  steps,
  activeKey,
  onSelect,
}: {
  steps: CoreService[];
  activeKey: CoreService["key"];
  onSelect: (key: CoreService["key"]) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4">
      {steps.map((step) => {
        const accent = STEP_ACCENTS[step.key];
        const active = step.key === activeKey;
        return (
          <button
            key={step.key}
            type="button"
            onClick={() => onSelect(step.key)}
            aria-pressed={active}
            className="group relative flex flex-col items-start gap-1 rounded-xl px-3 py-4 md:px-5 text-left transition-colors"
            style={{
              backgroundColor: active ? `${accent}1f` : "rgba(255,255,255,0.02)",
              boxShadow: `inset 0 0 0 1px ${active ? `${accent}59` : "rgba(255,255,255,0.07)"}`,
            }}
          >
            <span
              className="font-semibold uppercase tracking-[0.14em] transition-colors"
              style={{
                fontSize: "var(--text-small)",
                color: active ? accent : "rgba(255,255,255,0.4)",
              }}
            >
              {step.step} · {step.label}
            </span>
            <span
              className="font-semibold text-white leading-tight"
              style={{ fontSize: "var(--text-h3)" }}
            >
              {step.title}
            </span>
            {active && (
              <motion.span
                layoutId="pulse-step-underline"
                className="absolute left-3 right-3 md:left-5 md:right-5 bottom-2 h-[2px] rounded-full"
                style={{ backgroundColor: accent }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─── detail panel ───────────────────────────────────────────────────────── */

function StepDetail({
  step,
  accent,
  compact,
  onCheckCta,
}: {
  step: CoreService;
  accent: string;
  compact: boolean;
  onCheckCta: () => void;
}) {
  const { localizedPath } = useLocale();

  return (
    <motion.div
      key={step.key}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16"
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span
            className="px-3 py-1 rounded-full font-semibold uppercase tracking-[0.12em]"
            style={{ fontSize: "var(--text-small)", color: accent, backgroundColor: `${accent}1f` }}
          >
            {step.meta}
          </span>
        </div>
        <h3
          className="font-semibold text-white leading-tight"
          style={{ fontSize: "var(--text-section)" }}
        >
          {step.tagline}
        </h3>
        {!compact && (
          <p
            className="text-white/60 font-light leading-relaxed max-w-xl"
            style={{ fontSize: "var(--text-body)" }}
          >
            {step.description}
          </p>
        )}
        {!compact &&
          (step.key === "check" ? (
            <button
              type="button"
              onClick={onCheckCta}
              className="self-start inline-flex items-center gap-2 font-semibold text-white rounded-lg px-6 py-3 transition-transform hover:scale-[1.02]"
              style={{ fontSize: "var(--text-btn)", backgroundColor: accent }}
            >
              {step.ctaLabel}
              <ArrowRight size={16} />
            </button>
          ) : (
            <Link
              to={localizedPath("/kontakt")}
              className="self-start inline-flex items-center gap-2 font-semibold text-white rounded-lg px-6 py-3 transition-transform hover:scale-[1.02]"
              style={{ fontSize: "var(--text-btn)", backgroundColor: accent }}
            >
              {step.ctaLabel}
              <ArrowRight size={16} />
            </Link>
          ))}
      </div>

      {compact && (
        <div className="flex flex-col justify-center gap-5">
          <p
            className="text-white/60 font-light leading-relaxed max-w-xl"
            style={{ fontSize: "var(--text-body)" }}
          >
            {step.description}
          </p>
          {step.key === "check" ? (
            <button
              type="button"
              onClick={onCheckCta}
              className="self-start inline-flex items-center gap-2 font-semibold text-white rounded-lg px-6 py-3 transition-transform hover:scale-[1.02]"
              style={{ fontSize: "var(--text-btn)", backgroundColor: accent }}
            >
              {step.ctaLabel}
              <ArrowRight size={16} />
            </button>
          ) : (
            <Link
              to={localizedPath("/kontakt")}
              className="self-start inline-flex items-center gap-2 font-semibold text-white rounded-lg px-6 py-3 transition-transform hover:scale-[1.02]"
              style={{ fontSize: "var(--text-btn)", backgroundColor: accent }}
            >
              {step.ctaLabel}
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      )}

      {!compact && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Input", value: step.input },
              { label: "Output", value: step.output },
            ].map((row) => (
              <div
                key={row.label}
                className="flex flex-col gap-2 rounded-xl p-5 bg-white/[0.02]"
                style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)" }}
              >
                <span
                  className="font-semibold uppercase tracking-[0.14em] text-white/35"
                  style={{ fontSize: "var(--text-small)" }}
                >
                  {row.label}
                </span>
                <span
                  className="text-white/75 font-light leading-snug"
                  style={{ fontSize: "var(--text-body)" }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
          <ul className="flex flex-col gap-3">
            {step.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3">
                <Check size={15} strokeWidth={3} style={{ color: accent }} className="mt-1 shrink-0" />
                <span
                  className="text-white/70 font-light leading-snug"
                  style={{ fontSize: "var(--text-body)" }}
                >
                  {bullet}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

/* ─── section ────────────────────────────────────────────────────────────── */

export function PulseJourney({ compact = false }: { compact?: boolean }) {
  const { coreHeading, coreIntro, coreServices } = useLeistungenData();
  const { localizedPath } = useLocale();
  const { t } = useTranslation();
  const [activeKey, setActiveKey] = useState<CoreService["key"]>("check");
  const [quizOpen, setQuizOpen] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  // Scroll past the rail and the active step advances on its own — click
  // still works and simply overrides until the next scroll. Tracked against
  // the rail specifically (not the detail block below it): the detail's
  // height changes with every step, which would shift the scroll trigger
  // points themselves and make the mapping fight its own state changes.
  const scrollZoneRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: scrollZoneRef,
    offset: ["start 0.95", "start -0.85"],
  });
  const stepKeys = coreServices.map((s) => s.key);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v <= 0 || v >= 1 || stepKeys.length === 0) return;
    const index = Math.min(stepKeys.length - 1, Math.floor(v * stepKeys.length));
    const key = stepKeys[index];
    setActiveKey((prev) => (prev === key ? prev : key));
  });

  const active = coreServices.find((s) => s.key === activeKey) ?? coreServices[0];
  const accent = STEP_ACCENTS[activeKey];

  return (
    <section className="bg-[#181620] py-24 overflow-hidden" ref={ref} id="ablauf">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col gap-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 lg:gap-12"
        >
          <h2
            className="font-semibold text-white leading-tight"
            style={{ fontSize: "var(--text-hero)" }}
          >
            {coreHeading}
          </h2>
          <p
            className="text-white/60 font-light leading-relaxed max-w-md lg:text-right"
            style={{ fontSize: "var(--text-body)" }}
          >
            {coreIntro}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          <PulseCurve activeKey={activeKey} accent={accent} />
        </motion.div>

        <div className="flex flex-col gap-12">
          <div ref={scrollZoneRef}>
            <StepRail steps={coreServices} activeKey={activeKey} onSelect={setActiveKey} />
          </div>

          <AnimatePresence mode="wait">
            <StepDetail
              key={active.key}
              step={active}
              accent={accent}
              compact={compact}
              onCheckCta={() => setQuizOpen(true)}
            />
          </AnimatePresence>

          {compact && (
            <Link
              to={localizedPath("/leistungen")}
              className="self-start inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
              style={{ fontSize: "var(--text-body)" }}
            >
              {t("leistungen.allServices")}
              <ArrowRight size={15} />
            </Link>
          )}
        </div>
      </div>

      <PulseCheckModal open={quizOpen} onOpenChange={setQuizOpen} />
    </section>
  );
}
