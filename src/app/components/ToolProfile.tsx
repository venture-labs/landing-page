import { Bot, Building2, Code2, Palette, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useServicesData, useToolProfilesData } from "@/data/content";
import type { Service } from "@/data/de/services";
import type { AgentOption } from "@/data/de/tools";

/**
 * "Was sonst noch möglich ist" — VL-5-S12, reduced by VL-11-S3.
 *
 * Originally also carried the "Im Einsatz: Beleg-Inbox" Steckbrief
 * (`ToolProfileCard`: icon + category eyebrow + name + task, the four fact
 * tiles, cancellation pill and booking CTA) for the one real, named tool.
 * VL-11-S3 (CONCEPT.md §S3) deletes that box outright — the Beleg-Inbox
 * situation now lives as one card in `UseCasesSection`'s carousel, in the
 * same shape as every other card — and keeps only this component's second
 * `<section>`, the "what else is possible" agent-option grid, unchanged.
 *
 * Every agent-option card still carries no accent colour, no fact-pill grid,
 * no cancellation pill and no CTA, plus the "Beispiel"/"Example" tag
 * (`leistungen.exampleAgentLabel`) as a second, textual signal — this grid's
 * own badge is untouched by VL-11-S3 (only the carousel's per-card badge is
 * removed, see UseCasesSection.tsx).
 *
 * Category icons and eyebrow labels are looked up from the existing
 * useServicesData() by matching `category`/`service.slug` — not duplicated
 * per tool or per agent option — so a second tool profile under any of the
 * four existing service categories needs no change here (acceptance
 * criterion 10).
 *
 * Mounted in Leistungen.tsx directly after <SkillMatrix />.
 */

const ICON_BY_SERVICE_ICON: Record<Service["icon"], LucideIcon> = {
  code: Code2,
  grid: Building2,
  palette: Palette,
  bot: Bot,
};

function iconFor(category: string, services: Service[]): LucideIcon {
  const service = services.find((s) => s.slug === category);
  return service ? ICON_BY_SERVICE_ICON[service.icon] : Bot;
}

function categoryLabel(category: string, services: Service[]): string {
  return services.find((s) => s.slug === category)?.title ?? category;
}

function AgentOptionCard({ option, services }: { option: AgentOption; services: Service[] }) {
  const { t } = useTranslation();
  const Icon = iconFor(option.category, services);

  return (
    <div
      className="flex flex-col gap-4 rounded-2xl p-6"
      style={{
        background: "rgba(255,255,255,0.028)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div
          className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0"
          style={{ background: "rgba(255,255,255,0.055)" }}
        >
          <Icon size={18} strokeWidth={1.5} className="text-white/70" />
        </div>
        <span
          className="font-bold uppercase tracking-[0.09em] rounded-full px-2.5 py-1 whitespace-nowrap"
          style={{
            fontSize: "0.66rem",
            color: "rgba(255,255,255,0.42)",
            backgroundColor: "rgba(255,255,255,0.05)",
          }}
        >
          {t("leistungen.exampleAgentLabel")}
        </span>
      </div>

      <div>
        <span
          className="block font-semibold uppercase tracking-[0.1em] mb-1"
          style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.42)" }}
        >
          {categoryLabel(option.category, services)}
        </span>
        <h4
          className="font-semibold leading-snug"
          style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.92)" }}
        >
          {option.title}
        </h4>
      </div>

      <p
        className="font-light leading-relaxed"
        style={{ fontSize: "0.86rem", color: "rgba(255,255,255,0.56)" }}
      >
        {option.description}
      </p>
    </div>
  );
}

export function ToolProfile() {
  const tools = useToolProfilesData();
  const services = useServicesData();

  if (tools.length === 0) return null;

  const primary = tools[0];
  const agentOptions = tools.flatMap((tool) => tool.agentOptions);

  if (agentOptions.length === 0) return null;

  return (
    <section className="py-20 border-t border-white/[0.08]" style={{ background: "rgba(0,0,0,0.12)" }}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="max-w-2xl flex flex-col gap-2">
          <h3
            className="font-semibold leading-snug"
            style={{ fontSize: "var(--text-h3)", color: "rgba(255,255,255,0.92)" }}
          >
            {primary.agentOptionsHeading}
          </h3>
          <p
            className="font-light leading-relaxed"
            style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.45)" }}
          >
            {primary.agentOptionsIntro}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mt-9">
          {agentOptions.map((option, index) => (
            <AgentOptionCard key={`${option.category}-${index}`} option={option} services={services} />
          ))}
        </div>
      </div>
    </section>
  );
}
