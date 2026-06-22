import { Users, Layers, Zap, Handshake } from "lucide-react";

const features = [
  {
    icon: <Users size={20} strokeWidth={2} />,
    title: "Nutzerzentrierte Konzeption",
    subtitle: "Verstehen, was Nutzer wirklich brauchen",
  },
  {
    icon: <Layers size={20} strokeWidth={2} />,
    title: "Skalierbare Architektur",
    subtitle: "Technologie, die mit deinem Business wächst",
  },
  {
    icon: <Zap size={20} strokeWidth={2} />,
    title: "Schnelles Prototyping & Testing",
    subtitle: "Ideen früh validieren und iterieren",
  },
  {
    icon: <Handshake size={20} strokeWidth={2} />,
    title: "Enge Zusammenarbeit & Transparenz",
    subtitle: "Du bist Teil des Entwicklungsprozesses",
  },
];

export function StrengthSection() {
  return (
    <div className="flex flex-col gap-[48px] w-full">
      {/* Header bar */}
      <div className="bg-[#291e3d] w-full">
        <div className="flex gap-[64px] items-start p-[32px]">
          <p
            className="font-['Sofia_Pro',sans-serif] font-semibold text-white leading-none whitespace-pre-wrap shrink-0 w-[45%]"
            style={{ fontSize: "clamp(1.2rem, 1.75vw, 1.75rem)" }}
          >
            {"Unsere Stärke:\nDigitale Produktentwicklung"}
          </p>
          <p
            className="font-['Sofia_Pro',sans-serif] font-light text-[#c0c0c0] leading-[1.4] flex-1 min-w-0"
            style={{ fontSize: "var(--text-small)" }}
          >
            Wir begleiten dich von der ersten Vision bis zur Umsetzung – mit einem
            interdisziplinären Team aus Strategie, Design und Technologie. Unser Ziel:
            Produkte, die technisch robust, ästhetisch überzeugend und für Nutzer:innen
            relevant sind. Dabei arbeiten wir agil, nutzerzentriert und nutzen modernste
            Tools – von No-Code bis KI – um schneller zu Ergebnissen zu kommen.
          </p>
        </div>
      </div>

      {/* 4-column feature grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 px-0">
        {features.map((f) => (
          <div key={f.title} className="flex flex-col gap-[39px] items-start py-[40px]">
            {/* Icon badge */}
            <div className="bg-white w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0 text-[#0a0a0a]">
              {f.icon}
            </div>
            {/* Text */}
            <div className="flex flex-col gap-[19px]">
              <p
                className="font-['Sofia_Pro',sans-serif] font-light text-white leading-[1.2]"
                style={{ fontSize: "clamp(1rem, 1.5vw, 1.5rem)" }}
              >
                {f.title}
              </p>
              <p
                className="font-['Sofia_Pro',sans-serif] font-light text-[#a1a1a1] leading-[1.4]"
                style={{ fontSize: "var(--text-small)" }}
              >
                {f.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
