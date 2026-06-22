export interface PricingPlan {
  slug: string;
  title: string;
  price: string;
  priceUnit: string;
  badge: string;
  badgeColor: string;
  description: string;
  cta: string;
  features: string[];
}

export const pricingPlans: PricingPlan[] = [
  {
    slug: "erstgespraech",
    title: "Kostenloses Erstgespräch",
    price: "0 €",
    priceUnit: "",
    badge: "Schnellstart",
    badgeColor: "#FBBA10",
    description:
      "Ideal für Teams, die eine Idee haben oder ein Problem lösen wollen. Wir setzen uns 1 Stunde mit euch zusammen, hören zu, denken mit – und geben erste Impulse zur Umsetzung.",
    cta: "Termin ausmachen",
    features: [
      "Senior Designer",
      "Miro Board mit Stickies",
      "Projektmanager",
      "Ideen gehören dir",
    ],
  },
  {
    slug: "workshop",
    title: "Workshop mit unserem Team",
    price: "3.000 €",
    priceUnit: "/Monat",
    badge: "Schnellstart +",
    badgeColor: "#2448D9",
    description:
      "Gemeinsam mit Product Leads & Design Thinkern analysieren wir euer Vorhaben und entwickeln konkrete, umsetzbare Ideen – visuell, strategisch und realistisch.",
    cta: "Workshop buchen",
    features: [
      "2 Senior Designer",
      "Figma Prototype",
      "Product Strategist",
      "Alle Deliverables gehören euch",
    ],
  },
  {
    slug: "entwicklung",
    title: "Entwicklung einer App",
    price: "25.000 €",
    priceUnit: "/Projekt",
    badge: "Vollpaket",
    badgeColor: "#A318F8",
    description:
      "Von der Idee bis zum Live-Produkt: Wir bauen euer digitales Produkt – mit klaren Meilensteinen, einem dedizierten Team und voller Transparenz bei Zeit & Budget.",
    cta: "Projekt starten",
    features: [
      "Full-Stack Entwicklungsteam",
      "UX/UI Design inklusive",
      "Dedizierter Projektmanager",
      "4–16 Wochen bis zum Launch",
      "Source Code & IP gehören euch",
    ],
  },
];
