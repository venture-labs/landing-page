import { useMemo, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { useLocale } from "@/app/locale";
import { CtaButton } from "@/app/components/ui/CtaButton";

/**
 * Pulse Check / Build / Care structure and the 10-question Pulse Score quiz,
 * transposed from the live pulse.venturelabs.team site (both content and
 * quiz logic captured directly from the running app, DE + EN). Not part of
 * the markdown content — this is a fixed product feature specific to the
 * "ai-consulting" service page, so it's plain code rather than CMS content.
 *
 * The score narrative is verified for the two ends of the 0–100 range
 * ("Erste Anzeichen"/"Early Signs" at the low end, "Stabiler Puls"/"Steady
 * Pulse" in the mid-high range) — the live quiz likely has more granular
 * bands in between that weren't sampled, so this uses a simple 50-point
 * split between the two verified narratives rather than inventing more.
 */

type Area = "data" | "process" | "team" | "tools" | "governance";
const AREA_ORDER: Area[] = ["data", "process", "team", "tools", "governance"];

interface QuizQuestion {
  area: Area;
  question: string;
  options: string[];
}

interface Copy {
  pulseHeading: string;
  pulseIntro: string;
  steps: {
    stepLabel: string;
    title: string;
    price: string;
    description: string;
    inputLabel: string;
    input: string;
    outputLabel: string;
    output: string;
    bullets: string[];
    footnote: string;
  }[];
  areaLabels: Record<Area, string>;
  quizHeading: string;
  quizIntro: string;
  startCta: string;
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
}

const COPY: Record<"de" | "en", Copy> = {
  de: {
    pulseHeading: "Pulse Check, Build, Care",
    pulseIntro:
      "Jeder Schritt baut auf dem vorherigen auf. Du entscheidest nach jedem Schritt, ob es weitergeht – ganz ohne Verpflichtung zum nächsten.",
    steps: [
      {
        stepLabel: "Schritt 1 · Einstieg",
        title: "Pulse Check",
        price: "Ab 2.900 €",
        description:
          "1–2 Tage strukturierte Analyse über deine Abteilungen hinweg, geliefert als priorisierte Roadmap.",
        inputLabel: "Input",
        input: "Deine aktuellen Prozesse, Daten und deine Tool-Landschaft – so, wie sie heute sind.",
        outputLabel: "Output",
        output: "Eine priorisierte Roadmap mit den 1–3 Anwendungsfällen mit dem größten Hebel.",
        bullets: ["AI Vital Signs Report", "Priorisierter Opportunity-Backlog", "Kein 40-seitiger Bericht, den niemand liest"],
        footnote: "Der einzige Schritt, den du direkt buchen kannst.",
      },
      {
        stepLabel: "Schritt 2 · Falls sinnvoll",
        title: "Pulse Build",
        price: "Ab 15.000 €",
        description:
          "Sobald der Pulse Check zeigt, wo der größte Hebel liegt, setzen wir gemeinsam die 1–3 wichtigsten Anwendungsfälle um.",
        inputLabel: "Input",
        input: "Der priorisierte Anwendungsfall aus deinem Pulse Check.",
        outputLabel: "Output",
        output: "Eine funktionierende Lösung im Produktivbetrieb – kein Prototyp für die Schublade.",
        bullets: [
          "4 Wochen Standardumfang, erweiterbar auf 8",
          "Dedizierter Entwickler, feste Ansprechperson während der gesamten Umsetzung",
          "Festpreis mit klar definiertem Umfang – keine versteckten Kosten",
        ],
        footnote: "Wird nach deinem Pulse Check gemeinsam entschieden – kein eigenständiges Angebot.",
      },
      {
        stepLabel: "Schritt 3 · Nach dem Build",
        title: "Pulse Care",
        price: "Ab 2.500 €/Monat",
        description: "Sobald eine erste Lösung läuft, halten wir sie mit dir aktuell: 2 Termine pro Monat plus Dashboard-Zugriff.",
        inputLabel: "Input",
        input: "Die im Pulse Build gebaute Lösung.",
        outputLabel: "Output",
        output: "Eine Lösung, die läuft, überwacht wird und mit deinem Geschäft mitwächst.",
        bullets: ["Monatliches Dashboard-Tracking", "Vierteljährliches Deep-Review", "Jährlicher Pulse-Check-Refresh"],
        footnote: "Relevant, sobald wir gemeinsam etwas gebaut haben.",
      },
    ],
    areaLabels: {
      data: "Datenbasis",
      process: "Prozesse",
      team: "Team",
      tools: "Tool-Stack",
      governance: "Governance & Risiko",
    },
    quizHeading: "Wie gesund ist dein KI-Einsatz?",
    quizIntro:
      "Beantworte 10 kurze Fragen zu fünf Bereichen und erhalte sofort deinen Pulse Score sowie eine kurze, persönliche Einschätzung.",
    startCta: "Meinen Pulse Score prüfen →",
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
        min: 50,
        label: "Stabiler Puls",
        narrative:
          "Du bist den meisten Unternehmen deiner Größe voraus. Die Chance liegt jetzt nicht darin, grundlegende Lücken zu schließen, sondern gezielt zu entscheiden, wo KI als Nächstes den größten Hebel bietet – ohne unnötige Komplexität aufzubauen, die sich nicht auszahlt.",
      },
    ],
    ctaHeading: "Lass uns den größten Hebel finden.",
    ctaBody: "Ein gezielter Pulse Check zeigt genau, welche verbleibenden Lücken es zuerst zu schließen lohnt – und welche nicht.",
    ctaButton: "Nächste Schritte ansehen →",
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
    pulseHeading: "Pulse Check, Build, Care",
    pulseIntro:
      "Each step builds on the last. You decide after every step whether to continue — no obligation to move to the next one.",
    steps: [
      {
        stepLabel: "Step 1 · Starting point",
        title: "Pulse Check",
        price: "Starting at €2,900",
        description: "1–2 days of structured analysis across your departments, delivered as a prioritised roadmap.",
        inputLabel: "Input",
        input: "Your current processes, data, and tool stack — as they are today.",
        outputLabel: "Output",
        output: "A prioritised roadmap naming the 1–3 highest-leverage use cases.",
        bullets: ["AI Vital Signs Report", "Prioritised opportunity backlog", "Not a 40-page report nobody reads"],
        footnote: "The only step you book directly.",
      },
      {
        stepLabel: "Step 2 · If it makes sense",
        title: "Pulse Build",
        price: "Starting at €15,000",
        description: "Once your Pulse Check has shown where the leverage is, we build the 1–3 highest-priority use cases together.",
        inputLabel: "Input",
        input: "The priority use case from your Pulse Check.",
        outputLabel: "Output",
        output: "A working solution in production — not a prototype that sits on a shelf.",
        bullets: [
          "4-week standard scope, extendable to 8",
          "A dedicated developer and a single point of contact throughout",
          "Fixed price with a clearly defined scope — no hidden costs",
        ],
        footnote: "Decided together after your Pulse Check — not a standalone purchase.",
      },
      {
        stepLabel: "Step 3 · After the build",
        title: "Pulse Care",
        price: "Starting at €2,500/month",
        description: "Once a first solution is live, we keep it current with you: 2 scheduled calls a month plus dashboard access.",
        inputLabel: "Input",
        input: "The solution built during your Pulse Build.",
        outputLabel: "Output",
        output: "A solution that stays live, monitored, and current as your business evolves.",
        bullets: ["Monthly dashboard tracking", "Quarterly deep review", "Annual Pulse Check refresh"],
        footnote: "Relevant once we've built something together.",
      },
    ],
    areaLabels: {
      data: "Data Readiness",
      process: "Process Fit",
      team: "Team Readiness",
      tools: "Tool Stack Maturity",
      governance: "Governance & Risk",
    },
    quizHeading: "How healthy is your AI use?",
    quizIntro: "Answer 10 quick questions across five dimensions and get an instant Pulse Score plus a short personalised benchmark.",
    startCta: "Check my Pulse Score →",
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
        min: 50,
        label: "Steady Pulse",
        narrative:
          "You're ahead of most companies your size. The opportunity now isn't fixing broken basics — it's making deliberate choices about where AI creates the most leverage next, without adding complexity that doesn't pay for itself.",
      },
    ],
    ctaHeading: "Let's find the highest-leverage next step.",
    ctaBody: "A focused Pulse Check will show you exactly where the remaining gaps are worth closing first, and where they're not.",
    ctaButton: "See the next steps →",
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

function PulsePricing({ copy, accent }: { copy: Copy; accent: string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {copy.steps.map((step) => (
        <div key={step.title} className="flex flex-col gap-5 p-7 rounded-xl border border-white/8 bg-white/[0.02]">
          <div className="flex flex-col gap-1">
            <span className="font-['sofia-pro',sans-serif] font-semibold uppercase tracking-wide" style={{ fontSize: "var(--text-small)", color: accent }}>
              {step.stepLabel}
            </span>
            <h3 className="font-['sofia-pro',sans-serif] font-semibold text-white" style={{ fontSize: "var(--text-h2)" }}>
              {step.title}
            </h3>
            <span className="font-['sofia-pro',sans-serif] font-semibold text-white/70" style={{ fontSize: "var(--text-body)" }}>
              {step.price}
            </span>
          </div>
          <p className="text-white/60 font-['sofia-pro',sans-serif] font-light leading-relaxed" style={{ fontSize: "var(--text-body)" }}>
            {step.description}
          </p>
          <div className="flex flex-col gap-2 text-white/50 font-['sofia-pro',sans-serif] font-light" style={{ fontSize: "var(--text-small)" }}>
            <p>
              <span className="text-white/70 font-semibold">{step.inputLabel}: </span>
              {step.input}
            </p>
            <p>
              <span className="text-white/70 font-semibold">{step.outputLabel}: </span>
              {step.output}
            </p>
          </div>
          <ul className="flex flex-col gap-2 mt-1">
            {step.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-white/70 font-['sofia-pro',sans-serif] font-light leading-snug" style={{ fontSize: "var(--text-small)" }}>
                <Check size={13} style={{ color: accent }} strokeWidth={3} className="mt-0.5 shrink-0" />
                {b}
              </li>
            ))}
          </ul>
          <p className="text-white/35 font-['sofia-pro',sans-serif] font-light italic mt-auto" style={{ fontSize: "var(--text-small)" }}>
            {step.footnote}
          </p>
        </div>
      ))}
    </div>
  );
}

type QuizState = { step: "intro" } | { step: "question"; index: number; answers: number[] } | { step: "result"; answers: number[] };

function PulseQuiz({ copy, accent }: { copy: Copy; accent: string }) {
  const [state, setState] = useState<QuizState>({ step: "intro" });
  const { localizedPath } = useLocale();

  const scores = useMemo(() => {
    if (state.step !== "result") return null;
    const byArea: Record<Area, number> = { data: 0, process: 0, team: 0, tools: 0, governance: 0 };
    copy.questions.forEach((q, i) => {
      byArea[q.area] += state.answers[i] ?? 0;
    });
    const total = Object.values(byArea).reduce((a, b) => a + b, 0);
    const score = Math.round((total / 30) * 100);
    const weakest = [...AREA_ORDER].sort((a, b) => byArea[a] - byArea[b]).slice(0, 2);
    return { byArea, score, weakest };
  }, [state, copy]);

  function selectOption(optionIndex: number) {
    if (state.step !== "question") return;
    const answers = [...state.answers];
    answers[state.index] = optionIndex;
    if (state.index + 1 < copy.questions.length) {
      setState({ step: "question", index: state.index + 1, answers });
    } else {
      setState({ step: "result", answers });
    }
  }

  if (state.step === "intro") {
    return (
      <div className="flex flex-col gap-6 items-start">
        <p className="text-white/60 font-['sofia-pro',sans-serif] font-light leading-relaxed max-w-xl" style={{ fontSize: "var(--text-body)" }}>
          {copy.quizIntro}
        </p>
        <button
          onClick={() => setState({ step: "question", index: 0, answers: [] })}
          className="inline-flex items-center gap-2 text-white font-['sofia-pro',sans-serif] font-semibold px-6 py-3 rounded-lg transition-all hover:scale-[1.02]"
          style={{ fontSize: "var(--text-btn)", backgroundColor: accent }}
        >
          {copy.startCta}
        </button>
      </div>
    );
  }

  if (state.step === "question") {
    const q = copy.questions[state.index];
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="font-['sofia-pro',sans-serif] font-semibold uppercase tracking-wide" style={{ fontSize: "var(--text-small)", color: accent }}>
            {copy.questionLabel(state.index + 1)} · {copy.areaLabels[q.area]}
          </span>
          <h3 className="font-['sofia-pro',sans-serif] font-semibold text-white leading-snug max-w-2xl" style={{ fontSize: "var(--text-h2)" }}>
            {q.question}
          </h3>
        </div>
        <div className="flex flex-col gap-3 max-w-2xl">
          {q.options.map((option, i) => (
            <button
              key={option}
              onClick={() => selectOption(i)}
              className="text-left px-5 py-4 rounded-lg border border-white/10 text-white/80 hover:text-white hover:border-white/30 transition-colors font-['sofia-pro',sans-serif] font-light leading-snug"
              style={{ fontSize: "var(--text-body)" }}
            >
              {option}
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
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <p className="font-['sofia-pro',sans-serif] font-light text-white/50" style={{ fontSize: "var(--text-small)" }}>
          {copy.resultReady}
        </p>
        <div className="flex items-end gap-3">
          <span className="font-['sofia-pro',sans-serif] font-semibold" style={{ fontSize: "var(--text-hero)", color: accent }}>
            {band.label}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-['sofia-pro',sans-serif] font-semibold text-white" style={{ fontSize: "var(--text-hero)" }}>
            {scores.score}
          </span>
          <span className="text-white/50 font-['sofia-pro',sans-serif] font-light" style={{ fontSize: "var(--text-body)" }}>
            {copy.scoreLabel}
          </span>
        </div>
        <p className="text-white/60 font-['sofia-pro',sans-serif] font-light leading-relaxed max-w-2xl" style={{ fontSize: "var(--text-body)" }}>
          {band.narrative}
        </p>
        <p className="text-white/70 font-['sofia-pro',sans-serif] font-light leading-relaxed max-w-2xl" style={{ fontSize: "var(--text-body)" }}>
          {copy.weakestSentence(copy.areaLabels[scores.weakest[0]], copy.areaLabels[scores.weakest[1]])}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <h4 className="font-['sofia-pro',sans-serif] font-semibold text-white" style={{ fontSize: "var(--text-body)" }}>
          {copy.breakdownHeading}
        </h4>
        <div className="flex flex-col gap-3 max-w-xl">
          {AREA_ORDER.map((area) => (
            <div key={area} className="flex items-center gap-4">
              <span className="text-white/60 font-['sofia-pro',sans-serif] font-light w-40 shrink-0" style={{ fontSize: "var(--text-small)" }}>
                {copy.areaLabels[area]}
              </span>
              <div className="flex-1 h-2 rounded-full bg-white/8 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(scores.byArea[area] / 6) * 100}%`, backgroundColor: accent }} />
              </div>
              <span className="text-white/50 font-['sofia-pro',sans-serif] font-light w-10 text-right" style={{ fontSize: "var(--text-small)" }}>
                {scores.byArea[area]}/6
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 p-7 rounded-xl border border-white/8 bg-white/[0.02] max-w-2xl">
        <h4 className="font-['sofia-pro',sans-serif] font-semibold text-white" style={{ fontSize: "var(--text-h2)" }}>
          {copy.ctaHeading}
        </h4>
        <p className="text-white/60 font-['sofia-pro',sans-serif] font-light leading-relaxed" style={{ fontSize: "var(--text-body)" }}>
          {copy.ctaBody}
        </p>
        <div className="flex flex-wrap items-center gap-4 mt-1">
          <CtaButton href={localizedPath("/#kontakt")} backgroundColor={accent} showArrow={false}>
            {copy.ctaButton}
          </CtaButton>
          <button
            onClick={() => setState({ step: "intro" })}
            className="inline-flex items-center gap-1 text-white/50 hover:text-white transition-colors font-['sofia-pro',sans-serif] font-light"
            style={{ fontSize: "var(--text-small)" }}
          >
            {copy.restart} <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function PulseSection({ accent }: { accent: string }) {
  const { lang } = useLocale();
  const copy = COPY[lang];
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-[#181620] py-24" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col gap-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-10"
        >
          <div className="flex flex-col gap-4">
            <h2 className="font-['sofia-pro',sans-serif] font-semibold text-white leading-tight" style={{ fontSize: "var(--text-hero)" }}>
              {copy.pulseHeading}
            </h2>
            <p className="text-white/60 font-['sofia-pro',sans-serif] font-light leading-relaxed max-w-2xl" style={{ fontSize: "var(--text-body)" }}>
              {copy.pulseIntro}
            </p>
          </div>
          <PulsePricing copy={copy} accent={accent} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col gap-8 p-8 lg:p-12 rounded-2xl border border-white/8 bg-white/[0.015]"
        >
          <h3 className="font-['sofia-pro',sans-serif] font-semibold text-white leading-tight" style={{ fontSize: "var(--text-section)" }}>
            {copy.quizHeading}
          </h3>
          <PulseQuiz copy={copy} accent={accent} />
        </motion.div>
      </div>
    </section>
  );
}
