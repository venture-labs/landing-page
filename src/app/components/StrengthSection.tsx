import { Users, Layers, Zap, Handshake } from "lucide-react";
import { useTranslation } from "react-i18next";

const featureKeys = [
  { key: "userCentered", icon: <Users size={20} strokeWidth={2} /> },
  { key: "scalable", icon: <Layers size={20} strokeWidth={2} /> },
  { key: "prototyping", icon: <Zap size={20} strokeWidth={2} /> },
  { key: "collaboration", icon: <Handshake size={20} strokeWidth={2} /> },
];

export function StrengthSection() {
  const { t } = useTranslation();
  const features = featureKeys.map((f) => ({
    icon: f.icon,
    title: t(`strength.features.${f.key}.title`),
    subtitle: t(`strength.features.${f.key}.subtitle`),
  }));

  return (
    <div className="flex flex-col gap-[48px] w-full">
      {/* Header bar */}
      <div className="bg-[#291e3d] w-full">
        <div className="flex gap-[64px] items-start p-[32px]">
          <p
            className=" font-semibold text-white leading-none whitespace-pre-wrap shrink-0 w-[45%]"
            style={{ fontSize: "var(--text-card)" }}
          >
            {t("strength.headline")}
          </p>
          <p
            className=" font-light text-[#c0c0c0] leading-[1.4] flex-1 min-w-0"
            style={{ fontSize: "var(--text-small)" }}
          >
            {t("strength.description")}
          </p>
        </div>
      </div>

      {/* 4-column feature grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 px-0">
        {features.map((f) => (
          <div key={f.title} className="flex flex-col gap-[39px] items-start py-[40px]">
            {/* Icon badge */}
            <div className="bg-white w-10 h-10 flex items-center justify-center shrink-0 text-[#0a0a0a]">
              {f.icon}
            </div>
            {/* Text */}
            <div className="flex flex-col gap-[19px]">
              <p
                className=" font-light text-white leading-[1.2]"
                style={{ fontSize: "var(--text-card)" }}
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
