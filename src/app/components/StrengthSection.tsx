import { Users, Layers, Zap, Handshake } from "lucide-react";
import { useLeistungenData } from "@/data/content";

const iconMap: Record<string, React.ReactNode> = {
  users: <Users size={20} strokeWidth={2} />,
  layers: <Layers size={20} strokeWidth={2} />,
  zap: <Zap size={20} strokeWidth={2} />,
  handshake: <Handshake size={20} strokeWidth={2} />,
};

export function StrengthSection() {
  const leistungenData = useLeistungenData();
  const features = leistungenData.strengthFeatures ?? [];

  return (
    <div className="flex flex-col gap-[48px] w-full">
      {/* Header bar */}
      <div className="bg-[#291e3d] w-full">
        <div className="flex gap-[64px] items-start p-[32px]">
          <p
            className=" font-semibold text-white leading-none whitespace-pre-wrap shrink-0 w-[45%]"
            style={{ fontSize: "var(--text-h3)" }}
          >
            {leistungenData.strengthHeadline}
          </p>
          <p
            className=" font-light text-[#c0c0c0] leading-[1.4] flex-1 min-w-0"
            style={{ fontSize: "var(--text-small)" }}
          >
            {leistungenData.strengthDescription}
          </p>
        </div>
      </div>

      {/* 4-column feature grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 px-0">
        {features.map((f: any, i: number) => (
          <div key={f.title ?? i} className="flex flex-col gap-[39px] items-start py-[40px]">
            {/* Icon badge */}
            <div className="bg-white w-10 h-10 flex items-center justify-center shrink-0 text-[#0a0a0a]">
              {iconMap[f.icon] ?? iconMap.users}
            </div>
            {/* Text */}
            <div className="flex flex-col gap-[19px]">
              <p
                className=" font-light text-white leading-[1.2]"
                style={{ fontSize: "clamp(1.25rem, 1.5vw, 1.5rem)" }}
              >
                {f.title}
              </p>
              <p
                className=" font-light text-[#a1a1a1] leading-[1.4]"
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
