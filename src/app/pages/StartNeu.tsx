import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router";
import {
  AnimatePresence,
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
  ChevronDown,
  Clock,
  FileCheck,
  FileText,
  Inbox,
  MessagesSquare,
  RotateCw,
  ScanLine,
  Sparkles,
  Target,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import { PulseJourney } from "@/app/components/PulseJourney";
import { PulseCheckModal } from "@/app/components/PulseCheckModal";
import { CtaButton } from "@/app/components/ui/CtaButton";
import { useCasesData, useSiteData } from "@/data/content";
import { useLocale } from "@/app/locale";
import { BOOKING_URL } from "@/app/links";
import { CTAS, EVENTS, PLACEMENTS, trackEvent } from "@/app/analytics";

/**
 * The homepage (route /:lang). It replaced the earlier Hero-based homepage; /:lang/start-neu, the address it was
 * drafted under, redirects here.
 *
 * Focus: the mittelstand and what custom AI tools do for it — benefit first, not "we are great". Order:
 *   1. ScrollIntro  — pinned, scroll-driven intro (~5 s of scrolling): routine → your tools → benefit → "We build what's next."
 *   2. ToolWall     — "Wir bauen deine Tools": a marquee of tool names and twelve tool tiles, each with its benefit
 *   3. Benefits     — what the customer gets out of it, four hover cards
 *   4. PulseJourney — Check · Build · Care (shared component)
 *   5. CaseStrip    — Tap2Link, Brylliant, Moerschen
 *   6. PulseFinal   — "Wo stehst du?": Pulse Score + Erstgespräch
 *   7. Outro        — the brand line "We build what's next." in display type
 *
 * The tool list follows the entry use cases commonly named for the German mittelstand in 2026 (incoming
 * invoices and receipts, inbox triage, first-contact customer service, quotes and lead qualification, HR
 * requests, internal knowledge) plus time tracking and leave requests. Cases come from
 * content/cases; the page's own copy
 * lives in COPY_DE / COPY_EN. SEO title and description come from content/site/home.md.
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

/** The six tools the intro draws around "Dein Unternehmen", in COPY.intro.tools order. */
const INTRO_TOOLS: { icon: LucideIcon; accent: string }[] = [
  { icon: Clock, accent: BLUE },
  { icon: ScanLine, accent: VIOLET },
  { icon: CalendarCheck, accent: AMBER },
  { icon: MessagesSquare, accent: PURPLE },
  { icon: FileText, accent: BLUE },
  { icon: BellRing, accent: AMBER },
];

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
    headlineLead: "Wir bauen KI für",
    headlineEnds: ["deine Belege.", "deine Zeiterfassung.", "deine Urlaubsanträge.", "deine Kundenanfragen.", "dein Unternehmen."],
    headlineFull: "Wir bauen KI für dein Unternehmen.",
    headlineSub: "Individuelle KI-Tools, die dir die Routine abnehmen. Scroll weiter und sieh, wie.",
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
    center: "Dein Unternehmen",
    tools: ["Zeiterfassung", "Belege", "Urlaubsanträge", "Kundenkommunikation", "Angebote", "Mahnwesen"],
    toolsHeading: "Wir bauen deine Tools.",
    toolsSub: "Individuell für deine Abläufe. Da, wo dein Team ohnehin arbeitet.",
    benefitLines: ["Weniger Routine.", "Mehr Zeit fürs Geschäft."],
    finalSub: "Individuelle KI-Tools für den Mittelstand. Live in Wochen, nicht in Quartalen.",
    ctaQuiz: "Kostenlosen Pulse Score starten",
    ctaMore: "Welche Tools?",
    scrollHint: "Scrollen",
  },
  tools: {
    eyebrow: "Deine Tools",
    heading: "Was wir für dich bauen.",
    intro: "Kein Tool von der Stange: Jedes passt auf deinen Ablauf und läuft da, wo dein Team ohnehin arbeitet.",
    items: [
      {
        name: "Belege scannen & ablegen",
        benefit: "Foto rein, Beleg landet richtig abgelegt in der Buchhaltung.",
        pain: "Du verbringst viel Zeit mit dem Scannen und Ablegen von Belegen.",
        build: "Wir bauen dir ein vollautomatisiertes System: Der Beleg kommt per Foto oder Mail rein, wird erkannt, geprüft und abgelegt. Mit Freigaben und Rechten, wer was sehen und bestätigen darf.",
      },
      {
        name: "Eingangsrechnungen prüfen",
        benefit: "Mit der Bestellung abgeglichen, Abweichungen markiert.",
        pain: "Jede Rechnung wird von Hand mit der Bestellung verglichen, und Abweichungen fallen erst spät auf.",
        build: "Das System gleicht Rechnung und Bestellung ab, markiert Abweichungen und legt sie deinem Team zur Freigabe vor. Nichts wird stillschweigend durchgewunken.",
      },
      {
        name: "Zeiterfassung",
        benefit: "Stunden per Chat oder Sprachnachricht, direkt dem Projekt zugeordnet.",
        pain: "Stunden werden am Freitag aus dem Gedächtnis nachgetragen.",
        build: "Dein Team meldet Zeiten per Chat oder Sprachnachricht, das System ordnet sie dem richtigen Projekt zu und fragt nach, wenn etwas unklar ist. Ausgewertet wird nach deinen Regeln.",
      },
      {
        name: "Urlaubsanträge",
        benefit: "Beantragt, geprüft, im Kalender. Ohne Formular-Pingpong.",
        pain: "Urlaubsanträge kommen per Mail, Zettel oder Chat und müssen von Hand in den Kalender.",
        build: "Antrag stellen, Vertretung und Fristen prüfen, Freigabe durch die richtige Person, Eintrag im Kalender. Rechte und Regeln so, wie sie bei euch gelten.",
      },
      {
        name: "Kundenkommunikation",
        benefit: "Anfragen sortiert, Antwort vorbereitet, dein Team gibt frei.",
        pain: "Anfragen stapeln sich im Postfach, und immer dieselben Antworten werden neu geschrieben.",
        build: "Das System sortiert Anfragen und bereitet eine Antwort in deinem Ton vor. Gesendet wird erst, wenn ein Mensch zustimmt.",
      },
      {
        name: "Angebote",
        benefit: "Aus der Anfrage wird ein fertiger Angebotsentwurf.",
        pain: "Aus jeder Anfrage ein Angebot zu bauen, kostet jedes Mal Zeit.",
        build: "Produkt und Menge werden aus der Anfrage gelesen, der Entwurf entsteht in deinem CRM oder deiner Vorlage. Du prüfst und gibst frei.",
      },
      {
        name: "Mahnwesen",
        benefit: "Überfälliges erkannt, Erinnerung vorbereitet.",
        pain: "Überfällige Rechnungen fallen erst auf, wenn es schon lange her ist.",
        build: "Das System erkennt Überfälliges und bereitet die Erinnerung vor, dein Team bestätigt nur noch. Stufen und Ton legst du fest.",
      },
      {
        name: "Postfach sortieren",
        benefit: "Jede Mail landet beim richtigen Team.",
        pain: "Im gemeinsamen Postfach weiß keiner, wer sich um welche Mail kümmert.",
        build: "Jede Mail wird erkannt und dem richtigen Team oder der richtigen Person zugeordnet, mit Hinweis auf die Dringlichkeit. Zuständigkeiten richten wir nach deinem Ablauf ein.",
      },
      {
        name: "Termine",
        benefit: "Terminwünsche aus Mails direkt im Kalender.",
        pain: "Terminwünsche stehen in Mails, und jemand tippt sie von Hand in den Kalender.",
        build: "Das System liest den Wunsch, schlägt freie Zeiten vor und trägt den Termin nach Bestätigung ein.",
      },
      {
        name: "Onboarding",
        benefit: "Neue im Team finden Antworten, ohne lange zu suchen.",
        pain: "Neue Kolleginnen und Kollegen suchen in Ordnern und fragen immer dasselbe.",
        build: "Eine geführte Einarbeitung mit Checkliste und einem Assistenten, der Fragen aus eurem Wissen beantwortet. Zugriff nur auf das, was die Rolle sehen darf.",
      },
      {
        name: "Wissensdatenbank",
        benefit: "Euer Wissen aus Ordnern und Mails, per Frage durchsuchbar.",
        pain: "Das Wissen liegt in Ordnern, Mails und Köpfen.",
        build: "Dein Wissen wird durchsuchbar, Fragen werden mit Quellenangabe beantwortet. Wer was lesen darf, legst du über Rechte fest.",
      },
      {
        name: "Lead-Qualifizierung",
        benefit: "Neue Kontakte vorsortiert, die passenden zuerst.",
        pain: "Neue Kontakte kommen von überall, und keiner weiß, wen man zuerst anruft.",
        build: "Kontakte werden vorsortiert, die passenden zuerst, mit kurzer Zusammenfassung. Die Kriterien bestimmst du.",
      },
    ],
    more: "Dein Ablauf fehlt? Den bauen wir auch.",
    moreLink: "Alle Use Cases",
    card: {
      open: "Beispiel ansehen",
      label: "Beispiel",
      before: "Heute",
      after: "Mit Venture Labs",
      individual: "Immer individuell auf deinen Arbeitsablauf eingerichtet.",
      cta: "Deinen Ablauf besprechen",
      close: "Schließen",
    },
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
    headlineLead: "We build AI for",
    headlineEnds: ["your receipts.", "your time tracking.", "your leave requests.", "your customer emails.", "your company."],
    headlineFull: "We build AI for your company.",
    headlineSub: "Custom AI tools that take the routine off your plate. Keep scrolling to see how.",
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
    center: "Your company",
    tools: ["Time tracking", "Receipts", "Leave requests", "Customer communication", "Quotes", "Payment reminders"],
    toolsHeading: "We build your tools.",
    toolsSub: "Made for the way you work. Right where your team already works.",
    benefitLines: ["Less routine.", "More time for the business."],
    finalSub: "Custom AI tools for mid-sized companies. Live in weeks, not quarters.",
    ctaQuiz: "Start the free Pulse Score",
    ctaMore: "Which tools?",
    scrollHint: "Scroll",
  },
  tools: {
    eyebrow: "Your tools",
    heading: "What we build for you.",
    intro: "Nothing off the shelf: each tool fits the way you work and runs where your team already works.",
    items: [
      {
        name: "Scan & file receipts",
        benefit: "Snap a photo, the receipt is filed in the right place in your books.",
        pain: "You spend a lot of time scanning and filing receipts.",
        build: "We build you a fully automated system: the receipt arrives by photo or email, is recognised, checked and filed. With approvals and permissions for who may see and confirm what.",
      },
      {
        name: "Check incoming invoices",
        benefit: "Matched against the order, deviations flagged.",
        pain: "Every invoice is compared with the order by hand, and deviations show up late.",
        build: "The system matches invoice and order, flags deviations and puts them in front of your team for approval. Nothing is waved through silently.",
      },
      {
        name: "Time tracking",
        benefit: "Hours by chat or voice message, assigned straight to the project.",
        pain: "Hours are filled in from memory on Friday.",
        build: "Your team reports time by chat or voice message, the system assigns it to the right project and asks when something is unclear. Reports follow your rules.",
      },
      {
        name: "Leave requests",
        benefit: "Requested, checked, in the calendar. No form ping-pong.",
        pain: "Leave requests arrive by email, note or chat and have to be entered into the calendar by hand.",
        build: "Submit the request, check cover and deadlines, approval by the right person, entry in the calendar. Permissions and rules as they apply at your company.",
      },
      {
        name: "Customer communication",
        benefit: "Requests sorted, reply drafted, your team approves.",
        pain: "Requests pile up in the inbox, and the same answers are written again and again.",
        build: "The system sorts requests and drafts a reply in your tone. Nothing is sent until a person agrees.",
      },
      {
        name: "Quotes",
        benefit: "A customer request turns into a finished quote draft.",
        pain: "Turning every request into a quote costs time, every time.",
        build: "Product and quantity are read from the request, the draft is created in your CRM or template. You review and approve.",
      },
      {
        name: "Payment reminders",
        benefit: "Overdue invoices spotted, reminder prepared.",
        pain: "Overdue invoices are only noticed long after the due date.",
        build: "The system spots overdue invoices and prepares the reminder, your team only confirms. You set the stages and the tone.",
      },
      {
        name: "Inbox triage",
        benefit: "Every email lands with the right team.",
        pain: "In the shared inbox nobody knows who is looking after which email.",
        build: "Every email is recognised and assigned to the right team or person, with a note on urgency. We set up responsibilities to match your process.",
      },
      {
        name: "Appointments",
        benefit: "Meeting requests from emails go straight into the calendar.",
        pain: "Meeting requests sit in emails, and someone types them into the calendar by hand.",
        build: "The system reads the request, suggests free slots and enters the appointment once it is confirmed.",
      },
      {
        name: "Onboarding",
        benefit: "New colleagues find answers without a long search.",
        pain: "New colleagues search through folders and keep asking the same questions.",
        build: "Guided onboarding with a checklist and an assistant that answers questions from your own knowledge. Access only to what the role may see.",
      },
      {
        name: "Knowledge base",
        benefit: "Your knowledge from folders and emails, searchable by question.",
        pain: "Knowledge lives in folders, emails and people's heads.",
        build: "Your knowledge becomes searchable, answers come with their source. Who may read what is set through permissions.",
      },
      {
        name: "Lead qualification",
        benefit: "New contacts pre-sorted, the best fits first.",
        pain: "New contacts arrive from everywhere, and nobody knows who to call first.",
        build: "Contacts are pre-sorted, the best fits first, with a short summary. You decide the criteria.",
      },
    ],
    more: "Your process is missing? We build that too.",
    moreLink: "All use cases",
    card: {
      open: "See an example",
      label: "Example",
      before: "Today",
      after: "With Venture Labs",
      individual: "Always set up around your own way of working.",
      cta: "Talk through your process",
      close: "Close",
    },
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

/* ------------------------------------------------------------------ */
/* 1. Scroll intro                                                     */
/* ------------------------------------------------------------------ */
/*
 * Four frames over ~500vh of scrolling (long enough that a Magic Mouse flick does not skip a frame):
 *   1. 0.00–0.18  Routine: "Belege. Stunden. Urlaubsanträge. Kundenanfragen." line by line, routine chips around
 *   2. 0.22–0.52  Tools: "Wir bauen deine Tools." — six tools fly in around "Dein Unternehmen", a ring closes
 *   3. 0.56–0.76  Benefit: "Weniger Routine. Mehr Zeit fürs Geschäft." over the dimmed cluster
 *   4. 0.80–1.00  Finale: "We build what's next." + CTAs
 */

/** Positions of the eight routine chips in the opening frame, in % of the stage. */
const ROUTINE_POS = [
  { x: 12, y: 20 },
  { x: 80, y: 16 },
  { x: 88, y: 48 },
  { x: 8, y: 58 },
  { x: 22, y: 84 },
  { x: 78, y: 82 },
  { x: 46, y: 9 },
  { x: 52, y: 92 },
];

function RoutineChip({ p, label, x, y, i }: { p: MotionValue<number>; label: string; x: number; y: number; i: number }) {
  // Chips drift towards the centre and vanish as the tools take over.
  const left = useTransform(p, [0, 0.22], [`${x}%`, "50%"]);
  const top = useTransform(p, [0, 0.22], [`${y}%`, "50%"]);
  const opacity = useMap(p, [0, 0.12, 0.22], [1, 0.8, 0]);
  const scale = useMap(p, [0, 0.22], [1, 0.4]);
  return (
    <motion.span
      style={{ left, top, opacity, scale, x: "-50%", y: "-50%" }}
      className="absolute whitespace-nowrap rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 font-medium text-white/60 backdrop-blur-sm"
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

/** One tool on the ring, plus its connector line to the centre. */
function ToolNode({ p, name, Icon, accent, angle, i }: { p: MotionValue<number>; name: string; Icon: LucideIcon; accent: string; angle: number; i: number }) {
  const start = 0.22 + i * 0.03;
  const opacity = useMap(p, [start, start + 0.05], [0, 1]);
  const scale = useMap(p, [start, start + 0.05, 0.44, 0.52], [0.3, 1, 1, 1.08]);
  const pathLength = useMap(p, [start, start + 0.07], [0, 1]);
  const rad = (angle * Math.PI) / 180;
  const r = 37; // % of the stage
  const x = 50 + r * Math.cos(rad);
  const y = 50 + r * Math.sin(rad);
  return (
    <>
      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <motion.line x1="50" y1="50" x2={x} y2={y} stroke={accent} strokeOpacity={0.6} strokeWidth={0.4} style={{ pathLength }} />
      </svg>
      <motion.div style={{ left: `${x}%`, top: `${y}%`, opacity, scale, x: "-50%", y: "-50%" }} className="absolute">
        <div
          className="flex flex-col items-center gap-1.5 whitespace-nowrap rounded-2xl px-3 py-2 text-[0.7rem] font-bold text-white md:flex-row md:gap-2.5 md:px-5 md:py-3 md:text-[length:var(--text-body)]"
          // Opaque base under the tint: the connector line ends at the box edge instead of showing through.
          style={{ background: `linear-gradient(${accent}26, ${accent}26), #0e0d13`, boxShadow: `inset 0 0 0 1.5px ${accent}, 0 0 40px ${accent}55` }}
        >
          <Icon className="h-4 w-4 md:h-5 md:w-5" style={{ color: accent }} strokeWidth={2.5} />
          {name}
        </div>
      </motion.div>
    </>
  );
}

function ClusterStage({ p }: { p: MotionValue<number> }) {
  const COPY = useCopy();
  const centerOpacity = useMap(p, [0.16, 0.24], [0, 1]);
  const centerScale = useMap(p, [0.16, 0.24, 0.44, 0.52], [0.4, 1, 1, 1.12]);
  const ringOpacity = useMap(p, [0.4, 0.48, 0.58, 0.66], [0, 1, 1, 0.4]);
  const ringRotate = useMap(p, [0.4, 1], [0, 50]);
  // From the benefit frame on, the stage steps back behind the text and keeps growing.
  const stageOpacity = useMap(p, [0, 0.52, 0.6, 0.8, 0.88], [1, 1, 0.14, 0.14, 0.05]);
  const stageScale = useMap(p, [0.5, 1], [1, 1.5]);

  return (
    <motion.div
      style={{ opacity: stageOpacity, scale: stageScale }}
      className="absolute left-1/2 top-[54%] aspect-square w-[min(84vw,66vh)] -translate-x-1/2 -translate-y-1/2"
    >
      <motion.div style={{ opacity: ringOpacity, rotate: ringRotate }} className="absolute inset-[4%] rounded-full border-2 border-dashed border-white/20" aria-hidden />
      <motion.div style={{ opacity: ringOpacity }} className="absolute inset-[16%] rounded-full" aria-hidden>
        <div className="h-full w-full rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${PURPLE}44 0%, transparent 70%)` }} />
      </motion.div>
      {INTRO_TOOLS.map((t, i) => (
        <ToolNode key={i} p={p} name={COPY.intro.tools[i]} Icon={t.icon} accent={t.accent} angle={-90 + i * 60} i={i} />
      ))}
      <motion.div style={{ opacity: centerOpacity, scale: centerScale, x: "-50%", y: "-50%" }} className="absolute left-1/2 top-1/2">
        <div
          className="flex h-24 w-24 items-center justify-center rounded-full text-center font-bold leading-tight text-white md:h-36 md:w-36"
          style={{ background: `radial-gradient(circle at 30% 30%, ${VIOLET}, ${PURPLE})`, boxShadow: `0 0 100px ${PURPLE}99`, fontSize: "var(--text-small)" }}
        >
          <motion.span animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} className="px-3">
            {COPY.intro.center}
          </motion.span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Dot({ p, at, prev }: { p: MotionValue<number>; at: number; prev: number }) {
  const width = useMap(p, [prev, at], [8, 28]);
  const opacity = useMap(p, [prev, at], [0.3, 1]);
  return <motion.span style={{ width, opacity }} className="h-2 rounded-full bg-white" />;
}

function ProgressDots({ p }: { p: MotionValue<number> }) {
  const stops = [0.08, 0.4, 0.66, 0.9];
  return (
    <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2" aria-hidden>
      {stops.map((s, i) => (
        <Dot key={s} p={p} at={s} prev={i === 0 ? 0 : stops[i - 1]} />
      ))}
    </div>
  );
}

/** One line of a stacked display headline, sliding in on scroll. */
function ScrollLine({ p, from, children, className, style }: { p: MotionValue<number>; from: number; children: ReactNode; className?: string; style?: CSSProperties }) {
  const opacity = useMap(p, [from, from + 0.04], [0, 1]);
  const y = useMap(p, [from, from + 0.04], [60, 0]);
  return (
    <motion.span style={{ opacity, y, ...style }} className={`block ${className ?? ""}`}>
      {children}
    </motion.span>
  );
}

/**
 * The intro's core statement: a fixed lead ("Wir bauen KI für") and an ending that rotates on a timer, each in
 * its own accent with an underline that redraws. Runs from the first paint, before anyone scrolls. The server
 * and the first client render show the first ending; screen readers get the full sentence once.
 */
function RotatingHeadline({ lead, ends, full }: { lead: string; ends: string[]; full: string }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const last = index === ends.length - 1;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % ends.length), last ? 3200 : 1700);
    return () => window.clearTimeout(id);
  }, [index, ends.length]);
  const accent = ACCENTS[index % ACCENTS.length];

  return (
    <h1 className={`w-full ${DISPLAY}`} style={{ fontSize: "clamp(1.75rem, 7.5vw, 8rem)" }}>
      <span className="sr-only">{full}</span>
      <motion.span
        aria-hidden
        className="block"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {lead}
      </motion.span>
      <span aria-hidden className="relative block h-[1.1em] overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={ends[index]}
            className="absolute inset-x-0 top-0 whitespace-nowrap"
            initial={{ y: "100%", opacity: 0, filter: "blur(8px)" }}
            animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
            exit={{ y: "-100%", opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{ color: index === ends.length - 1 ? "white" : accent }}
          >
            <span className="relative inline-block">
              {ends[index]}
              <motion.span
                className="absolute bottom-[0.04em] left-0 h-[0.07em] w-full origin-left rounded-full"
                style={{ background: index === ends.length - 1 ? `linear-gradient(90deg, ${BLUE}, ${VIOLET}, ${AMBER})` : accent }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              />
            </span>
          </motion.span>
        </AnimatePresence>
      </span>
    </h1>
  );
}

function ScrollIntro({ onQuiz }: { onQuiz: () => void }) {
  const COPY = useCopy();
  const { heroHeadline } = useSiteData();
  const { t } = useTranslation();
  const highlight = t("hero.headlineHighlight");
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const routineOpacity = useMap(p, [0, 0.1, 0.18], [1, 1, 0]);
  const routineScale = useMap(p, [0, 0.18], [1, 0.85]);
  const toolsOpacity = useWindow(p, 0.22, 0.27, 0.48, 0.54);
  const toolsY = useMap(p, [0.22, 0.27], [-30, 0]);
  const benefitOpacity = useWindow(p, 0.55, 0.58, 0.74, 0.78);
  const finalOpacity = useMap(p, [0.8, 0.86], [0, 1]);
  const finalScale = useMap(p, [0.8, 0.92], [0.85, 1]);
  const underline = useMap(p, [0.86, 0.96], [0, 1]);
  const hintOpacity = useMap(p, [0, 0.04], [1, 0]);
  const finalPointer = useTransform(p, (v) => (v > 0.82 ? "auto" : "none"));
  const [before, after] = heroHeadline.split(highlight);

  return (
    <section ref={ref} className="relative h-[600vh] bg-[#0e0d13]" aria-label="Intro">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <motion.div
            className="absolute left-[-300px] top-[-200px] h-[800px] w-[800px] rounded-full bg-[#8129ff]/15 blur-[120px]"
            animate={{ x: [0, 220, 80, 0], y: [0, 120, 260, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-[-200px] right-[-200px] h-[600px] w-[600px] rounded-full bg-[#a318f8]/12 blur-[100px]"
            animate={{ x: [0, -260, -100, 0], y: [0, -160, -40, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2b95f6]/10 blur-[110px]"
            animate={{ scale: [1, 1.35, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
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

        <ClusterStage p={p} />

        {/* Frame 1: the core statement, its ending rotating on its own before anyone scrolls */}
        <motion.div style={{ opacity: routineOpacity, scale: routineScale }} className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6 text-center">
          <RotatingHeadline lead={COPY.intro.headlineLead} ends={COPY.intro.headlineEnds} full={COPY.intro.headlineFull} />
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="max-w-xl font-medium text-white/60"
            style={{ fontSize: "var(--text-body)" }}
          >
            {COPY.intro.headlineSub}
          </motion.p>
        </motion.div>

        {/* Frame 2: we build your tools (heading above the cluster) */}
        <motion.div style={{ opacity: toolsOpacity, y: toolsY }} className="absolute inset-x-0 top-[11vh] flex flex-col items-center gap-3 px-6 text-center">
          <p className={DISPLAY} style={{ fontSize: "clamp(2.25rem, 5vw, 5rem)" }}>
            {COPY.intro.toolsHeading}
          </p>
          <p className="max-w-xl font-medium text-white/60" style={{ fontSize: "var(--text-body)" }}>
            {COPY.intro.toolsSub}
          </p>
        </motion.div>

        {/* Frame 3: benefit */}
        <motion.div style={{ opacity: benefitOpacity }} className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <p className={DISPLAY} style={{ fontSize: "clamp(2.25rem, 6.5vw, 7rem)" }}>
            {COPY.intro.benefitLines.map((line, i) => (
              <ScrollLine key={line} p={p} from={0.55 + i * 0.04} style={i === 1 ? { color: AMBER } : undefined}>
                {line}
              </ScrollLine>
            ))}
          </p>
        </motion.div>

        {/* Frame 4: finale — the brand line */}
        <motion.div
          style={{ opacity: finalOpacity, pointerEvents: finalPointer }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-10 px-6 text-center"
        >
          <motion.p style={{ scale: finalScale }} className={DISPLAY}>
            <span style={{ fontSize: "clamp(3.5rem, 11vw, 12rem)" }}>
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
          <p className="max-w-2xl font-medium text-white/70" style={{ fontSize: "var(--text-body)" }}>
            {COPY.intro.finalSub}
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
function StaticIntro({ onQuiz }: { onQuiz: () => void }) {
  const COPY = useCopy();
  const { heroHeadline } = useSiteData();
  return (
    <section className="relative bg-[#0e0d13] px-6 pb-24 pt-40 lg:px-12" aria-label="Intro">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
        <h1 className={`max-w-6xl ${DISPLAY}`} style={{ fontSize: SIZE_HERO }}>
          {heroHeadline}
        </h1>
        <p className="max-w-2xl font-medium leading-relaxed text-white/70" style={{ fontSize: "var(--text-h3)" }}>
          {COPY.intro.toolsHeading} {COPY.intro.benefitLines.join(" ")}
        </p>
        <div className="flex flex-wrap gap-3">
          {INTRO_TOOLS.map((tool, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 font-bold text-white"
              style={{ backgroundColor: `${tool.accent}26`, boxShadow: `inset 0 0 0 1.5px ${tool.accent}` }}
            >
              <tool.icon size={18} style={{ color: tool.accent }} />
              {COPY.intro.tools[i]}
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

type ToolItem = Copy["tools"]["items"][number];

/** Where a card flew from: the tile's box on screen, so the card can start exactly there. */
type OpenCard = { index: number; rect: { left: number; top: number; width: number; height: number } };

function ToolTile({
  item,
  Icon,
  accent,
  index,
  hidden,
  onOpen,
}: {
  item: ToolItem;
  Icon: LucideIcon;
  accent: string;
  index: number;
  hidden: boolean;
  onOpen: (rect: DOMRect, trigger: HTMLElement) => void;
}) {
  const COPY = useCopy();
  return (
    <Reveal delay={(index % 4) * 0.05} className="h-full">
      <div
        className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-7 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[color:var(--accent)] hover:shadow-[0_24px_60px_-24px_var(--accent)]"
        style={{ "--accent": accent, opacity: hidden ? 0 : 1, transitionProperty: hidden ? "none" : undefined } as CSSProperties}
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
          {item.name}
        </h3>
        <p
          className="relative font-light leading-relaxed text-white/60 transition-colors duration-300 group-hover:text-white/85"
          style={{ fontSize: "var(--text-small)" }}
        >
          {item.benefit}
        </p>
        <span
          aria-hidden
          className="relative mt-auto inline-flex items-center gap-1.5 pt-1 font-semibold opacity-70 transition-opacity duration-300 group-hover:opacity-100"
          style={{ color: accent, fontSize: "var(--text-small)" }}
        >
          <RotateCw size={14} strokeWidth={2.5} className="transition-transform duration-500 group-hover:rotate-180" />
          {COPY.tools.card.open}
        </span>
        {/* The whole tile is the button; the heading above stays a real heading. */}
        <button
          type="button"
          aria-haspopup="dialog"
          aria-label={`${item.name}: ${COPY.tools.card.open}`}
          onClick={(e) => onOpen((e.currentTarget.parentElement as HTMLElement).getBoundingClientRect(), e.currentTarget)}
          className="absolute inset-0 z-10 cursor-pointer rounded-3xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        />
      </div>
    </Reveal>
  );
}

/**
 * The flipped tool card: it starts exactly on the clicked tile, turns around and flies to the middle of the
 * screen, where its back shows a small example (the situation today, what we would build, always built around
 * the customer's own way of working). Escape, the backdrop and the close button bring it back. Under
 * reduced motion it just fades in, already showing the back.
 */
function ToolCardOverlay({
  open,
  item,
  Icon,
  accent,
  reduced,
  onClose,
}: {
  open: OpenCard | null;
  item: ToolItem | null;
  Icon: LucideIcon | null;
  accent: string;
  reduced: boolean;
  onClose: () => void;
}) {
  const COPY = useCopy();
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      // Keep Tab inside the dialog: it holds only the booking link and the close button.
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>("a[href], button");
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  // The card's final width, and where it starts: the tile's centre, scaled to the tile's width.
  const vw = typeof window === "undefined" ? 1200 : window.innerWidth;
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  const finalWidth = Math.min(vw * 0.92, 520);
  const from = open
    ? {
        x: open.rect.left + open.rect.width / 2 - vw / 2,
        y: open.rect.top + open.rect.height / 2 - vh / 2,
        scale: open.rect.width / finalWidth,
      }
    : { x: 0, y: 0, scale: 1 };
  const face = "[backface-visibility:hidden] [-webkit-backface-visibility:hidden] rounded-3xl";

  return (
    <AnimatePresence>
      {open && item && Icon && (
        <motion.div
          key="tool-card-backdrop"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          <div style={{ perspective: 1600 }} onClick={(e) => e.stopPropagation()}>
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="tool-card-title"
              className="grid"
              style={{ width: finalWidth, transformStyle: "preserve-3d" }}
              initial={reduced ? { opacity: 0, rotateY: 180 } : { ...from, rotateY: 0 }}
              animate={reduced ? { opacity: 1, rotateY: 180 } : { x: 0, y: 0, scale: 1, rotateY: 180 }}
              exit={reduced ? { opacity: 0, rotateY: 180 } : { ...from, rotateY: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } }}
              transition={reduced ? { duration: 0.2 } : { type: "spring", stiffness: 200, damping: 24, mass: 0.8 }}
            >
              {/* Front: looks like the tile it came from, so the flip reads as the tile turning around. */}
              <div
                aria-hidden
                className={`${face} flex flex-col gap-4 p-7`}
                style={{ gridArea: "1 / 1", backgroundColor: "#14131c", boxShadow: `inset 0 0 0 1px ${accent}66` }}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: `${accent}26`, color: accent }}>
                  <Icon size={24} strokeWidth={2.25} />
                </span>
                <span className="font-bold leading-tight tracking-[-0.02em] text-white" style={{ fontSize: "1.5rem" }}>
                  {item.name}
                </span>
                <span className="font-light leading-relaxed text-white/60" style={{ fontSize: "var(--text-small)" }}>
                  {item.benefit}
                </span>
              </div>

              {/* Back: the example. */}
              <div
                className={`${face} relative flex max-h-[88vh] flex-col gap-5 overflow-y-auto p-7 sm:p-8`}
                style={{
                  gridArea: "1 / 1",
                  transform: "rotateY(180deg)",
                  background: `radial-gradient(circle at 0% 0%, ${accent}2e 0%, transparent 60%), #14131c`,
                  boxShadow: `inset 0 0 0 1.5px ${accent}, 0 30px 90px -30px ${accent}`,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${accent}26`, color: accent }}>
                      <Icon size={22} strokeWidth={2.25} />
                    </span>
                    <span
                      className="rounded-full px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.18em]"
                      style={{ backgroundColor: `${accent}26`, color: accent }}
                    >
                      {COPY.tools.card.label}
                    </span>
                  </div>
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={onClose}
                    aria-label={COPY.tools.card.close}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <h3 id="tool-card-title" className="font-bold leading-tight tracking-[-0.025em] text-white" style={{ fontSize: "clamp(1.5rem, 2vw, 1.9rem)" }}>
                  {item.name}
                </h3>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-white/45">{COPY.tools.card.before}</span>
                    <p className="font-light leading-relaxed text-white/75" style={{ fontSize: "var(--text-body)" }}>
                      {item.pain}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[0.7rem] font-bold uppercase tracking-[0.18em]" style={{ color: accent }}>
                      {COPY.tools.card.after}
                    </span>
                    <p className="font-medium leading-relaxed text-white" style={{ fontSize: "var(--text-body)" }}>
                      {item.build}
                    </p>
                  </div>
                </div>

                <p
                  className="flex items-start gap-2.5 rounded-2xl px-4 py-3 font-bold leading-snug text-white"
                  style={{ backgroundColor: `${accent}1f`, fontSize: "var(--text-small)" }}
                >
                  <Sparkles size={18} className="mt-0.5 shrink-0" style={{ color: accent }} />
                  {COPY.tools.card.individual}
                </p>

                <a
                  href={BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent(EVENTS.callLinkClicked, PLACEMENTS.startNeuToolCard, CTAS.bookCall)}
                  className="inline-flex items-center justify-center gap-2 self-start rounded-lg px-6 py-3 font-bold text-white transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: PURPLE, fontSize: "var(--text-body)" }}
                >
                  {COPY.tools.card.cta}
                  <ArrowRight size={16} />
                </a>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ToolWall({ reduced }: { reduced: boolean }) {
  const COPY = useCopy();
  const { localizedPath } = useLocale();
  const names = COPY.tools.items.map((t) => t.name);
  const [open, setOpen] = useState<OpenCard | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const openCard = useCallback((index: number, rect: DOMRect, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setOpen({ index, rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height } });
  }, []);
  const closeCard = useCallback(() => {
    setOpen(null);
    triggerRef.current?.focus({ preventScroll: true });
  }, []);

  const item = open ? COPY.tools.items[open.index] : null;
  const Icon = open ? TOOL_ICONS[open.index] : null;
  const accent = open ? ACCENTS[open.index % ACCENTS.length] : PURPLE;

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
            <ToolTile
              key={t.name}
              item={t}
              Icon={TOOL_ICONS[i]}
              accent={ACCENTS[i % ACCENTS.length]}
              index={i}
              hidden={open?.index === i}
              onOpen={(rect, trigger) => openCard(i, rect, trigger)}
            />
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

      <ToolCardOverlay open={open} item={item} Icon={Icon} accent={accent} reduced={reduced} onClose={closeCard} />
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
      {reduced ? <StaticIntro onQuiz={openIntroQuiz} /> : <ScrollIntro onQuiz={openIntroQuiz} />}
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
