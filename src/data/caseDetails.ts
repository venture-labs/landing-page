import tapContainer from "@/assets/Container.png";
import tapFrame1 from "@/assets/Frame 1618868208.png";
import tapFrame2 from "@/assets/Frame 1618868209.png";
import mockups from "@/assets/Container-1.png";

export interface CaseDetail {
  slug: string;
  category: string;
  heroHeadline: string;
  heroSubline: string;
  heroImage: string;
  description: string;
  background: string;
  problem: string;
  solution: string;
  stats: {
    value: string;
    label: string;
  }[];
  mockupImages: string[];
}

export const caseDetailsMap: Record<string, CaseDetail> = {
  "tap2link": {
    slug: "tap2link",
    category: "Digitale Kontakt- & Serviceecosysteme",
    heroHeadline: "Multifunktionale App für Events, Services & Teams",
    heroSubline: "Ein digitales Serviceportal für komplexe B2B-Prozesse in nur 8 Wochen.",
    heroImage: tapFrame1,
    description: "Tap2Link ist eine vollständig neue, multifunktionale Plattform für Events, Services und Teams. Wir haben die Anwendung von Grund auf mit modernem Design und nutzerfreundlicher Oberfläche entwickelt.",
    background: "Die ursprüngliche Plattform war technisch veraltet und konnte die wachsenden Anforderungen der Nutzer nicht erfüllen. Das Unternehmen benötigte eine Komplettneubau mit neuem Design-System.",
    problem: "Viele Anforderungen, unklare Priorisierung, Verschiedene Stakeholder mit unterschiedlichen Visionen, Technische Schulden aus Legacy-Code, Knappe Zeitvorgaben.",
    solution: "Modulare App-Architektur mit sauberer Separation of Concerns, Modernes React-Stack mit TypeScript für Typ-Sicherheit, Iterative Entwicklung mit wöchentlichen Reviews, Agile Priorisierung mit klarer Nutzer-Fokussierung, Design-System für schnelle Konsistenz.",
    stats: [
      { value: "+300%", label: "mehr App-Installationen nach Launch" },
      { value: "5 Sek", label: "bis zum vollständigen Profilein Upload via NFC" },
      { value: "+60%", label: "Conversion bei Messegesprächsterminen" },
    ],
    mockupImages: [tapContainer, tapFrame1, mockups],
  },
};

export function getCaseDetail(slug: string): CaseDetail | undefined {
  return caseDetailsMap[slug];
}
