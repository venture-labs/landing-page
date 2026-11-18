import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  Check,
  ChevronDown,
  Clock,
  FileCheck,
  FileText,
  Inbox,
  MessagesSquare,
  ScanLine,
  Target,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import { PulseJourney } from "@/app/components/PulseJourney";
import { PulseCheckModal } from "@/app/components/PulseCheckModal";
import { CtaButton } from "@/app/components/ui/CtaButton";
import { useCasesData, useLeistungenData, useSiteData } from "@/data/content";
import { useLocale } from "@/app/locale";
import { BOOKING_URL } from "@/app/links";
import { CTAS, EVENTS, PLACEMENTS, trackEvent } from "@/app/analytics";

/**
 * /:lang/start-neu — alternative homepage draft (branch feature/startseite-ki-nutzen).
 *
 * Focus: the mittelstand and what custom AI tools do for it — benefit first, not "we are great". Order:
 *   1. ScrollIntro  — pinned, scroll-driven intro (~5 s of normal scrolling): routine → agents → cluster → tools
 *   2. ToolWall     — "Wir bauen deine Tools": a marquee of tool names and twelve tool tiles, each with its benefit
 *   3. Benefits     — what the customer gets out of it, four hover cards
 *   4. PulseJourney — Check · Build · Care (shared component)
 *   5. CaseStrip    — Tap2Link, Brylliant, Moerschen
 *   6. PulseFinal   — "Wo stehst du?": Pulse Score + Erstgespräch
 *   7. Outro        — the brand line "We build what's next." in display type
 *
 * The tool list follows the entry use cases commonly named for the German mittelstand in 2026 (incoming
 * invoices and receipts, inbox triage, first-contact customer service, quotes and lead qualification, HR
 * requests, internal knowledge) plus time tracking and leave requests. Agent names in the
 * intro come from content/site/leistungen.md (`situations`), cases from content/cases; the page's own copy
 * lives in COPY_DE / COPY_EN. Noindex, not in the nav or sitemap.
 *
 * SSR-safe: the server and the first client render show the intro's opening frame; scroll progress and
 * reduced motion are only read on the client. Under prefers-reduced-motion the intro renders as a plain,
 * unpinned section and the marquee stands still.
 */

const PURPLE = "#8129ff";
const BLUE = "#2b95f6";
const VIOLET = "#a318f8";
const AMBER = "#fda700";
const ACCENTS = [BLUE, VIOLET, AMBER, PURPLE];

/** Display type: bolder and larger than the site's section headings. */
const DISPLAY = "font-bold tracking-[-0.035em] leading-[0.98] text-white";
const SIZE_HERO = "clamp(3rem, 7vw, 7.5rem)";
const SIZE_SECTION = "clamp(2.5rem, 5.5vw, 5.5rem)";
const SIZE_OUTRO = "clamp(3.5rem, 12vw, 13rem)";

/** The five agents the intro draws around "Dein Unternehmen"; ids from leistungen.md `situations`. */
const FEATURED_AGENTS = [
  { id: "receipts", accent: BLUE },
  { id: "invoice-coverage", accent: VIOLET },
  { id: "tool-fatigue", accent: AMBER },
  { id: "prioritization", accent: PURPLE },
  { id: "neglected-tool", accent: BLUE },
] as const;

/** Icons of the tool tiles, in COPY.tools.items order. */
const TOOL_ICONS: LucideIcon[] = [
  ScanLine,
  FileCheck,
  Clock,
  CalendarCheck,
  MessagesSquare,
  FileText,
  BellRing,
  Inbox,
  CalendarClock,
  UserPlus,
  BookOpen,
  Target,
];

/** The cases the page shows, in this order. */
const CASE_SLUGS = ["tap2link", "brylliant", "moerschen"] as const;

const COPY_DE = {
  intro: {
    routineHeadline: "Belege abtippen. Stunden nachtragen. Urlaub per Mail.",
    routineSub: "So sieht Routine in vielen Unternehmen aus. Jede Woche, in jedem Team.",
    routines: [
      "Beleg fehlt",
      "Rechnung prüfen",
      "Stunden nachtragen",
      "Urlaubsantrag",
      "Kundenanfrage",
      "Angebot schreiben",
      "Mahnung",
      "Excel abgleichen",
    ],
    agentsCaption: "Jede Routine bekommt einen KI-Agenten.",
    clusterCaption: "Zusammen ein Cluster, der mit dir wächst.",
    center: "Dein Unternehmen",
    toolsHeading: "Wir bauen deine Tools.",
    toolsPoints: ["Individuell für deine Abläufe.", "In den Tools, die ihr schon nutzt.", "Live in Wochen, nicht in Quartalen."],
    finalHeadline: "KI, die im Mittelstand wirklich mitarbeitet.",
    finalHighlight: "wirklich",
    ctaQuiz: "Kostenlosen Pulse Score starten",
    ctaMore: "Welche Tools?",
    scrollHint: "Scrollen",
  },
  tools: {
    eyebrow: "Deine Tools",
    heading: "Was wir für dich bauen.",
    intro: "Kein Tool von der Stange: Jedes passt auf deinen Ablauf und läuft da, wo dein Team ohnehin arbeitet.",
    items: [
      { name: "Belege scannen & ablegen", benefit: "Foto rein, Beleg landet richtig abgelegt in der Buchhaltung." },
      { name: "Eingangsrechnungen prüfen", benefit: "Mit der Bestellung abgeglichen, Abweichungen markiert." },
      { name: "Zeiterfassung", benefit: "Stunden per Chat oder Sprachnachricht, direkt dem Projekt zugeordnet." },
      { name: "Urlaubsanträge", benefit: "Beantragt, geprüft, im Kalender. Ohne Formular-Pingpong." },
      { name: "Kundenkommunikation", benefit: "Anfragen sortiert, Antwort vorbereitet, dein Team gibt frei." },
      { name: "Angebote", benefit: "Aus der Anfrage wird ein fertiger Angebotsentwurf." },
      { name: "Mahnwesen", benefit: "Überfälliges erkannt, Erinnerung vorbereitet." },
      { name: "Postfach sortieren", benefit: "Jede Mail landet beim richtigen Team." },
      { name: "Termine", benefit: "Terminwünsche aus Mails direkt im Kalender." },
      { name: "Onboarding", benefit: "Neue im Team finden Antworten, ohne lange zu suchen." },
      { name: "Wissensdatenbank", benefit: "Euer Wissen aus Ordnern und Mails, per Frage durchsuchbar." },
      { name: "Lead-Qualifizierung", benefit: "Neue Kontakte vorsortiert, die passenden zuerst." },
    ],
    more: "Dein Ablauf fehlt? Den bauen wir auch.",
    moreLink: "Alle Use Cases",
  },
  benefits: {
    eyebrow: "Dein Gewinn",
    heading: "Was du davon hast.",
    points: [
      { title: "Mehr Zeit fürs Geschäft", body: "Die Routine läuft im Hintergrund. Dein Team kümmert sich um Kunden statt um Ablage." },
      { title: "Passt in deinen Alltag", body: "Mail, Chat, Kalender, Buchhaltung: Die Tools arbeiten da, wo ihr schon arbeitet." },
      { title: "Deine Daten bleiben bei dir", body: "Nach außen gehen nur Laufzeit, Fehler und Kosten. Lokale Modelle, wo immer es geht." },
      { title: "Klein starten, mitwachsen", body: "Erst ein Tool, dann das nächste. Jeden Monat schauen wir gemeinsam, was als Nächstes kommt." },
    ],
  },
  cases: {
    eyebrow: "Cases",
    heading: "Gebaut. Live. Im Einsatz.",
    allLink: "Alle Cases",
    caseLink: "Case ansehen",
  },
  final: {
    eyebrow: "Pulse Score",
    heading: "Wo stehst du mit KI?",
    body: "Fünf Minuten, zehn Fragen, sofort ein Ergebnis. Danach klären wir im kostenlosen Erstgespräch, mit welchem Tool du startest.",
    ctaQuiz: "Pulse Score starten",
    ctaCall: "Erstgespräch buchen",
  },
};

type Copy = typeof COPY_DE;

const COPY_EN: Copy = {
  intro: {
    routineHeadline: "Typing up receipts. Back-filling hours. Leave requests by email.",
    routineSub: "That is what routine looks like in many companies. Every week, in every team.",
    routines: [
      "Receipt missing",
      "Check the invoice",
      "Back-fill hours",
      "Leave request",
      "Customer request",
      "Write the quote",
      "Payment reminder",
      "Reconcile the spreadsheet",
    ],
    agentsCaption: "Every routine gets its own AI agent.",
    clusterCaption: "Together, a cluster that grows with you.",
    center: "Your company",
    toolsHeading: "We build your tools.",
    toolsPoints: ["Made for the way you work.", "Inside the tools you already use.", "Live in weeks, not quarters."],
    finalHeadline: "AI that really works for mid-sized companies.",
    finalHighlight: "really",
    ctaQuiz: "Start the free Pulse Score",
    ctaMore: "Which tools?",
    scrollHint: "Scroll",
  },
  tools: {
    eyebrow: "Your tools",
    heading: "What we build for you.",
    intro: "Nothing off the shelf: each tool fits the way you work and runs where your team already works.",
    items: [
      { name: "Scan & file receipts", benefit: "Snap a photo, the receipt is filed in the right place in your books." },
      { name: "Check incoming invoices", benefit: "Matched against the order, deviations flagged." },
      { name: "Time tracking", benefit: "Hours by chat or voice message, assigned straight to the project." },
      { name: "Leave requests", benefit: "Requested, checked, in the calendar. No form ping-pong." },
      { name: "Customer communication", benefit: "Requests sorted, reply drafted, your team approves." },
      { name: "Quotes", benefit: "A customer request turns into a finished quote draft." },
      { name: "Payment reminders", benefit: "Overdue invoices spotted, reminder prepared." },
      { name: "Inbox triage", benefit: "Every email lands with the right team." },
      { name: "Appointments", benefit: "Meeting requests from emails go straight into the calendar." },
      { name: "Onboarding", benefit: "New colleagues find answers without a long search." },
      { name: "Knowledge base", benefit: "Your knowledge from folders and emails, searchable by question." },
      { name: "Lead qualification", benefit: "New contacts pre-sorted, the best fits first." },
    ],
    more: "Your process is missing? We build that too.",
    moreLink: "All use cases",
  },
  benefits: {
    eyebrow: "What you gain",
    heading: "What's in it for you.",
    points: [
      { title: "More time for the business", body: "The routine runs in the background. Your team looks after customers instead of filing." },
      { title: "Fits your daily work", body: "Email, chat, calendar, accounting: the tools work where you already work." },
      { title: "Your data stays with you", body: "All that leaves is runtime, errors and cost. Local models wherever possible." },
      { title: "Start small, grow along", body: "One tool first, then the next. Every month we decide together what comes next." },
    ],
  },
  cases: {
    eyebrow: "Cases",
    heading: "Built. Live. In use.",
    allLink: "All cases",
    caseLink: "View case",
  },
  final: {
    eyebrow: "Pulse Score",
    heading: "Where do you stand with AI?",
    body: "Five minutes, ten questions, an instant result. Afterwards, in a free first call, we work out which tool you start with.",
    ctaQuiz: "Start the Pulse Score",
    ctaCall: "Book a first call",
  },
};

function useCopy(): Copy {
  return useLocale().lang === "en" ? COPY_EN : COPY_DE;
}

/* ------------------------------------------------------------------ */
/* Shared                                                              */
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

function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionHead({ eyebrow, heading, intro }: { eyebrow: string; heading: string; intro?: string }) {
  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <span className="font-bold uppercase tracking-[0.25em] text-[#a318f8]" style={{ fontSize: "var(--text-small)" }}>
        {eyebrow}
      </span>
      <h2 className={DISPLAY} style={{ fontSize: SIZE_SECTION }}>
        {heading}
      </h2>
      {intro && (
        <p className="max-w-2xl font-light leading-relaxed text-white/60" style={{ fontSize: "var(--text-body)" }}>
          {intro}
        </p>
      )}
    </div>
  );
}

/** Text with one word underlined by the brand gradient. */
function Highlighted({ text, word }: { text: string; word: string }) {
  const [before, after] = text.split(word);
  return (
    <>
      {before}
      <span className="relative inline-block">
        <span className="relative z-10">{word}</span>
        <span
          className="absolute bottom-[0.06em] left-0 h-[0.08em] w-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${BLUE}, ${VIOLET}, ${AMBER})` }}
        />
      </span>
      {after}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Scroll intro                                                     */
/* ------------------------------------------------------------------ */

/** Positions of the eight routine chips in the opening frame, in % of the stage. */
const ROUTINE_POS = [
  { x: 14, y: 22 },
  { x: 72, y: 16 },
  { x: 86, y: 46 },
  { x: 8, y: 56 },
  { x: 26, y: 82 },
  { x: 72, y: 80 },
  { x: 44, y: 10 },
  { x: 52, y: 90 },
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
      className="absolute whitespace-nowrap rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 font-medium text-white/75 backdrop-blur-sm"
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
function AgentNode({ p, name, accent, angle, i }: { p: MotionValue<number>; name: string; accent: string; angle: number; i: number }) {
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
        <motion.line x1="50" y1="50" x2={x} y2={y} stroke={accent} strokeOpacity={0.55} strokeWidth={0.35} style={{ pathLength }} />
      </svg>
      <motion.div style={{ left: `${x}%`, top: `${y}%`, opacity, scale, x: "-50%", y: "-50%" }} className="absolute">
        <div
          className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.75rem] font-bold text-white md:gap-2 md:px-4 md:py-2 md:text-[length:var(--text-small)]"
          style={{ backgroundColor: `${accent}26`, boxShadow: `inset 0 0 0 1px ${accent}80, 0 0 32px ${accent}40` }}
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
  // In the "tools" and final frames the stage steps back behind the text.
  const stageOpacity = useMap(p, [0, 0.64, 0.74], [1, 1, 0.15]);
  const stageScale = useMap(p, [0.6, 0.76], [1, 1.3]);

  return (
    <motion.div
      style={{ opacity: stageOpacity, scale: stageScale }}
      className="absolute left-1/2 top-1/2 aspect-square w-[min(84vw,78vh)] -translate-x-1/2 -translate-y-1/2"
    >
      <motion.div style={{ opacity: ringOpacity, rotate: ringRotate }} className="absolute inset-[2%] rounded-full border border-dashed border-white/20" aria-hidden />
      <motion.div style={{ opacity: ringOpacity }} className="absolute inset-[18%] rounded-full" aria-hidden>
        <div className="h-full w-full rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${PURPLE}33 0%, transparent 70%)` }} />
      </motion.div>
      {FEATURED_AGENTS.map((a, i) => (
        <AgentNode key={a.id} p={p} name={agentNames[i]} accent={a.accent} angle={-90 + i * 72} i={i} />
      ))}
      <motion.div style={{ opacity: centerOpacity, scale: centerScale, x: "-50%", y: "-50%" }} className="absolute left-1/2 top-1/2">
        <div
          className="flex h-28 w-28 items-center justify-center rounded-full text-center font-bold leading-tight text-white md:h-36 md:w-36"
          style={{ background: `radial-gradient(circle at 30% 30%, ${VIOLET}, ${PURPLE})`, boxShadow: `0 0 80px ${PURPLE}80`, fontSize: "var(--text-small)" }}
        >
          <motion.span animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} className="px-4">
            {COPY.intro.center}
          </motion.span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Caption({ opacity, children }: { opacity: MotionValue<number>; children: ReactNode }) {
  const y = useTransform(opacity, [0, 1], [16, 0]);
  return (
    <motion.p style={{ opacity, y }} className={`absolute inset-x-0 bottom-[11vh] mx-auto max-w-4xl px-6 text-center ${DISPLAY}`}>
      <span style={{ fontSize: "clamp(1.75rem, 3.5vw, 3.25rem)" }}>{children}</span>
    </motion.p>
  );
}

function Dot({ p, at, prev }: { p: MotionValue<number>; at: number; prev: number }) {
  const width = useMap(p, [prev, at], [8, 24]);
  const opacity = useMap(p, [prev, at], [0.3, 1]);
  return <motion.span style={{ width, opacity }} className="h-2 rounded-full bg-white" />;
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

function ToolsPoint({ p, at, text }: { p: MotionValue<number>; at: number; text: string }) {
  const opacity = useMap(p, [at, at + 0.03], [0, 1]);
  const x = useMap(p, [at, at + 0.03], [-24, 0]);
  return (
    <motion.li style={{ opacity, x }} className="flex items-center gap-3 text-white">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#8129ff]">
        <Check size={16} strokeWidth={3} />
      </span>
      <span className="font-semibold leading-snug" style={{ fontSize: "var(--text-h3)" }}>
        {text}
      </span>
    </motion.li>
  );
}

function ScrollIntro({ agentNames, onQuiz }: { agentNames: string[]; onQuiz: () => void }) {
  const COPY = useCopy();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const routineOpacity = useMap(p, [0, 0.1, 0.18], [1, 1, 0]);
  const routineY = useMap(p, [0, 0.18], [0, -40]);
  const agentsOpacity = useWindow(p, 0.24, 0.3, 0.4, 0.46);
  const clusterOpacity = useWindow(p, 0.48, 0.53, 0.62, 0.67);
  const toolsOpacity = useWindow(p, 0.7, 0.74, 0.84, 0.88);
  const toolsScale = useMap(p, [0.7, 0.78], [0.92, 1]);
  const finalOpacity = useMap(p, [0.89, 0.95], [0, 1]);
  const finalY = useMap(p, [0.89, 0.95], [24, 0]);
  const hintOpacity = useMap(p, [0, 0.05], [1, 0]);
  const finalPointer = useTransform(p, (v) => (v > 0.9 ? "auto" : "none"));

  return (
    <section ref={ref} className="relative h-[420vh] bg-[#0e0d13]" aria-label="Intro">
      <div className="sticky top-0 h-screen overflow-hidden">
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

        <div className="absolute inset-0 hidden md:block" aria-hidden>
          {COPY.intro.routines.map((label, i) => (
            <RoutineChip key={label} p={p} label={label} x={ROUTINE_POS[i].x} y={ROUTINE_POS[i].y} i={i} />
          ))}
        </div>

        <ClusterStage p={p} agentNames={agentNames} />

        {/* Frame 1: routine */}
        <motion.div style={{ opacity: routineOpacity, y: routineY }} className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center">
          <h1 className={`max-w-6xl ${DISPLAY}`} style={{ fontSize: SIZE_HERO }}>
            {COPY.intro.routineHeadline}
          </h1>
          <p className="max-w-2xl font-light text-white/60" style={{ fontSize: "var(--text-body)" }}>
            {COPY.intro.routineSub}
          </p>
        </motion.div>

        {/* Frames 2 + 3: captions under the cluster */}
        <Caption opacity={agentsOpacity}>{COPY.intro.agentsCaption}</Caption>
        <Caption opacity={clusterOpacity}>{COPY.intro.clusterCaption}</Caption>

        {/* Frame 4: we build your tools */}
        <motion.div style={{ opacity: toolsOpacity, scale: toolsScale }} className="absolute inset-0 flex flex-col items-center justify-center gap-10 px-6">
          <p className={`text-center ${DISPLAY}`} style={{ fontSize: SIZE_HERO }}>
            {COPY.intro.toolsHeading}
          </p>
          <ul className="flex flex-col gap-4">
            {COPY.intro.toolsPoints.map((point, i) => (
              <ToolsPoint key={point} p={p} at={0.72 + i * 0.03} text={point} />
            ))}
          </ul>
        </motion.div>

        {/* Frame 5: final statement + CTAs */}
        <motion.div
          style={{ opacity: finalOpacity, y: finalY, pointerEvents: finalPointer }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-10 px-6 text-center"
        >
          <p className={`max-w-6xl ${DISPLAY}`} style={{ fontSize: SIZE_HERO }}>
            <Highlighted text={COPY.intro.finalHeadline} word={COPY.intro.finalHighlight} />
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={onQuiz}
              className="inline-flex items-center gap-2 rounded-lg bg-[#8129ff] px-7 py-3.5 font-bold text-white transition-all hover:scale-[1.03] hover:bg-[#9140ff]"
              style={{ fontSize: "var(--text-body)" }}
            >
              {COPY.intro.ctaQuiz}
              <ArrowRight size={18} />
            </button>
            <a
              href="#tools"
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-7 py-3.5 font-semibold text-white transition-all hover:bg-white/10"
              style={{ fontSize: "var(--text-body)" }}
            >
              {COPY.intro.ctaMore}
              <ChevronDown size={18} />
            </a>
          </div>
        </motion.div>

        <motion.div style={{ opacity: hintOpacity }} className="absolute bottom-14 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-white/50" aria-hidden>
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

/** Reduced motion: the intro's message as one plain section, no pinning, no scroll scrubbing. */
function StaticIntro({ agentNames, onQuiz }: { agentNames: string[]; onQuiz: () => void }) {
  const COPY = useCopy();
  return (
    <section className="relative bg-[#0e0d13] px-6 pb-24 pt-40 lg:px-12" aria-label="Intro">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
        <h1 className={`max-w-6xl ${DISPLAY}`} style={{ fontSize: SIZE_HERO }}>
          {COPY.intro.finalHeadline}
        </h1>
        <p className="max-w-2xl font-light leading-relaxed text-white/60" style={{ fontSize: "var(--text-body)" }}>
          {COPY.intro.routineHeadline} {COPY.intro.toolsHeading}
        </p>
        <div className="flex flex-wrap gap-3">
          {agentNames.map((name, i) => (
            <span
              key={name}
              className="rounded-full px-4 py-2 font-bold text-white"
              style={{ backgroundColor: `${FEATURED_AGENTS[i].accent}26`, boxShadow: `inset 0 0 0 1px ${FEATURED_AGENTS[i].accent}80` }}
            >
              {name}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={onQuiz}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-[#8129ff] px-7 py-3.5 font-bold text-white"
          style={{ fontSize: "var(--text-body)" }}
        >
          {COPY.intro.ctaQuiz}
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Tool wall                                                        */
/* ------------------------------------------------------------------ */

/** A row of tool names in huge outline type, drifting sideways (still under reduced motion). */
function Marquee({ names, reverse = false, reduced }: { names: string[]; reverse?: boolean; reduced: boolean }) {
  const row = (
    <div className="flex shrink-0 items-center gap-10 pr-10">
      {names.map((n, i) => (
        <span key={n} className="flex items-center gap-10 whitespace-nowrap">
          <span
            className="font-bold tracking-[-0.03em]"
            style={
              i % 3 === 1
                ? { fontSize: "clamp(3rem, 7vw, 7rem)", color: "white" }
                : { fontSize: "clamp(3rem, 7vw, 7rem)", color: "transparent", WebkitTextStroke: "1.5px rgba(255,255,255,0.35)" }
            }
          >
            {n}
          </span>
          <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: ACCENTS[i % ACCENTS.length] }} />
        </span>
      ))}
    </div>
  );
  return (
    <div className="flex overflow-hidden" aria-hidden>
      <motion.div
        className="flex"
        animate={reduced ? undefined : { x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        {row}
        {row}
      </motion.div>
    </div>
  );
}

function ToolTile({ name, benefit, Icon, accent, index }: { name: string; benefit: string; Icon: LucideIcon; accent: string; index: number }) {
  return (
    <Reveal delay={(index % 4) * 0.05} className="h-full">
      <div
        className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-7 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[color:var(--accent)] hover:shadow-[0_24px_60px_-24px_var(--accent)]"
        style={{ "--accent": accent } as CSSProperties}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: `radial-gradient(circle at 0% 0%, ${accent}33 0%, transparent 65%)` }}
        />
        <span
          className="relative flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-110"
          style={{ backgroundColor: `${accent}26`, color: accent }}
        >
          <Icon size={24} strokeWidth={2.25} />
        </span>
        <h3
          className="relative font-bold leading-tight tracking-[-0.02em] text-white [hyphens:auto] [overflow-wrap:anywhere]"
          style={{ fontSize: "clamp(1.25rem, 1.5vw, 1.5rem)" }}
        >
          {name}
        </h3>
        <p
          className="relative font-light leading-relaxed text-white/60 transition-colors duration-300 group-hover:text-white/85"
          style={{ fontSize: "var(--text-small)" }}
        >
          {benefit}
        </p>
      </div>
    </Reveal>
  );
}

function ToolWall({ reduced }: { reduced: boolean }) {
  const COPY = useCopy();
  const { localizedPath } = useLocale();
  const names = COPY.tools.items.map((t) => t.name);

  return (
    <section id="tools" className="scroll-mt-24 overflow-hidden bg-[#0e0d13] py-24">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <Reveal>
          <SectionHead eyebrow={COPY.tools.eyebrow} heading={COPY.tools.heading} intro={COPY.tools.intro} />
        </Reveal>
      </div>

      <div className="my-16 flex flex-col gap-4">
        <Marquee names={names.slice(0, 6)} reduced={reduced} />
        <Marquee names={names.slice(6)} reverse reduced={reduced} />
      </div>

      <div className="mx-auto flex max-w-[1400px] flex-col gap-10 px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {COPY.tools.items.map((t, i) => (
            <ToolTile key={t.name} name={t.name} benefit={t.benefit} Icon={TOOL_ICONS[i]} accent={ACCENTS[i % ACCENTS.length]} index={i} />
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-dashed border-white/20 px-7 py-6">
          <p className="font-bold tracking-[-0.02em] text-white" style={{ fontSize: "var(--text-h3)" }}>
            {COPY.tools.more}
          </p>
          <Link
            to={localizedPath("/leistungen")}
            className="group inline-flex items-center gap-2 font-semibold text-white/80 transition-colors hover:text-white"
            style={{ fontSize: "var(--text-body)" }}
          >
            {COPY.tools.moreLink}
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Benefits                                                         */
/* ------------------------------------------------------------------ */

function Benefits() {
  const COPY = useCopy();
  return (
    <section className="bg-[#0e0d13] py-24">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-14 px-6 lg:px-12">
        <Reveal>
          <SectionHead eyebrow={COPY.benefits.eyebrow} heading={COPY.benefits.heading} />
        </Reveal>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {COPY.benefits.points.map((point, i) => (
            <Reveal key={point.title} delay={i * 0.06} className="h-full">
              <div
                className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[color:var(--accent)] hover:shadow-[0_24px_60px_-24px_var(--accent)]"
                style={{ "--accent": ACCENTS[i] } as CSSProperties}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: `radial-gradient(circle at 0% 0%, ${ACCENTS[i]}33 0%, transparent 65%)` }}
                />
                <span aria-hidden className="relative h-[3px] w-10 rounded-full transition-all duration-500 ease-out group-hover:w-full" style={{ backgroundColor: ACCENTS[i] }} />
                <span
                  className="relative font-bold tabular-nums tracking-[-0.04em] transition-transform duration-300 group-hover:translate-x-1"
                  style={{ color: ACCENTS[i], fontSize: "clamp(2.5rem, 3.5vw, 3.5rem)", lineHeight: 1 }}
                >
                  0{i + 1}
                </span>
                <h3 className="relative font-bold leading-tight tracking-[-0.02em] text-white" style={{ fontSize: "var(--text-h3)" }}>
                  {point.title}
                </h3>
                <p
                  className="relative font-light leading-relaxed text-white/60 transition-colors duration-300 group-hover:text-white/85"
                  style={{ fontSize: "var(--text-small)" }}
                >
                  {point.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
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
  const cases = CASE_SLUGS.map((slug) => all.find((c) => c.slug === slug)).filter((c): c is (typeof all)[number] => Boolean(c));

  return (
    <section className="bg-[#0e0d13] py-24">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-14 px-6 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <SectionHead eyebrow={COPY.cases.eyebrow} heading={COPY.cases.heading} />
          </Reveal>
          <Link
            to={localizedPath("/cases")}
            className="group inline-flex items-center gap-2 font-semibold text-white/80 transition-colors hover:text-white"
            style={{ fontSize: "var(--text-body)" }}
          >
            {COPY.cases.allLink}
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {cases.map((c, i) => (
            <Reveal key={c.slug} delay={i * 0.08} className="h-full">
              <Link
                to={localizedPath(`/cases/${c.slug}`)}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] transition-all duration-300 hover:-translate-y-1.5 hover:border-white/30"
              >
                <div className="aspect-[4/3] overflow-hidden bg-black">
                  <img src={c.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <h3 className="font-bold leading-tight tracking-[-0.02em] text-white" style={{ fontSize: "var(--text-h3)" }}>
                    {c.title}
                  </h3>
                  <p className="font-light leading-relaxed text-white/60" style={{ fontSize: "var(--text-small)" }}>
                    {c.subtitle}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1 pt-2 font-semibold text-white" style={{ fontSize: "var(--text-small)" }}>
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
/* 6. Pulse Score                                                      */
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
          <span className="font-bold uppercase tracking-[0.25em] text-white/70" style={{ fontSize: "var(--text-small)" }}>
            {COPY.final.eyebrow}
          </span>
          <h2 className={`max-w-4xl ${DISPLAY}`} style={{ fontSize: SIZE_SECTION }}>
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
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10"
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
/* 7. Outro: We build what's next.                                     */
/* ------------------------------------------------------------------ */

function Outro() {
  const { heroHeadline } = useSiteData();
  const { t } = useTranslation();
  const highlight = t("hero.headlineHighlight");
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const scale = useMap(p, [0, 1], [0.82, 1]);
  const opacity = useMap(p, [0, 0.5], [0.2, 1]);
  const underline = useMap(p, [0.45, 0.95], [0, 1]);
  const [before, after] = heroHeadline.split(highlight);

  return (
    <section ref={ref} className="relative flex min-h-[80vh] items-center overflow-hidden bg-[#0e0d13] px-6 py-24 lg:px-12">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute bottom-[-300px] left-1/2 h-[700px] w-[1100px] -translate-x-1/2 rounded-full bg-[#8129ff]/15 blur-[140px]" />
      </div>
      <motion.p style={{ scale, opacity }} className={`relative mx-auto w-full max-w-[1400px] origin-left ${DISPLAY}`}>
        <span style={{ fontSize: SIZE_OUTRO }}>
          {before}
          <span className="relative inline-block">
            <span className="relative z-10">{highlight}</span>
            <motion.span
              style={{ scaleX: underline, background: `linear-gradient(90deg, ${BLUE}, ${VIOLET}, ${AMBER})` }}
              className="absolute bottom-[0.08em] left-0 h-[0.07em] w-full origin-left rounded-full"
            />
          </span>
          {after}
        </span>
      </motion.p>
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
      {reduced ? <StaticIntro agentNames={agentNames} onQuiz={openIntroQuiz} /> : <ScrollIntro agentNames={agentNames} onQuiz={openIntroQuiz} />}
      <ToolWall reduced={reduced} />
      <Benefits />
      <PulseJourney compact />
      <CaseStrip />
      <PulseFinal onQuiz={openFinalQuiz} />
      <Outro />
      <Footer />
      <PulseCheckModal open={introQuizOpen} onOpenChange={setIntroQuizOpen} placement={PLACEMENTS.startNeuIntroQuiz} />
      <PulseCheckModal open={finalQuizOpen} onOpenChange={setFinalQuizOpen} placement={PLACEMENTS.startNeuFinalQuiz} />
    </div>
  );
}
