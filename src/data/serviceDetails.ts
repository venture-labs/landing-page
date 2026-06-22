import img0 from "@/imports/🖌Homepage/dbadb41a4b5c88ad3dd35824f68948f2c30d8c87.png";
import img1 from "@/imports/🖌Homepage/c013cfa4ca8ece19587b81f26d7b507d598a9bb8.png";
import img2 from "@/imports/🖌Homepage/d6504e7c3760e6a969c4289ed3aa9d40dd93fdc3.png";
import img3 from "@/imports/🖌Homepage/d52f17f888e70b1c693cceb1080bd84b35ab1af5.png";
import img4 from "@/imports/🖌Homepage/7f2c62a56ec4073d7a59f544dbb7b968934eb8eb.png";

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

export interface CaseStat {
  value: string;
  label: string;
}

export interface ServiceDetail {
  slug: string;
  heroHeadline: string;
  heroSubline: string;
  heroImage: string;
  tags: string[];
  process: ProcessStep[];
  caseTitle: string;
  caseSlug: string;
  caseSubtitle: string;
  caseImage: string;
  caseStats: CaseStat[];
  caseDescription: string;
  ctaHeadline: string;
  ctaBody: string;
}

export const serviceDetails: ServiceDetail[] = [
  {
    slug: "development",
    heroHeadline: "Von der Idee zum marktreifen digitalen Produkt",
    heroSubline:
      "Wir entwickeln digitale Lösungen, die Nutzer lieben und mit denen du dein Business voranbringst.",
    heroImage: img0,
    tags: [
      "Schnellster Launch",
      "Revenue-orientiert",
      "Schnelle Produkt-Iteration & Marktvalidierung",
      "Enge Zusammenarbeit",
    ],
    process: [
      {
        number: "01",
        title: "Discovery & Research",
        description:
          "Wir verstehen dein Business, deine Nutzer und den Markt. Workshop-basiert, schnell und fokussiert – damit wir das Richtige bauen.",
      },
      {
        number: "02",
        title: "Ideation & Wireframing",
        description:
          "Ideen werden strukturiert, Flows skizziert und die Produktarchitektur festgelegt. Klarer Plan, bevor die erste Zeile Code geschrieben wird.",
      },
      {
        number: "03",
        title: "Prototyping & Validation",
        description:
          "Klickbare Prototypen mit echten Nutzern testen – bevor wir entwickeln. So reduzieren wir Risiken und sparen Entwicklungszeit.",
      },
      {
        number: "04",
        title: "Design & Development",
        description:
          "Pixelgenaues UI trifft sauberen Code. Unser Full-Stack-Team baut schnell, iterativ und mit voller Transparenz.",
      },
      {
        number: "05",
        title: "Launch & Scale",
        description:
          "Deployment, Monitoring, Analytics – und kontinuierliche Verbesserung nach dem Launch. Wir bleiben dabei.",
      },
    ],
    caseTitle: "Tap2Link",
    caseSlug: "tap2link",
    caseSubtitle: "Tap2Link: Mehr als eine digitale Visitenkarte.",
    caseImage: img1,
    caseStats: [
      { value: "+35%", label: "Schnellerer Onboarding-Prozess" },
      { value: "-20%", label: "Reduzierter Support-Aufwand" },
      { value: "+40%", label: "Mehr Nutzerinteraktionen" },
    ],
    caseDescription:
      "Ein digitales Serviceportal für komplexe B2B-Prozesse – in nur 8 Wochen von der Idee bis zum Launch.",
    ctaHeadline: "Bereit, dein Produkt zu bauen?",
    ctaBody:
      "Lass uns in einem kostenlosen Erstgespräch herausfinden, wie wir deine Idee in ein marktreifes Produkt verwandeln können.",
  },
  {
    slug: "webdesign",
    heroHeadline: "Design, das konvertiert und begeistert",
    heroSubline:
      "Von der ersten Skizze bis zum live geschalteten Interface – wir gestalten digitale Produkte, die Nutzer wirklich verstehen.",
    heroImage: img2,
    tags: [
      "UX Research",
      "Pixel-perfektes UI",
      "Design Systems",
      "Mobile-First",
    ],
    process: [
      {
        number: "01",
        title: "UX Research & Analysis",
        description:
          "Nutzerinterviews, Wettbewerbsanalyse und Heuristic Evaluation legen den Grundstein für fundierte Design-Entscheidungen.",
      },
      {
        number: "02",
        title: "User Flows & Architecture",
        description:
          "Information Architecture und User Flows sorgen dafür, dass Nutzer immer wissen, wo sie sind und was als nächstes kommt.",
      },
      {
        number: "03",
        title: "Wireframes & Konzept",
        description:
          "Lo-Fi Wireframes zeigen die Struktur, bevor wir ins Detail gehen. Schnelles Feedback, schnelle Iteration.",
      },
      {
        number: "04",
        title: "Visual Design & Prototyping",
        description:
          "Hochauflösendes UI-Design in Figma, inklusive Design System und klickbarem Prototypen für User Tests.",
      },
      {
        number: "05",
        title: "Design Handoff & Support",
        description:
          "Pixel-genaue Übergabe ans Entwicklungsteam mit vollständiger Dokumentation und Dev-Mode Annotations.",
      },
    ],
    caseTitle: "Brylliant",
    caseSlug: "brylliant",
    caseSubtitle: "Brylliant: Das Tool für perfekte Briefings.",
    caseImage: img2,
    caseStats: [
      { value: "2×", label: "Schnellere Briefing-Freigaben" },
      { value: "95%", label: "Weniger Rückfragen" },
      { value: "+60%", label: "Höhere Nutzerzufriedenheit" },
    ],
    caseDescription:
      "Ein skalierbares Tool für effiziente Briefings, saubere Prozesse und strategische Klarheit – designed in 6 Wochen.",
    ctaHeadline: "Design, das wirklich wirkt.",
    ctaBody:
      "Lass uns zeigen, wie durchdachtes UX/UI-Design deinen Conversion-Rate und Nutzerzufriedenheit steigert.",
  },
  {
    slug: "ki-strategie",
    heroHeadline: "KI-Potenziale erkennen und konsequent nutzen",
    heroSubline:
      "Wir helfen dir dabei, die richtigen KI-Tools zu finden, zu integrieren und echten Business-Wert daraus zu ziehen.",
    heroImage: img4,
    tags: [
      "OpenAI & Gemini",
      "Workflow-Automatisierung",
      "Custom KI-Agenten",
      "Schnelle Umsetzung",
    ],
    process: [
      {
        number: "01",
        title: "KI-Readiness Assessment",
        description:
          "Analyse deiner aktuellen Prozesse, Datenlandschaft und Tech-Stack – um zu verstehen, wo KI den größten Hebel hat.",
      },
      {
        number: "02",
        title: "Use Case Identifikation",
        description:
          "Gemeinsam priorisieren wir die KI-Anwendungsfälle mit dem besten ROI: Automatisierungen, Agenten oder generative Tools.",
      },
      {
        number: "03",
        title: "Prototyping & Proof of Concept",
        description:
          "Schnell zeigen, was möglich ist. Wir bauen einen funktionierenden Prototypen in 2–4 Wochen – damit du echten Mehrwert siehst.",
      },
      {
        number: "04",
        title: "Integration & Rollout",
        description:
          "Von der Idee in die Produktion: OpenAI, Claude, Zapier, Make, n8n – wir integrieren KI nahtlos in deinen bestehenden Stack.",
      },
      {
        number: "05",
        title: "Monitoring & Optimierung",
        description:
          "KI ist kein einmaliges Projekt. Wir begleiten den laufenden Betrieb, messen Outputs und optimieren kontinuierlich.",
      },
    ],
    caseTitle: "MachineMaster",
    caseSlug: "machinemaster",
    caseSubtitle: "MachineMaster: KI im Vertrieb von Landmaschinen.",
    caseImage: img3,
    caseStats: [
      { value: "+230%", label: "Mehr Nutzerinteraktionen" },
      { value: "+10%", label: "Verkaufssteigerung" },
      { value: "5/5", label: "Kundenbewertungen" },
    ],
    caseDescription:
      "Ein KI-gestütztes Vertriebstool für Händler und Außendienst – vom MVP in nur 12 Wochen.",
    ctaHeadline: "KI konkret, nicht theoretisch.",
    ctaBody:
      "In einem kostenlosen Erstgespräch zeigen wir dir, welche KI-Maßnahmen in deinem Business sofort Wirkung zeigen.",
  },
  {
    slug: "company-building",
    heroHeadline: "Von der Idee zum funktionierenden Unternehmen",
    heroSubline:
      "Wir helfen Teams, neue Geschäftsmodelle zu entwickeln, zu validieren und in marktfähige Produkte zu überführen.",
    heroImage: img0,
    tags: [
      "MVP in 12 Wochen",
      "Geschäftsmodell-Design",
      "Go-to-Market",
      "Team-Aufbau",
    ],
    process: [
      {
        number: "01",
        title: "Idee & Vision",
        description:
          "Wir helfen dir, deine Idee zu schärfen: Was ist das echte Problem? Wer ist die Zielgruppe? Was macht dich einzigartig?",
      },
      {
        number: "02",
        title: "Business Model Design",
        description:
          "Lean Canvas, Value Proposition und Revenue-Modell – wir entwickeln ein tragfähiges Geschäftsmodell auf Basis echter Marktdaten.",
      },
      {
        number: "03",
        title: "MVP Strategie & Scope",
        description:
          "Was ist das kleinstmögliche Produkt, das du validieren kannst? Wir definieren den MVP-Scope und priorisieren gnadenlos.",
      },
      {
        number: "04",
        title: "Build & Launch",
        description:
          "Unser Team baut das MVP – Design, Entwicklung, Messaging. In 8–16 Wochen ist dein Produkt live.",
      },
      {
        number: "05",
        title: "Traction & Scale",
        description:
          "Erste Nutzer, erstes Feedback, erste Revenue. Wir begleiten die frühe Wachstumsphase und helfen beim Aufbau eines eigenen Teams.",
      },
    ],
    caseTitle: "Moerschen",
    caseSlug: "moerschen",
    caseSubtitle: "Moerschen: Vom Relaunch zur Leadmaschine.",
    caseImage: img3,
    caseStats: [
      { value: "+45%", label: "Mehr Kontaktanfragen" },
      { value: "8 Wo.", label: "Vom Kickoff bis Launch" },
      { value: "2×", label: "Schnellere Ansprechpartner-Suche" },
    ],
    caseDescription:
      "Website-Relaunch mit klarer Nutzerführung und neuer Kommunikationsstrategie – in 8 Wochen live.",
    ctaHeadline: "Dein Startup. Unsere Erfahrung.",
    ctaBody:
      "Lass uns gemeinsam herausfinden, wie wir dein Geschäftsmodell schnell und sicher in die Realität umsetzen.",
  },
];
