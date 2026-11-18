import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { ArrowRight, ArrowUpRight, Check, ChevronDown } from "lucide-react";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import { PulseJourney } from "@/app/components/PulseJourney";
import { PulseCheckModal } from "@/app/components/PulseCheckModal";
import { CtaButton } from "@/app/components/ui/CtaButton";
import { useCasesData, useLeistungenData } from "@/data/content";
import { useLocale } from "@/app/locale";
import { BOOKING_URL } from "@/app/links";
import { CTAS, EVENTS, PLACEMENTS, trackEvent } from "@/app/analytics";

/**
 * /:lang/start-neu — alternative homepage draft (branch feature/startseite-ki-nutzen).
 *
 * Focus: the mittelstand, and what an AI agent cluster takes off its plate. Order:
 *   1. ScrollIntro   — pinned, scroll-driven intro (~5 s of normal scrolling): routine → agents → cluster → why VL
 *   2. OutcomeAgents — five agents from the Leistungen use cases, led by the outcome
 *   3. WhyUs         — why Venture Labs can build them
 *   4. PulseJourney  — Check · Build · Care (shared component)
 *   5. CaseStrip     — Tap2Link, Brylliant, Moerschen
 *   6. PulseFinal    — "Wo stehst du?": Pulse Score + Erstgespräch
 *
 * Agent names, problems and capabilities come from content/site/leistungen.md (`situations`), cases from
 * content/cases — only the outcome lines and the intro copy live here (COPY_DE / COPY_EN). Noindex, not in the
 * nav or sitemap.
 *
 * SSR-safe: the server and the first client render show the intro's opening frame; scroll progress and
 * reduced motion are only read on the client. Under prefers-reduced-motion the intro renders as a plain,
 * unpinned section with its final content.
 */

const PURPLE = "#8129ff";
const BLUE = "#2b95f6";
const VIOLET = "#a318f8";
const AMBER = "#fda700";

/** The five agents the page leads with, in this order; ids from leistungen.md `situations`. */
const FEATURED_AGENTS = [
  { id: "receipts", accent: BLUE, live: true },
  { id: "invoice-coverage", accent: VIOLET, live: false },
  { id: "tool-fatigue", accent: AMBER, live: false },
  { id: "prioritization", accent: PURPLE, live: false },
  { id: "neglected-tool", accent: BLUE, live: false },
] as const;

/** The cases the page shows, in this order. */
const CASE_SLUGS = ["tap2link", "brylliant", "moerschen"] as const;

const COPY_DE = {
  intro: {
    routineHeadline: "Belege abtippen. Rechnungen suchen. Fristen im Kopf behalten.",
    routineSub: "So sieht der Alltag in vielen Unternehmen aus. Jede Woche, in jedem Team.",
    routines: [
      "Beleg fehlt",
      "Rechnung zuordnen",
      "Angebot schreiben",
      "Frist prüfen",
      "Termin eintragen",
      "Mahnung vorbereiten",
      "Excel abgleichen",
      "Tool pflegen",
    ],
    agentsCaption: "Jede Routine bekommt einen KI-Agenten.",
    clusterCaption: "Zusammen werden sie ein Cluster, der mit deinem Unternehmen wächst.",
    center: "Dein Unternehmen",
    whyHeading: "Und warum mit uns?",
    whyPoints: [
      "Business, Design, Engineering und KI in einem Team.",
      "Live im Alltag deines Teams, in Wochen statt Quartalen.",
      "Wir betreiben selbst Agenten: Unsere Beleg-Inbox läuft produktiv.",
    ],
    finalHeadline: "KI, die im Mittelstand wirklich mitarbeitet.",
    finalHighlight: "wirklich",
    finalSub: "Wir bauen dir einen Cluster aus KI-Agenten, der die Routine übernimmt, damit dein Team sich um das Geschäft kümmern kann.",
    ctaQuiz: "Kostenlosen Pulse Score starten",
    ctaMore: "Was KI übernehmen kann",
    scrollHint: "Scrollen",
  },
  outcomes: {
    eyebrow: "Nutzen",
    heading: "Was KI in deinem Unternehmen übernimmt.",
    intro:
      "Fünf Beispiele aus dem Alltag im Mittelstand. Jedes beginnt mit einem Satz, den wir in Erstgesprächen so oder ähnlich hören.",
    liveBadge: "Läuft bei uns produktiv",
    byId: {
      receipts: "Monatsabschluss ohne Belegsuche.",
      "invoice-coverage": "Jedes Projekt vollständig abgerechnet.",
      "tool-fatigue": "Aus dem Konzept wird gelebter Alltag.",
      prioritization: "Ein klarer erster Schritt statt Buzzword-Bingo.",
      "neglected-tool": "Tools, die nach dem Launch nicht verwaisen.",
    } as Record<string, string>,
    allLink: "Alle Use Cases ansehen",
  },
  why: {
    eyebrow: "Warum Venture Labs",
    heading: "Wir bauen KI-Agenten, die im Betrieb bestehen.",
    points: [
      {
        title: "Ein Team, alle Disziplinen",
        body: "Business, Design, Engineering und KI an einem Tisch. Kein Weiterreichen zwischen Beratung, Agentur und Entwicklern.",
      },
      {
        title: "Produktiv statt Prototyp",
        body: "Fester Umfang, feste Ansprechperson, live im Alltag deines Teams. Übergabe inklusive, damit dein Team damit arbeiten kann.",
      },
      {
        title: "Wir nutzen es selbst",
        body: "Unsere eigene Beleg-Inbox läuft heute im Produktivbetrieb. Wir empfehlen nur, was wir selbst im Einsatz verstehen.",
      },
      {
        title: "Deine Daten bleiben bei dir",
        body: "Zu uns kommen nur Laufzeit, Fehler und Kosten. Lokale Modelle setzen wir ein, wo immer es möglich ist.",
      },
    ],
    clusterLink: "So entsteht dein Cluster",
  },
  cases: {
    eyebrow: "Cases",
    heading: "Digitale Produkte, die wir gebaut haben.",
    allLink: "Alle Cases",
    caseLink: "Case ansehen",
  },
  final: {
    eyebrow: "Pulse Score",
    heading: "Wo stehst du mit KI?",
    body: "Der Pulse Score dauert fünf Minuten und kostet nichts: 10 Fragen, sofort ein Ergebnis über fünf Bereiche. Danach klären wir im kostenlosen Erstgespräch, wo dein Cluster beginnen kann.",
    ctaQuiz: "Pulse Score starten",
    ctaCall: "Erstgespräch buchen",
  },
};

type Copy = typeof COPY_DE;

const COPY_EN: Copy = {
  intro: {
    routineHeadline: "Typing up receipts. Chasing invoices. Keeping deadlines in your head.",
    routineSub: "That is what everyday work looks like in many companies. Every week, in every team.",
    routines: [
      "Receipt missing",
      "Match the invoice",
      "Write the quote",
      "Check the deadline",
      "Enter the appointment",
      "Prepare the reminder",
      "Reconcile the spreadsheet",
      "Maintain the tool",
    ],
    agentsCaption: "Every routine gets its own AI agent.",
    clusterCaption: "Together they become a cluster that grows with your company.",
    center: "Your company",
    whyHeading: "And why with us?",
    whyPoints: [
      "Business, design, engineering and AI in one team.",
      "Live in your team's daily work, in weeks rather than quarters.",
      "We run agents ourselves: our receipt inbox is in production.",
    ],
    finalHeadline: "AI that really works for mid-sized companies.",
    finalHighlight: "really",
    finalSub: "We build you a cluster of AI agents that takes over the routine, so your team can focus on the business.",
    ctaQuiz: "Start the free Pulse Score",
    ctaMore: "What AI can take over",
    scrollHint: "Scroll",
  },
  outcomes: {
    eyebrow: "Benefit",
    heading: "What AI takes over in your company.",
    intro:
      "Five examples from everyday work in mid-sized companies. Each one starts with a sentence we hear, in some form, in first conversations.",
    liveBadge: "Running in production at our company",
    byId: {
      receipts: "Month-end closing without hunting for receipts.",
      "invoice-coverage": "Every project fully invoiced.",
      "tool-fatigue": "The concept turns into everyday practice.",
      prioritization: "A clear first step instead of buzzword bingo.",
      "neglected-tool": "Tools that are not abandoned after launch.",
    },
    allLink: "See all use cases",
  },
  why: {
    eyebrow: "Why Venture Labs",
    heading: "We build AI agents that hold up in daily operations.",
    points: [
      {
        title: "One team, every discipline",
        body: "Business, design, engineering and AI at one table. No handing work back and forth between consultancy, agency and developers.",
      },
      {
        title: "Production, not prototype",
        body: "Fixed scope, a fixed contact person, live in your team's daily work. Handover included, so your team can work with it.",
      },
      {
        title: "We use it ourselves",
        body: "Our own receipt inbox runs in production today. We only recommend what we understand from running it ourselves.",
      },
      {
        title: "Your data stays with you",
        body: "All we receive is runtime, errors and cost. We use local models wherever possible.",
      },
    ],
    clusterLink: "How your cluster comes together",
  },
  cases: {
    eyebrow: "Cases",
    heading: "Digital products we have built.",
    allLink: "All cases",
    caseLink: "View case",
  },
  final: {
    eyebrow: "Pulse Score",
    heading: "Where do you stand with AI?",
    body: "The Pulse Score takes five minutes and costs nothing: 10 questions, an instant result across five areas. Afterwards, in a free first call, we work out where your cluster can start.",
    ctaQuiz: "Start the Pulse Score",
    ctaCall: "Book a first call",
  },
};

function useCopy(): Copy {
  return useLocale().lang === "en" ? COPY_EN : COPY_DE;
}

/* ------------------------------------------------------------------ */
/* 1. Scroll intro                                                     */
/* ------------------------------------------------------------------ */

/**
 * Piecewise-linear map of the scroll progress, as a function transform. A function transform keeps motion
 * from handing the value to a native ScrollTimeline animation, which mis-maps multi-keyframe opacity ranges.
 */
function useMap(p: MotionValue<number>, input: number[], output: number[]) {
  return useTransform(p, (v) => {
    if (v <= input[0]) return output[0];
    for (let i = 1; i < input.length; i++) {
      if (v <= input[i]) {
        const t = (v - input[i - 1]) / (input[i] - input[i - 1]);
        return output[i - 1] + t * (output[i] - output[i - 1]);
      }
    }
    return output[output.length - 1];
  });
}

/** Opacity window: 0 before `a`, fades in to `b`, holds to `c`, fades out to `d`. */
function useWindow(p: MotionValue<number>, a: number, b: number, c: number, d: number) {
  return useMap(p, [a, b, c, d], [0, 1, 1, 0]);
}

/** Positions of the eight routine chips in the opening frame, in % of the stage. */
const ROUTINE_POS = [
  { x: 14, y: 22 },
  { x: 72, y: 16 },
  { x: 84, y: 46 },
  { x: 8, y: 54 },
  { x: 26, y: 80 },
  { x: 70, y: 78 },
  { x: 46, y: 10 },
  { x: 52, y: 88 },
];

function RoutineChip({ p, label, x, y, i }: { p: MotionValue<number>; label: string; x: number; y: number; i: number }) {
  // Chips drift towards the centre and vanish as the agents take over.
  const left = useTransform(p, [0, 0.22], [`${x}%`, "50%"]);
  const top = useTransform(p, [0, 0.22], [`${y}%`, "50%"]);
  const opacity = useMap(p, [0, 0.14, 0.22], [1, 0.8, 0]);
  const scale = useMap(p, [0, 0.22], [1, 0.4]);
  return (
    <motion.span
      style={{ left, top, opacity, scale, x: "-50%", y: "-50%" }}
      className="absolute whitespace-nowrap rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-white/70 font-light backdrop-blur-sm"
    >
      <motion.span
        className="inline-block"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3 + (i % 3), repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
        style={{ fontSize: "var(--text-small)" }}
      >
        {label}
      </motion.span>
    </motion.span>
  );
}

/** One agent node on the ring, plus its connector line to the centre. */
function AgentNode({
  p,
  name,
  accent,
  angle,
  i,
}: {
  p: MotionValue<number>;
  name: string;
  accent: string;
  angle: number;
  i: number;
}) {
  const start = 0.2 + i * 0.035;
  const opacity = useMap(p, [start, start + 0.06], [0, 1]);
  const scale = useMap(p, [start, start + 0.06, 0.45, 0.55], [0.6, 1, 1, 1.06]);
  const pathLength = useMap(p, [start, start + 0.08], [0, 1]);
  const rad = (angle * Math.PI) / 180;
  const r = 36; // % of the stage
  const x = 50 + r * Math.cos(rad);
  const y = 50 + r * Math.sin(rad);
  return (
    <>
      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <motion.line
          x1="50"
          y1="50"
          x2={x}
          y2={y}
          stroke={accent}
          strokeOpacity={0.55}
          strokeWidth={0.35}
          style={{ pathLength }}
        />
      </svg>
      <motion.div
        style={{ left: `${x}%`, top: `${y}%`, opacity, scale, x: "-50%", y: "-50%" }}
        className="absolute"
      >
        <div
          className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.75rem] font-semibold text-white md:gap-2 md:px-4 md:py-2 md:text-[length:var(--text-small)]"
          style={{
            backgroundColor: `${accent}26`,
            boxShadow: `inset 0 0 0 1px ${accent}80, 0 0 32px ${accent}40`,
          }}
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
          {name}
        </div>
      </motion.div>
    </>
  );
}

function ClusterStage({ p, agentNames }: { p: MotionValue<number>; agentNames: string[] }) {
  const COPY = useCopy();
  const centerOpacity = useMap(p, [0.16, 0.24], [0, 1]);
  const centerScale = useMap(p, [0.16, 0.24, 0.45, 0.55], [0.5, 1, 1, 1.1]);
  const ringOpacity = useMap(p, [0.42, 0.52, 0.66, 0.74], [0, 1, 1, 0.5]);
  const ringRotate = useMap(p, [0.42, 1], [0, 40]);
  // In the "why" and final frames the stage steps back behind the text.
  const stageOpacity = useMap(p, [0, 0.64, 0.74], [1, 1, 0.18]);
  const stageScale = useMap(p, [0.6, 0.76], [1, 1.25]);

  return (
    <motion.div
      style={{ opacity: stageOpacity, scale: stageScale }}
      className="absolute left-1/2 top-1/2 aspect-square w-[min(84vw,78vh)] -translate-x-1/2 -translate-y-1/2"
    >
      <motion.div
        style={{ opacity: ringOpacity, rotate: ringRotate }}
        className="absolute inset-[2%] rounded-full border border-dashed border-white/20"
        aria-hidden
      />
      <motion.div
        style={{ opacity: ringOpacity }}
        className="absolute inset-[18%] rounded-full"
        aria-hidden
      >
        <div
          className="h-full w-full rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${PURPLE}33 0%, transparent 70%)` }}
        />
      </motion.div>
      {FEATURED_AGENTS.map((a, i) => (
        <AgentNode key={a.id} p={p} name={agentNames[i]} accent={a.accent} angle={-90 + i * 72} i={i} />
      ))}
      <motion.div
        style={{ opacity: centerOpacity, scale: centerScale, x: "-50%", y: "-50%" }}
        className="absolute left-1/2 top-1/2"
      >
        <div
          className="flex h-28 w-28 items-center justify-center rounded-full text-center font-semibold leading-tight text-white md:h-36 md:w-36"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${VIOLET}, ${PURPLE})`,
            boxShadow: `0 0 80px ${PURPLE}80`,
            fontSize: "var(--text-small)",
          }}
        >
          <motion.span
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="px-4"
          >
            {COPY.intro.center}
          </motion.span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Caption({ opacity, children }: { opacity: MotionValue<number>; children: React.ReactNode }) {
  const y = useTransform(opacity, [0, 1], [16, 0]);
  return (
    <motion.p
      style={{ opacity, y }}
      className="absolute inset-x-0 bottom-[12vh] mx-auto max-w-3xl px-6 text-center font-semibold leading-tight text-white"
    >
      <span style={{ fontSize: "var(--text-h2)" }}>{children}</span>
    </motion.p>
  );
}

function ProgressDots({ p }: { p: MotionValue<number> }) {
  const stops = [0.1, 0.33, 0.58, 0.8, 0.95];
  return (
    <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2" aria-hidden>
      {stops.map((s, i) => (
        <Dot key={s} p={p} at={s} prev={i === 0 ? 0 : stops[i - 1]} />
      ))}
    </div>
  );
}

function Dot({ p, at, prev }: { p: MotionValue<number>; at: number; prev: number }) {
  const width = useMap(p, [prev, at], [8, 24]);
  const opacity = useMap(p, [prev, at], [0.3, 1]);
  return <motion.span style={{ width, opacity }} className="h-2 rounded-full bg-white" />;
}

function ScrollIntro({ agentNames, onQuiz }: { agentNames: string[]; onQuiz: () => void }) {
  const COPY = useCopy();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const routineOpacity = useMap(p, [0, 0.1, 0.18], [1, 1, 0]);
  const routineY = useMap(p, [0, 0.18], [0, -40]);
  const agentsOpacity = useWindow(p, 0.24, 0.3, 0.4, 0.46);
  const clusterOpacity = useWindow(p, 0.48, 0.53, 0.62, 0.67);
  const whyOpacity = useWindow(p, 0.7, 0.74, 0.84, 0.88);
  const finalOpacity = useMap(p, [0.89, 0.95], [0, 1]);
  const finalY = useMap(p, [0.89, 0.95], [24, 0]);
  const hintOpacity = useMap(p, [0, 0.05], [1, 0]);
  const finalPointer = useTransform(p, (v) => (v > 0.9 ? "auto" : "none"));

  return (
    <section ref={ref} className="relative h-[420vh] bg-[#0e0d13]" aria-label="Intro">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Background: grid + blobs, as on the current hero */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute left-[-300px] top-[-200px] h-[800px] w-[800px] rounded-full bg-[#8129ff]/10 blur-[120px]" />
          <div className="absolute bottom-[-200px] right-[-200px] h-[600px] w-[600px] rounded-full bg-[#a318f8]/8 blur-[100px]" />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        {/* Routine chips (opening frame) */}
        <div className="absolute inset-0 hidden md:block" aria-hidden>
          {COPY.intro.routines.map((label, i) => (
            <RoutineChip key={label} p={p} label={label} x={ROUTINE_POS[i].x} y={ROUTINE_POS[i].y} i={i} />
          ))}
        </div>

        <ClusterStage p={p} agentNames={agentNames} />

        {/* Frame 1: routine */}
        <motion.div
          style={{ opacity: routineOpacity, y: routineY }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center"
        >
          <h1
            className="max-w-5xl font-semibold leading-[1.05] tracking-tight text-white"
            style={{ fontSize: "var(--text-hero)" }}
          >
            {COPY.intro.routineHeadline}
          </h1>
          <p className="max-w-2xl font-light text-white/60" style={{ fontSize: "var(--text-body)" }}>
            {COPY.intro.routineSub}
          </p>
        </motion.div>

        {/* Frames 2 + 3: captions under the cluster */}
        <Caption opacity={agentsOpacity}>{COPY.intro.agentsCaption}</Caption>
        <Caption opacity={clusterOpacity}>{COPY.intro.clusterCaption}</Caption>

        {/* Frame 4: why Venture Labs */}
        <motion.div
          style={{ opacity: whyOpacity }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6"
        >
          <p className="font-semibold text-white" style={{ fontSize: "var(--text-section)" }}>
            {COPY.intro.whyHeading}
          </p>
          <ul className="flex max-w-2xl flex-col gap-4">
            {COPY.intro.whyPoints.map((point, i) => (
              <WhyPoint key={point} p={p} at={0.72 + i * 0.03} text={point} />
            ))}
          </ul>
        </motion.div>

        {/* Frame 5: final statement + CTAs */}
        <motion.div
          style={{ opacity: finalOpacity, y: finalY, pointerEvents: finalPointer }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6 text-center"
        >
          <p
            className="max-w-5xl font-semibold leading-[1.05] tracking-tight text-white"
            style={{ fontSize: "var(--text-hero)" }}
          >
            {COPY.intro.finalHeadline.split(COPY.intro.finalHighlight)[0]}
            <span className="relative inline-block">
              <span className="relative z-10">{COPY.intro.finalHighlight}</span>
              <span
                className="absolute bottom-1 left-0 h-[4px] w-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${BLUE}, ${VIOLET}, ${AMBER})` }}
              />
            </span>
            {COPY.intro.finalHeadline.split(COPY.intro.finalHighlight)[1]}
          </p>
          <p className="max-w-2xl font-light leading-relaxed text-white/60" style={{ fontSize: "var(--text-body)" }}>
            {COPY.intro.finalSub}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={onQuiz}
              className="inline-flex items-center gap-2 rounded-lg bg-[#8129ff] px-[24px] py-[11px] font-semibold text-white transition-all hover:scale-[1.02] hover:bg-[#9140ff]"
              style={{ fontSize: "var(--text-body)" }}
            >
              {COPY.intro.ctaQuiz}
              <ArrowRight size={16} />
            </button>
            <a
              href="#nutzen"
              className="inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/5 px-6 py-3 font-medium text-white transition-all hover:bg-white/10"
              style={{ fontSize: "var(--text-body)" }}
            >
              {COPY.intro.ctaMore}
              <ChevronDown size={16} />
            </a>
          </div>
        </motion.div>

        <motion.div
          style={{ opacity: hintOpacity }}
          className="absolute bottom-14 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-white/50"
          aria-hidden
        >
          <span style={{ fontSize: "var(--text-small)" }}>{COPY.intro.scrollHint}</span>
          <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
            <ChevronDown size={18} />
          </motion.span>
        </motion.div>

        <ProgressDots p={p} />
      </div>
    </section>
  );
}

function WhyPoint({ p, at, text }: { p: MotionValue<number>; at: number; text: string }) {
  const opacity = useMap(p, [at, at + 0.03], [0, 1]);
  const x = useMap(p, [at, at + 0.03], [-20, 0]);
  return (
    <motion.li style={{ opacity, x }} className="flex items-start gap-3 text-white" >
      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8129ff]">
        <Check size={14} />
      </span>
      <span className="font-light leading-snug" style={{ fontSize: "var(--text-h3)" }}>
        {text}
      </span>
    </motion.li>
  );
}

/** Reduced motion: the intro's message as one plain section, no pinning, no scroll scrubbing. */
function StaticIntro({ agentNames, onQuiz }: { agentNames: string[]; onQuiz: () => void }) {
  const COPY = useCopy();
  return (
    <section className="relative bg-[#0e0d13] px-6 pb-24 pt-40 lg:px-12" aria-label="Intro">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
        <h1 className="max-w-5xl font-semibold leading-[1.05] tracking-tight text-white" style={{ fontSize: "var(--text-hero)" }}>
          {COPY.intro.finalHeadline}
        </h1>
        <p className="max-w-2xl font-light leading-relaxed text-white/60" style={{ fontSize: "var(--text-body)" }}>
          {COPY.intro.routineHeadline} {COPY.intro.finalSub}
        </p>
        <div className="flex flex-wrap gap-3">
          {agentNames.map((name, i) => (
            <span
              key={name}
              className="rounded-full px-4 py-2 font-semibold text-white"
              style={{ backgroundColor: `${FEATURED_AGENTS[i].accent}26`, boxShadow: `inset 0 0 0 1px ${FEATURED_AGENTS[i].accent}80` }}
            >
              {name}
            </span>
          ))}
        </div>
        <ul className="flex flex-col gap-3">
          {COPY.intro.whyPoints.map((point) => (
            <li key={point} className="flex items-start gap-3 font-light text-white">
              <Check size={18} className="mt-1 shrink-0 text-[#8129ff]" />
              {point}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onQuiz}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-[#8129ff] px-[24px] py-[11px] font-semibold text-white"
          style={{ fontSize: "var(--text-body)" }}
        >
          {COPY.intro.ctaQuiz}
          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Outcomes                                                         */
/* ------------------------------------------------------------------ */

function SectionHead({ eyebrow, heading, intro }: { eyebrow: string; heading: string; intro?: string }) {
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <span className="font-semibold uppercase tracking-[0.2em] text-[#a318f8]" style={{ fontSize: "var(--text-small)" }}>
        {eyebrow}
      </span>
      <h2 className="font-semibold leading-tight text-white" style={{ fontSize: "var(--text-section)" }}>
        {heading}
      </h2>
      {intro && (
        <p className="font-light leading-relaxed text-white/60" style={{ fontSize: "var(--text-body)" }}>
          {intro}
        </p>
      )}
    </div>
  );
}

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function OutcomeAgents() {
  const COPY = useCopy();
  const { situations } = useLeistungenData();
  const { localizedPath } = useLocale();
  const agents = FEATURED_AGENTS.map((a) => ({ ...a, situation: situations.find((s) => s.id === a.id) })).filter(
    (a) => a.situation
  );

  return (
    <section id="nutzen" className="scroll-mt-24 bg-[#0e0d13] py-24">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-12 px-6 lg:px-12">
        <Reveal>
          <SectionHead eyebrow={COPY.outcomes.eyebrow} heading={COPY.outcomes.heading} intro={COPY.outcomes.intro} />
        </Reveal>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((a, i) => (
            <Reveal key={a.id} delay={i * 0.06} className={i === 0 ? "lg:row-span-2" : undefined}>
              <article
                className="flex h-full flex-col gap-5 rounded-3xl p-7"
                style={{ backgroundColor: `${a.accent}14`, boxShadow: `inset 0 0 0 1px ${a.accent}4d` }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold" style={{ color: a.accent, fontSize: "var(--text-body)" }}>
                    {a.situation!.agentName}
                  </span>
                  {a.live && (
                    <span
                      className="rounded-full px-3 py-1 font-medium text-[#0e0d13]"
                      style={{ backgroundColor: a.accent, fontSize: "0.75rem" }}
                    >
                      {COPY.outcomes.liveBadge}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold leading-tight text-white" style={{ fontSize: i === 0 ? "var(--text-h2)" : "var(--text-h3)" }}>
                  {COPY.outcomes.byId[a.id]}
                </h3>
                <p className="font-light italic leading-snug text-white/60" style={{ fontSize: "var(--text-small)" }}>
                  „{a.situation!.text}“
                </p>
                <ul className="mt-auto flex flex-col gap-1.5 border-t border-white/10 pt-4">
                  {a.situation!.capabilities.map((c) => (
                    <li key={c} className="flex items-start gap-2 font-light text-white/75" style={{ fontSize: "var(--text-small)" }}>
                      <Check size={14} className="mt-0.5 shrink-0" style={{ color: a.accent }} aria-hidden />
                      {c}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
          <Reveal delay={0.3}>
            <Link
              to={localizedPath("/leistungen")}
              className="group flex h-full min-h-[180px] flex-col justify-between rounded-3xl border border-dashed border-white/20 p-7 text-white transition-colors hover:border-white/40 hover:bg-white/[0.03]"
            >
              <span className="font-light text-white/60" style={{ fontSize: "var(--text-small)" }}>
                {situations.length} Use Cases
              </span>
              <span className="flex items-center gap-2 font-semibold" style={{ fontSize: "var(--text-h3)" }}>
                {COPY.outcomes.allLink}
                <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Why us                                                           */
/* ------------------------------------------------------------------ */

function WhyUs() {
  const COPY = useCopy();
  const { localizedPath } = useLocale();
  const accents = [BLUE, VIOLET, AMBER, PURPLE];
  return (
    <section className="bg-[#0e0d13] py-24">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-12 px-6 lg:px-12">
        <Reveal>
          <SectionHead eyebrow={COPY.why.eyebrow} heading={COPY.why.heading} />
        </Reveal>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-2">
          {COPY.why.points.map((point, i) => (
            <Reveal key={point.title} delay={i * 0.06} className="h-full">
              <div className="flex h-full flex-col gap-3 bg-[#0e0d13] p-8 lg:p-10">
                <span className="font-semibold tabular-nums" style={{ color: accents[i], fontSize: "var(--text-small)" }}>
                  0{i + 1}
                </span>
                <h3 className="font-semibold text-white" style={{ fontSize: "var(--text-h3)" }}>
                  {point.title}
                </h3>
                <p className="font-light leading-relaxed text-white/60" style={{ fontSize: "var(--text-body)" }}>
                  {point.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
        <Link
          to={localizedPath("/leistungen")}
          className="inline-flex items-center gap-2 self-start font-medium text-white/80 transition-colors hover:text-white"
          style={{ fontSize: "var(--text-body)" }}
        >
          {COPY.why.clusterLink}
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Cases                                                            */
/* ------------------------------------------------------------------ */

function CaseStrip() {
  const COPY = useCopy();
  const { featuredCases, gridCases } = useCasesData();
  const { localizedPath } = useLocale();
  const all = [...featuredCases, ...gridCases];
  const cases = CASE_SLUGS.map((slug) => all.find((c) => c.slug === slug)).filter(
    (c): c is (typeof all)[number] => Boolean(c)
  );

  return (
    <section className="bg-[#0e0d13] py-24">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-12 px-6 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <SectionHead eyebrow={COPY.cases.eyebrow} heading={COPY.cases.heading} />
          </Reveal>
          <Link
            to={localizedPath("/cases")}
            className="inline-flex items-center gap-2 font-medium text-white/80 transition-colors hover:text-white"
            style={{ fontSize: "var(--text-body)" }}
          >
            {COPY.cases.allLink}
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {cases.map((c, i) => (
            <Reveal key={c.slug} delay={i * 0.08} className="h-full">
              <Link
                to={localizedPath(`/cases/${c.slug}`)}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] transition-colors hover:border-white/25"
              >
                <div className="aspect-[4/3] overflow-hidden bg-black">
                  <img
                    src={c.image}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <h3 className="font-semibold leading-tight text-white" style={{ fontSize: "var(--text-h3)" }}>
                    {c.title}
                  </h3>
                  <p className="font-light leading-relaxed text-white/60" style={{ fontSize: "var(--text-small)" }}>
                    {c.subtitle}
                  </p>
                  <span
                    className="mt-auto inline-flex items-center gap-1 pt-2 font-medium text-white"
                    style={{ fontSize: "var(--text-small)" }}
                  >
                    {COPY.cases.caseLink}
                    <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Final: Pulse Score                                               */
/* ------------------------------------------------------------------ */

function PulseFinal({ onQuiz }: { onQuiz: () => void }) {
  const COPY = useCopy();
  return (
    <section className="bg-[#0e0d13] px-6 py-24 lg:px-12">
      <Reveal className="mx-auto max-w-[1400px]">
        <div
          className="relative flex flex-col items-start gap-8 overflow-hidden rounded-3xl p-8 md:p-14"
          style={{ background: `linear-gradient(135deg, ${PURPLE}40, ${VIOLET}1a 55%, ${AMBER}14)`, boxShadow: `inset 0 0 0 1px ${PURPLE}66` }}
        >
          <span className="font-semibold uppercase tracking-[0.2em] text-white/70" style={{ fontSize: "var(--text-small)" }}>
            {COPY.final.eyebrow}
          </span>
          <h2 className="max-w-3xl font-semibold leading-[1.05] text-white" style={{ fontSize: "var(--text-hero)" }}>
            {COPY.final.heading}
          </h2>
          <p className="max-w-2xl font-light leading-relaxed text-white/75" style={{ fontSize: "var(--text-body)" }}>
            {COPY.final.body}
          </p>
          <div className="flex flex-wrap gap-4">
            <CtaButton onClick={onQuiz} backgroundColor={PURPLE}>
              {COPY.final.ctaQuiz}
            </CtaButton>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent(EVENTS.callLinkClicked, PLACEMENTS.startNeuFinalBooking, CTAS.bookCall)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-6 py-3 font-medium text-white transition-all hover:bg-white/10"
              style={{ fontSize: "var(--text-body)" }}
            >
              {COPY.final.ctaCall}
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function StartNeu() {
  const { situations } = useLeistungenData();
  const agentNames = FEATURED_AGENTS.map((a) => situations.find((s) => s.id === a.id)?.agentName ?? a.id);

  // Read on the client only, so the server render and the first client render agree.
  const prefersReduced = useReducedMotion();
  const [reduced, setReduced] = useState(false);
  useEffect(() => setReduced(Boolean(prefersReduced)), [prefersReduced]);

  const [introQuizOpen, setIntroQuizOpen] = useState(false);
  const [finalQuizOpen, setFinalQuizOpen] = useState(false);
  const openIntroQuiz = useCallback(() => setIntroQuizOpen(true), []);
  const openFinalQuiz = useCallback(() => setFinalQuizOpen(true), []);

  return (
    <div className="relative min-h-screen bg-[#0e0d13] text-white">
      <Navbar />
      {reduced ? (
        <StaticIntro agentNames={agentNames} onQuiz={openIntroQuiz} />
      ) : (
        <ScrollIntro agentNames={agentNames} onQuiz={openIntroQuiz} />
      )}
      <OutcomeAgents />
      <WhyUs />
      <PulseJourney compact />
      <CaseStrip />
      <PulseFinal onQuiz={openFinalQuiz} />
      <Footer />
      <PulseCheckModal open={introQuizOpen} onOpenChange={setIntroQuizOpen} placement={PLACEMENTS.startNeuIntroQuiz} />
      <PulseCheckModal open={finalQuizOpen} onOpenChange={setFinalQuizOpen} placement={PLACEMENTS.startNeuFinalQuiz} />
    </div>
  );
}
