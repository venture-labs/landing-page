import { useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { ArrowUpRight, Bot, Building2, Code2, Palette } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useLeistungenData, useServicesData } from "@/data/content";
import { useLocale } from "@/app/locale";
import { STEP_ACCENTS } from "@/app/components/PulseJourney";
import { PulseLines } from "@/app/components/ui/PulseLines";
import type { PulseStep, Service } from "@/data/de/services";

const STEP_ORDER: PulseStep[] = ["check", "build", "care"];

const iconMap: Record<Service["icon"], React.ReactNode> = {
  code: <Code2 size={26} strokeWidth={1.5} />,
  grid: <Building2 size={26} strokeWidth={1.5} />,
  palette: <Palette size={26} strokeWidth={1.5} />,
  bot: <Bot size={26} strokeWidth={1.5} />,
};

function StepChip({
  step,
  label,
  used,
  emphasised,
}: {
  step: PulseStep;
  label: string;
  used: boolean;
  emphasised: boolean;
}) {
  const accent = STEP_ACCENTS[step];
  return (
    <span
      className="px-2.5 py-1 rounded-full font-semibold uppercase tracking-[0.1em] transition-all duration-300"
      style={{
        fontSize: "var(--text-small)",
        color: used ? accent : "rgba(255,255,255,0.22)",
        backgroundColor: used ? `${accent}${emphasised ? "33" : "1c"}` : "rgba(255,255,255,0.03)",
        boxShadow: used && emphasised ? `inset 0 0 0 1px ${accent}66` : "none",
      }}
    >
      {label}
    </span>
  );
}

function SkillCard({
  service,
  index,
  filter,
  stepLabels,
}: {
  service: Service;
  index: number;
  filter: PulseStep | null;
  stepLabels: Record<PulseStep, string>;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { localizedPath } = useLocale();
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);

  const matches = filter === null || service.usedIn.includes(filter);
  const accent = filter ? STEP_ACCENTS[filter] : "#8129ff";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: matches ? 1 : 0.28, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        to={localizedPath(`/leistungen/${service.slug}`)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group relative flex flex-col gap-5 h-full rounded-2xl p-7 bg-white/[0.02] transition-transform duration-300"
        style={{
          boxShadow: `inset 0 0 0 1px ${matches && hovered ? `${accent}59` : "rgba(255,255,255,0.07)"}`,
          transform: hovered ? "translateY(-4px)" : "none",
        }}
      >
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: service.gradient }}
        />

        <div className="relative flex items-start justify-between">
          <span className="text-white/80">{iconMap[service.icon]}</span>
          <ArrowUpRight
            size={18}
            className="text-white/25 group-hover:text-white/70 transition-colors"
          />
        </div>

        <div className="relative flex flex-col gap-3">
          <h3
            className="font-semibold text-white leading-tight"
            style={{ fontSize: "var(--text-h3)" }}
          >
            {service.title}
          </h3>
          <p
            className="text-white/55 font-light leading-snug"
            style={{ fontSize: "var(--text-body)" }}
          >
            {service.description}
          </p>
        </div>

        <div className="relative flex flex-wrap gap-2 mt-auto pt-2">
          {STEP_ORDER.map((step) => (
            <StepChip
              key={step}
              step={step}
              label={stepLabels[step]}
              used={service.usedIn.includes(step)}
              emphasised={filter === step || hovered}
            />
          ))}
        </div>

        <p
          className="relative text-white/40 font-light italic leading-snug"
          style={{ fontSize: "var(--text-small)" }}
        >
          {service.proof}
        </p>

        <span className="sr-only">{t("leistungen.learnMore")}</span>
      </Link>
    </motion.div>
  );
}

export function SkillMatrix() {
  const services = useServicesData();
  const { skillsHeading, skillsIntro, skillStepLabels } = useLeistungenData();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<PulseStep | null>(null);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-[#0e0d13] py-24 relative overflow-hidden" ref={ref} id="skills">
      <PulseLines
        accent={filter ? STEP_ACCENTS[filter] : "#8129ff"}
        intensity={0.6}
        className="absolute top-0 left-0 w-full h-[380px] pointer-events-none transition-all duration-700"
      />
      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col gap-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-4 max-w-2xl"
        >
          <h2
            className="font-semibold text-white leading-tight"
            style={{ fontSize: "var(--text-section)" }}
          >
            {skillsHeading}
          </h2>
          <p
            className="text-white/60 font-light leading-relaxed"
            style={{ fontSize: "var(--text-body)" }}
          >
            {skillsIntro}
          </p>
        </motion.div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter(null)}
            aria-pressed={filter === null}
            className="px-4 py-2 rounded-full font-semibold transition-colors"
            style={{
              fontSize: "var(--text-small)",
              color: filter === null ? "#0e0d13" : "rgba(255,255,255,0.6)",
              backgroundColor: filter === null ? "#ffffff" : "rgba(255,255,255,0.04)",
            }}
          >
            {t("leistungen.allSteps")}
          </button>
          {STEP_ORDER.map((step) => {
            const accent = STEP_ACCENTS[step];
            const active = filter === step;
            return (
              <button
                key={step}
                type="button"
                onClick={() => setFilter(active ? null : step)}
                aria-pressed={active}
                className="px-4 py-2 rounded-full font-semibold transition-colors"
                style={{
                  fontSize: "var(--text-small)",
                  color: active ? "#0e0d13" : accent,
                  backgroundColor: active ? accent : `${accent}1c`,
                }}
              >
                {skillStepLabels[step]}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((service, i) => (
            <SkillCard
              key={service.slug}
              service={service}
              index={i}
              filter={filter}
              stepLabels={skillStepLabels}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
