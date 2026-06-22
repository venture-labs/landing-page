import img0 from "@/imports/🖌Homepage/dbadb41a4b5c88ad3dd35824f68948f2c30d8c87.png";
import img1 from "@/imports/🖌Homepage/c013cfa4ca8ece19587b81f26d7b507d598a9bb8.png";
import img2 from "@/imports/🖌Homepage/d6504e7c3760e6a969c4289ed3aa9d40dd93fdc3.png";
import img3 from "@/imports/🖌Homepage/d52f17f888e70b1c693cceb1080bd84b35ab1af5.png";
import img4 from "@/imports/🖌Homepage/7f2c62a56ec4073d7a59f544dbb7b968934eb8eb.png";
import img5 from "@/imports/🖌Homepage/7e86fee36ef0dba98c3309c192edd401ec8c68af.png";
import img6 from "@/imports/🖌Homepage/6af5dedda546c76e0356b1a8128af3e08a997ce8.png";
import img7 from "@/imports/🖌Homepage/7d373d13b0296a4ea23c72481c85a352e794d58e.png";

export interface FeaturedCase {
  slug: string;
  title: string;
  subtitle: string;
  imagePosition: "left" | "right";
  stats: string[];
  image: string;
}

export interface GridCase {
  slug: string;
  title: string;
  subtitle: string;
  image: string;
}

export const featuredCases: FeaturedCase[] = [
  {
    slug: "tap2link",
    title: "Tap2Link – Mehr als eine digitale Visitenkarte.",
    subtitle:
      "Ein digitales Serviceportal für komplexe B2B-Prozesse in nur 8 Wochen.",
    imagePosition: "right",
    stats: [
      "+230% Nutzerinteraktion",
      "Launch in 16 Wochen",
      "95% Kundenzufriedenheit",
    ],
    image: img1,
  },
  {
    slug: "brylliant",
    title: "Brylliant – das Tool für perfekte Briefings",
    subtitle:
      "Ein skalierbares Tool für effiziente Briefings, saubere Prozesse und strategische Klarheit.",
    imagePosition: "left",
    stats: [
      "Strukturierte Vorlagen & geführte Briefings",
      "2x schnellere Briefing-Freigaben",
      "95 % weniger Rückfragen von Agenturen",
    ],
    image: img2,
  },
  {
    slug: "moerschen",
    title: "Moerschen – Website-Relaunch für bessere Kommunikation",
    subtitle:
      "Ein digitales Serviceportal für komplexe B2B-Prozesse in nur 8 Wochen.",
    imagePosition: "right",
    stats: [
      "45 % mehr Kontaktanfragen über die Website",
      "Nutzer finden Ansprechpersonen 2× schneller als vorher",
      "8 Wochen vom Kickoff bis Livegang",
    ],
    image: img3,
  },
  {
    slug: "machinemaster",
    title: "MachineMaster – Landmaschinen Vertriebsplattform",
    subtitle:
      "Ein digitales Vertriebstool für Händler, Vertrieb & Außendienst – zum MVP in nur 12 Wochen",
    imagePosition: "left",
    stats: [
      "+230 % Nutzerinteraktionen",
      "Verkaufssteigerung um 10%",
      "5/5 Sternen in den Bewertungen",
    ],
    image: img0,
  },
];

export const gridCases: GridCase[] = [
  {
    slug: "neuer-look",
    title: "Neuer Look, neue Webseite",
    subtitle:
      "Ein digitales Serviceportal für komplexe B2B-Prozesse in nur 8 Wochen.",
    image: img4,
  },
  {
    slug: "animation",
    title: "Animation für mehr Nachhaltigkeit",
    subtitle:
      "Ein digitales Serviceportal für komplexe B2B-Prozesse in nur 8 Wochen.",
    image: img5,
  },
  {
    slug: "scanservice",
    title: "Dein ScanService",
    subtitle:
      "Ein digitales Serviceportal für komplexe B2B-Prozesse in nur 8 Wochen.",
    image: img6,
  },
];

export { img7 };
