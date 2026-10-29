import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Check } from "lucide-react";
import { CTAS, EVENTS, PLACEMENTS, trackEvent } from "@/app/analytics";
import { BOOKING_URL } from "@/app/links";
import { CtaButton } from "@/app/components/ui/CtaButton";
import { useLocale } from "@/app/locale";

/**
 * The 10-question Pulse Score quiz, transposed from the live
 * pulse.venturelabs.team site (both content and quiz logic captured directly
 * from the running app, DE + EN). Not part of the markdown content — the
 * scoring is bound to the question set, so copy and logic live together here.
 *
 * The score narrative is verified for the two ends of the 0–100 range
 * ("Erste Anzeichen"/"Early Signs" at the low end, "Stabiler Puls"/"Steady
 * Pulse" in the mid-high range) — the live quiz likely has more granular
 * bands in between that weren't sampled, so this uses a simple 50-point
 * split between the two verified narratives rather than inventing more.
 */

export type Area = "data" | "process" | "team" | "tools" | "governance";
export const AREA_ORDER: Area[] = ["data", "process", "team", "tools", "governance"];

interface QuizQuestion {
  area: Area;
  question: string;
  options: string[];
}

export interface Copy {
  areaLabels: Record<Area, string>;
  quizHeading: string;
  /* The one line shown on question 1 only; it replaced the intro step. Keep it
   * right after quizHeading, away from the booking button label (the naming
   * guard reads a duration near a conversation word as a call length). */
  quizMeta: string;
  quizIntro: string;
  questionLabel: (n: number) => string;
  resultReady: string;
  scoreLabel: string;
  restart: string;
  weakestSentence: (a: string, b: string) => string;
  breakdownHeading: string;
  bands: { min: number; label: string; narrative: string }[];
  ctaHeading: string;
  ctaBody: string;
  ctaButton: string;
  questions: QuizQuestion[];
  /* Optional lead capture form on the result step (item 1 of the 2026-10-16
   * funnel fixes), folded open by leadToggle — its own copy, same pattern as
   * the rest of this file. */
  leadToggle: string;
  leadIntro: string;
  leadEmailPlaceholder: string;
  leadConsentText: string;
  leadConsentLinkLabel: string;
  leadSubmit: string;
  leadSubmitting: string;
  leadThankYou: string;
  leadError: string;
}

export const COPY: Record<"de" | "en", Copy> = {
  de: {
    areaLabels: {
      data: "Datenbasis",
      process: "Prozesse",
      team: "Team",
      tools: "Tool-Stack",
      governance: "Governance & Risiko",
    },
    quizHeading: "AI Pulse Score: Wie gesund ist dein KI-Einsatz?",
    quizMeta: "10 Fragen, 5 Minuten",
    quizIntro:
      "Beantworte 10 kurze Fragen zu fünf Bereichen und erhalte sofort deinen Pulse Score sowie eine kurze, persönliche Einschätzung.",
    questionLabel: (n) => `Frage ${n} von 10`,
    resultReady: "Dein Pulse Score ist bereit.",
    scoreLabel: "/ 100 Pulse Score",
    restart: "Test erneut starten",
    weakestSentence: (a, b) => `Deine zwei schwächsten Bereiche: ${a} und ${b}. Genau hier würde ein Pulse Check ansetzen.`,
    breakdownHeading: "Deine Auswertung nach fünf Bereichen",
    bands: [
      {
        min: 0,
        label: "Erste Anzeichen",
        narrative:
          "Dein Unternehmen steht ganz am Anfang seiner KI-Reise – ein völlig normaler Ausgangspunkt. Das Risiko liegt nicht darin, heute im Rückstand zu sein, sondern dort zu bleiben, während Wettbewerber und Kunden schneller vorankommen.",
      },
      {
        min: 51,
        label: "Stabiler Puls",
        narrative:
          "Du bist den meisten Unternehmen deiner Größe voraus. Die Chance liegt jetzt nicht darin, grundlegende Lücken zu schließen, sondern gezielt zu entscheiden, wo KI als Nächstes den größten Hebel bietet – ohne unnötige Komplexität aufzubauen, die sich nicht auszahlt.",
      },
    ],
    ctaHeading: "Lass uns den größten Hebel finden.",
    ctaBody: "Ein gezielter Pulse Check zeigt genau, welche verbleibenden Lücken es zuerst zu schließen lohnt – und welche nicht.",
    ctaButton: "Erstgespräch buchen",
    leadToggle: "Ergebnis festhalten",
    leadIntro: "Trag deine E-Mail-Adresse ein, wenn du deinen Pulse Score festhalten oder mit uns darüber sprechen möchtest.",
    leadEmailPlaceholder: "Deine E-Mail-Adresse",
    leadConsentText: "Ich bin einverstanden, dass meine Angaben zur Kontaktaufnahme zu meinem Pulse Score verwendet werden, gemäß der",
    leadConsentLinkLabel: "Datenschutzerklärung",
    leadSubmit: "Absenden",
    leadSubmitting: "Wird gesendet…",
    leadThankYou: "Danke! Wir melden uns bei dir.",
    leadError: "Das hat leider nicht geklappt. Bitte versuch es nochmal.",
    questions: [
      {
        area: "data",
        question: "Wie würdest du die Daten deines Unternehmens – Kundendaten, Betriebsdaten, Dokumente – heute beschreiben?",
        options: [
          "Verteilt über verschiedene Systeme, größtenteils auf Papier oder in einzelnen Postfächern und Tabellen",
          "In einigen Systemen zentralisiert, aber nicht einheitlich strukturiert oder gepflegt",
          "Größtenteils zentralisiert und gut strukturiert, mit einigen Lücken",
          "Zentralisiert, strukturiert und aktiv gepflegt mit klarer Verantwortlichkeit",
        ],
      },
      {
        area: "data",
        question: "Wenn jemand jetzt sofort alle Informationen zu einem bestimmten Kunden oder Projekt zusammentragen müsste, wie lange würde das dauern?",
        options: [
          "Tage – die Informationen sind über Personen und Systeme verstreut",
          "Ein paar Stunden manueller Suche",
          "Unter einer Stunde, meist in ein oder zwei Systemen",
          "Minuten – alles ist an einem Ort zugänglich",
        ],
      },
      {
        area: "process",
        question: "Denk an deine wiederkehrendste, zeitaufwändigste operative Aufgabe. Wie wird sie heute erledigt?",
        options: [
          "Vollständig manuell, seit Jahren auf die gleiche Weise",
          "Teilweise durch einfache Tools unterstützt (Tabellen, Vorlagen), aber weiterhin manuell",
          "Etwas Automatisierung oder Softwareunterstützung, aber regelmäßig manuelle Korrekturen nötig",
          "Gut automatisiert, selten manueller Eingriff nötig",
        ],
      },
      {
        area: "process",
        question:
          "Hat schon einmal jemand Schritt für Schritt dokumentiert, wie deine Kernprozesse (z. B. Angebotserstellung, Serviceplanung, Auftragsabwicklung) tatsächlich end-to-end ablaufen?",
        options: [
          "Nein, das Wissen steckt in den Köpfen der Mitarbeitenden",
          "Grob schon, aber veraltet oder unvollständig",
          "Ja, für ein oder zwei Kernprozesse",
          "Ja, dokumentiert und regelmäßig überprüft",
        ],
      },
      {
        area: "team",
        question: "Wie steht dein Team aktuell zum Einsatz von KI-Tools im Arbeitsalltag?",
        options: [
          "Skeptisch oder ablehnend",
          "Neugierig, aber unsicher, wo man anfangen soll",
          "Einzelne experimentieren bereits auf eigene Faust",
          "Aktive Nutzung von KI-Tools, mit Unterstützung durch die Geschäftsführung",
        ],
      },
      {
        area: "team",
        question:
          "Gibt es in deinem Unternehmen jemanden – auch informell –, der für die Erkundung oder Einführung neuer KI- bzw. digitaler Tools verantwortlich ist?",
        options: [
          "Niemanden",
          "Jemand zeigt Interesse, es gehört aber nicht zur eigentlichen Rolle",
          "Ja, informell, neben anderen Aufgaben",
          "Ja, es ist expliziter Teil der Rolle einer Person",
        ],
      },
      {
        area: "tools",
        question: "Wie viele der täglich genutzten Softwaretools (CRM, ERP, Terminplanung, Kommunikation) tauschen automatisch Daten miteinander aus?",
        options: [
          "Keine – alles wird manuell neu eingegeben",
          "Ein bis zwei Integrationen, eher ad hoc eingerichtet",
          "Mehrere Kernsysteme sind verbunden",
          "Die meisten Systeme sind zu einer einheitlichen Toollandschaft verbunden",
        ],
      },
      {
        area: "tools",
        question: "Hast du bereits KI-Funktionen geprüft, die in deiner vorhandenen Software integriert sind (z. B. in CRM, ERP oder Microsoft/Google-Tools)?",
        options: ["Keine bekannt", "Bekannt, aber nie ausprobiert", "Einige ausprobiert, gemischte Ergebnisse", "Aktive Nutzung integrierter KI-Funktionen"],
      },
      {
        area: "governance",
        question: "Wenn ein Mitarbeiter heute ein öffentliches KI-Tool (wie ChatGPT) mit Kunden- oder Geschäftsdaten nutzen würde – wüsste dein Unternehmen davon?",
        options: [
          "Keine Richtlinie oder Sensibilisierung vorhanden",
          "Es gibt ein informelles Verständnis, aber nichts Schriftliches",
          "Es gibt eine schriftliche Richtlinie, die aber nicht aktiv durchgesetzt oder kommuniziert wird",
          "Es gibt eine klare, kommunizierte Richtlinie, die aktiv befolgt wird",
        ],
      },
      {
        area: "governance",
        question: "Wie vertraut ist deine Geschäftsführung mit den Auswirkungen des EU AI Act oder der DSGVO auf den KI-Einsatz in deinem Unternehmen?",
        options: ["Gar nicht", "Vage bewusst, dass es das gibt", "Versteht die Grundlagen", "Berücksichtigt dies aktiv bei Entscheidungen über neue Tools"],
      },
    ],
  },
  en: {
    areaLabels: {
      data: "Data Readiness",
      process: "Process Fit",
      team: "Team Readiness",
      tools: "Tool Stack Maturity",
      governance: "Governance & Risk",
    },
    quizHeading: "AI Pulse Score: how healthy is your AI use?",
    quizMeta: "10 questions, 5 minutes",
    quizIntro: "Answer 10 quick questions across five dimensions and get an instant Pulse Score plus a short personalised benchmark.",
    questionLabel: (n) => `Question ${n} of 10`,
    resultReady: "Your Pulse Score is ready.",
    scoreLabel: "/ 100 Pulse Score",
    restart: "Retake the test",
    weakestSentence: (a, b) => `Your two lowest-scoring dimensions: ${a} and ${b}. A Pulse Check would start exactly there.`,
    breakdownHeading: "Your five-dimension breakdown",
    bands: [
      {
        min: 0,
        label: "Early Signs",
        narrative:
          "Your business is at the very beginning of its AI journey — a completely normal place to be. The risk isn't being behind today; it's staying there while competitors and customers move faster.",
      },
      {
        min: 51,
        label: "Steady Pulse",
        narrative:
          "You're ahead of most companies your size. The opportunity now isn't fixing broken basics — it's making deliberate choices about where AI creates the most leverage next, without adding complexity that doesn't pay for itself.",
      },
    ],
    ctaHeading: "Let's find the highest-leverage next step.",
    ctaBody: "A focused Pulse Check will show you exactly where the remaining gaps are worth closing first, and where they're not.",
    ctaButton: "Book an intro call",
    leadToggle: "Save my result",
    leadIntro: "Leave your email if you'd like to hold on to your Pulse Score or talk it through with us.",
    leadEmailPlaceholder: "Your email address",
    leadConsentText: "I agree that my details may be used to get in touch about my Pulse Score, per the",
    leadConsentLinkLabel: "privacy policy",
    leadSubmit: "Submit",
    leadSubmitting: "Sending…",
    leadThankYou: "Thanks! We'll be in touch.",
    leadError: "Something went wrong. Please try again.",
    questions: [
      {
        area: "data",
        question: "How would you describe your company's data — customer records, operations data, documents — today?",
        options: [
          "Scattered across systems, mostly on paper or in individual inboxes and spreadsheets",
          "Centralised in some systems, but not consistently structured or maintained",
          "Mostly centralised and reasonably well-structured, with some gaps",
          "Centralised, structured, and actively maintained with clear ownership",
        ],
      },
      {
        area: "data",
        question: "If someone needed to pull together everything on a specific customer or project right now, how long would it take?",
        options: [
          "Days — it's scattered across people and systems",
          "A few hours of manual digging",
          "Under an hour, mostly in one or two systems",
          "Minutes — it's accessible in one place",
        ],
      },
      {
        area: "process",
        question: "Think about your most repetitive, time-consuming operational task. How is it handled today?",
        options: [
          "Entirely manual, done the same way for years",
          "Partially supported by basic tools (spreadsheets, templates) but still manual",
          "Some automation or software support, but needs regular manual correction",
          "Well automated, rarely needs manual intervention",
        ],
      },
      {
        area: "process",
        question: "Has anyone mapped out, step by step, how your core processes (e.g. quoting, service scheduling, order processing) actually work end to end?",
        options: [
          "No, it lives in people's heads",
          "Roughly, but it's outdated or incomplete",
          "Yes, for one or two key processes",
          "Yes, documented and regularly reviewed",
        ],
      },
      {
        area: "team",
        question: "How does your team currently feel about using AI tools in their daily work?",
        options: [
          "Skeptical or actively resistant",
          "Curious, but unsure where to start",
          "A few people already experimenting on their own",
          "Actively using AI tools, with encouragement from leadership",
        ],
      },
      {
        area: "team",
        question: "Is there anyone in your company — even informally — responsible for exploring or championing new AI or digital tools?",
        options: [
          "No one",
          "Someone shows interest, but it's not part of their role",
          "Yes, informally, alongside other responsibilities",
          "Yes, it's an explicit part of someone's role",
        ],
      },
      {
        area: "tools",
        question: "How many of the software tools you use daily (CRM, ERP, scheduling, communication) actually talk to each other automatically?",
        options: [
          "None — everything is manual re-entry",
          "One or two integrations, set up ad hoc",
          "Several core systems are connected",
          "Most systems are integrated into one coherent stack",
        ],
      },
      {
        area: "tools",
        question: "Have you evaluated any AI features already built into the software you use (e.g. your CRM, ERP, or Microsoft/Google tools)?",
        options: ["Not aware of any", "Aware, but never tried them", "Tried a few, mixed results", "Actively using built-in AI features"],
      },
      {
        area: "governance",
        question: "If an employee started using a public AI tool (like ChatGPT) with customer or business data today, would your company know?",
        options: [
          "No policy or awareness at all",
          "There's an informal understanding, nothing written down",
          "There's a written policy, but it's not actively enforced or communicated",
          "There's a clear, communicated policy that's actively followed",
        ],
      },
      {
        area: "governance",
        question: "How familiar is your leadership team with what the EU AI Act or GDPR means for using AI in your business?",
        options: ["Not at all", "Vaguely aware it exists", "Generally understand the basics", "Actively factor it into decisions about new tools"],
      },
    ],
  },
};

type QuizState = { step: "question"; index: number; answers: number[] } | { step: "result"; answers: number[] };

const INITIAL_STATE: QuizState = { step: "question", index: 0, answers: [] };

/** Netlify Forms AJAX submission, the same pattern already proven on
 * pulse-landing-page/index.html's `pulse-score-leads` form (see Kontakt.tsx,
 * which uses the identical helper for the `contact` form). */
function encodeFormData(data: Record<string, string>): string {
  return Object.keys(data)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    .join("&");
}

type LeadStatus = "idle" | "submitting" | "sent" | "error";

/**
 * The result step's optional lead capture form — item 1 of the 2026-10-16
 * funnel fixes. It lives inside the result box and is folded open by the
 * "Ergebnis festhalten" button; a visitor who never touches it still sees the
 * full result and the booking link.
 */
function PulseLeadForm({
  copy,
  accent,
  score,
  band,
  weakest,
  emailRef,
}: {
  copy: Copy;
  accent: string;
  score: number;
  band: string;
  weakest: string;
  emailRef: React.RefObject<HTMLInputElement | null>;
}) {
  const { lang, localizedPath } = useLocale();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<LeadStatus>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");

    try {
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encodeFormData({
          "form-name": "pulse-score-leads",
          email,
          score: String(score),
          band,
          weakest,
          lang,
          "bot-field": "",
        }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex items-center gap-2 pt-1">
        <Check size={16} style={{ color: accent }} />
        <p className="text-white/70 font-light" style={{ fontSize: "var(--text-small)" }}>
          {copy.leadThankYou}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-1">
      <p className="text-white/60 font-light leading-snug" style={{ fontSize: "var(--text-small)" }}>
        {copy.leadIntro}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          ref={emailRef}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={copy.leadEmailPlaceholder}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 font-light outline-none transition-colors focus:border-white/30"
          style={{ fontSize: "var(--text-small)" }}
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="font-semibold text-white rounded-lg px-5 py-3 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 shrink-0"
          style={{ fontSize: "var(--text-small)", backgroundColor: accent }}
        >
          {status === "submitting" ? copy.leadSubmitting : copy.leadSubmit}
        </button>
      </div>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 w-4 h-4 shrink-0"
          style={{ accentColor: accent }}
        />
        <span className="text-white/50 font-light leading-relaxed" style={{ fontSize: "var(--text-small)" }}>
          {copy.leadConsentText}{" "}
          <Link to={localizedPath("/datenschutz")} className="text-white/70 underline hover:text-white transition-colors">
            {copy.leadConsentLinkLabel}
          </Link>
          .
        </span>
      </label>
      {status === "error" && (
        <p className="text-[#ef4444] font-light" style={{ fontSize: "var(--text-small)" }}>
          {copy.leadError}
        </p>
      )}
    </form>
  );
}

/**
 * The one box under the breakdown: heading, body and exactly two controls —
 * the booking link (primary) and the "Ergebnis festhalten" toggle (secondary)
 * that folds the lead form open. The form is mounted on the first click and
 * stays mounted when folded shut again, so a half-typed address survives.
 */
function ResultBox({
  copy,
  accent,
  score,
  band,
  weakest,
}: {
  copy: Copy;
  accent: string;
  score: number;
  band: string;
  weakest: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) emailRef.current?.focus();
  }, [open]);

  function toggle() {
    setMounted(true);
    setOpen(!open);
  }

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-white/8 bg-white/[0.02]">
      <h4 className="font-semibold text-white" style={{ fontSize: "var(--text-body)" }}>
        {copy.ctaHeading}
      </h4>
      <p className="text-white/60 font-light leading-snug" style={{ fontSize: "var(--text-small)" }}>
        {copy.ctaBody}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <CtaButton
          href={BOOKING_URL}
          onClick={() => trackEvent(EVENTS.callLinkClicked, PLACEMENTS.quizResult, CTAS.bookCall)}
          backgroundColor={accent}
          showArrow={false}
        >
          {copy.ctaButton}
        </CtaButton>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls="pulse-lead-form"
          className="inline-flex items-center justify-center font-semibold text-white px-[24px] py-[11px] min-h-11 rounded-lg border border-white/30 hover:bg-white/10 hover:border-white/50 transition-colors"
          style={{ fontSize: "var(--text-btn)" }}
        >
          {copy.leadToggle}
        </button>
      </div>
      <div id="pulse-lead-form" hidden={!open}>
        {mounted && <PulseLeadForm copy={copy} accent={accent} score={score} band={band} weakest={weakest} emailRef={emailRef} />}
      </div>
    </div>
  );
}

export function PulseQuiz({
  copy,
  accent,
  onStepChange,
  placement,
}: {
  copy: Copy;
  accent: string;
  /** Lets the surrounding dialog react to the current step (e.g. shrink its
   * always-visible title for the result step so the booking CTA fits above
   * the fold). */
  onStepChange?: (step: QuizState["step"]) => void;
  /** Which button opened the modal — threaded into Quiz Started / Quiz
   * Completed so Plausible can tell two openers apart. */
  placement: string;
}) {
  const [state, setState] = useState<QuizState>(INITIAL_STATE);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  // Set when an answer or a restart replaces the focused button, so the next
  // render moves focus to the new question (or the result) instead of leaving
  // it on a removed element. Not set on open: Radix focuses the dialog itself.
  const moveFocus = useRef(false);
  const startedTracked = useRef(false);

  // The dialog opens on question 1, so "the first question is shown" is the
  // moment PulseQuiz mounts. The ref keeps a StrictMode re-run of the effect
  // from counting twice; the dialog content unmounts on close, so a reopen
  // mounts a fresh PulseQuiz and counts once more.
  useEffect(() => {
    if (startedTracked.current) return;
    startedTracked.current = true;
    trackEvent(EVENTS.quizStarted, placement, CTAS.quiz);
  }, [placement]);

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    if (state.step === "question") headingRef.current?.focus();
    else resultRef.current?.focus();
  }, [state]);

  // Notify the parent synchronously, in the same event-handler tick as the
  // local step change (not via a useEffect, which would commit one render
  // late and let the dialog paint one frame with the previous step's layout
  // — e.g. the full-size title still showing while the result view is
  // already laid out, pushing the booking CTA below the fold for that frame).
  function update(next: QuizState) {
    onStepChange?.(next.step);
    setState(next);
  }

  const scores = useMemo(() => {
    if (state.step !== "result") return null;
    const byArea: Record<Area, number> = { data: 0, process: 0, team: 0, tools: 0, governance: 0 };
    copy.questions.forEach((q, i) => {
      byArea[q.area] += state.answers[i] ?? 0;
    });
    const total = Object.values(byArea).reduce((a, b) => a + b, 0);
    const score = Math.round((total / 30) * 100);
    // Explicit tiebreak: equal-scoring areas keep their AREA_ORDER position
    // rather than relying on Array.sort's stability.
    const weakest = [...AREA_ORDER]
      .sort((a, b) => byArea[a] - byArea[b] || AREA_ORDER.indexOf(a) - AREA_ORDER.indexOf(b))
      .slice(0, 2);
    return { byArea, score, weakest };
  }, [state, copy]);

  function selectOption(optionIndex: number) {
    if (state.step !== "question") return;
    const answers = [...state.answers];
    answers[state.index] = optionIndex;
    moveFocus.current = true;
    if (state.index + 1 < copy.questions.length) {
      update({ step: "question", index: state.index + 1, answers });
    } else {
      trackEvent(EVENTS.quizCompleted, placement, CTAS.quiz);
      update({ step: "result", answers });
    }
  }

  function restart() {
    trackEvent(EVENTS.quizStarted, placement, CTAS.quiz);
    moveFocus.current = true;
    update(INITIAL_STATE);
  }

  if (state.step === "question") {
    const q = copy.questions[state.index];
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          {state.index === 0 && (
            <p className="text-white/60 font-light" style={{ fontSize: "var(--text-body)" }}>
              {copy.quizMeta}
            </p>
          )}
          <span className="font-semibold uppercase tracking-wide" style={{ fontSize: "var(--text-small)", color: accent }}>
            {copy.questionLabel(state.index + 1)} · {copy.areaLabels[q.area]}
          </span>
          <h3
            ref={headingRef}
            tabIndex={-1}
            className="font-semibold text-white leading-snug max-w-2xl outline-none"
            style={{ fontSize: "var(--text-h3)" }}
          >
            {q.question}
          </h3>
        </div>
        <div className="flex flex-col gap-3 max-w-2xl" style={{ "--quiz-accent": accent } as React.CSSProperties}>
          {q.options.map((option, i) => (
            <button
              key={option}
              type="button"
              onClick={() => selectOption(i)}
              className="group flex items-center justify-between gap-4 w-full min-h-11 text-left px-5 py-4 rounded-lg bg-white/10 text-white/90 hover:text-white hover:bg-[var(--quiz-accent)] focus-visible:text-white focus-visible:bg-[var(--quiz-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors font-light leading-snug"
              style={{ fontSize: "var(--text-body)" }}
            >
              <span>{option}</span>
              <ArrowRight size={18} aria-hidden="true" className="shrink-0 opacity-60 group-hover:opacity-100 group-focus-visible:opacity-100" />
            </button>
          ))}
        </div>
        <div className="w-full h-1 rounded-full bg-white/8 max-w-2xl overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${((state.index + 1) / copy.questions.length) * 100}%`, backgroundColor: accent }}
          />
        </div>
      </div>
    );
  }

  if (!scores) return null;
  const band = [...copy.bands].reverse().find((b) => scores.score >= b.min) ?? copy.bands[0];

  return (
    <div className="flex flex-col gap-4">
      <div ref={resultRef} tabIndex={-1} className="flex flex-col gap-2 outline-none">
        <p className="font-light text-white/50" style={{ fontSize: "var(--text-small)" }}>
          {copy.resultReady}
        </p>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="font-semibold text-white" style={{ fontSize: "var(--text-section)" }}>
            {scores.score}
          </span>
          <span className="text-white/50 font-light" style={{ fontSize: "var(--text-body)" }}>
            {copy.scoreLabel}
          </span>
          <span className="font-semibold" style={{ fontSize: "var(--text-h3)", color: accent }}>
            {band.label}
          </span>
        </div>
        <p className="text-white/60 font-light leading-snug" style={{ fontSize: "var(--text-small)" }}>
          {band.narrative}
        </p>
        <p className="text-white/70 font-light leading-snug" style={{ fontSize: "var(--text-small)" }}>
          {copy.weakestSentence(copy.areaLabels[scores.weakest[0]], copy.areaLabels[scores.weakest[1]])}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h4 className="font-semibold text-white" style={{ fontSize: "var(--text-body)" }}>
          {copy.breakdownHeading}
        </h4>
        <div className="flex flex-col gap-2 max-w-xl">
          {AREA_ORDER.map((area) => (
            <div key={area} className="flex items-center gap-4">
              <span className="text-white/60 font-light w-40 shrink-0" style={{ fontSize: "var(--text-small)" }}>
                {copy.areaLabels[area]}
              </span>
              <div className="flex-1 h-2 rounded-full bg-white/8 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(scores.byArea[area] / 6) * 100}%`, backgroundColor: accent }} />
              </div>
              <span className="text-white/50 font-light w-10 text-right" style={{ fontSize: "var(--text-small)" }}>
                {scores.byArea[area]}/6
              </span>
            </div>
          ))}
        </div>
      </div>

      <ResultBox
        copy={copy}
        accent={accent}
        score={scores.score}
        band={band.label}
        weakest={`${copy.areaLabels[scores.weakest[0]]}, ${copy.areaLabels[scores.weakest[1]]}`}
      />

      <button
        type="button"
        onClick={restart}
        className="self-start inline-flex items-center gap-1 text-white/50 hover:text-white transition-colors font-light"
        style={{ fontSize: "var(--text-small)" }}
      >
        {copy.restart} <ArrowRight size={12} />
      </button>
    </div>
  );
}
