import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Bot, Building2, Code2, Palette, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLeistungenData, useServicesData, useToolProfilesData } from "@/data/content";
import { CtaButton } from "@/app/components/ui/CtaButton";
import { BOOKING_URL } from "@/app/links";
import { CTAS, EVENTS, PLACEMENTS, trackEvent } from "@/app/analytics";
import type { Service } from "@/data/de/services";
import type { AgentOption, ToolProfile as ToolProfileData } from "@/data/de/tools";

/**
 * "Im Einsatz: Beleg-Inbox" — VL-5-S12.
 *
 * Follows the gate 2 design pick for Beleg-Inbox Steckbrief, variant C
 * (design/handoff/beleg-inbox-steckbrief/variant-c.html, round 3): a
 * split-hero Steckbrief for the one real, named tool (Beleg-Inbox) — icon +
 * category eyebrow + name + task on the left, the four fact tiles (Kommt
 * rein / Kommt raus / Läuft bei dir / Freigabe) plus the cancellation pill
 * and the booking CTA on/around it — followed by a grid of >=15 fictional
 * "what else is possible" agent-option cards.
 *
 * The round's own hard separation criterion ("no possibility can appear as a
 * Steckbrief") is kept the same way variant C keeps it: every agent-option
 * card carries no accent colour, no fact-pill grid, no cancellation pill and
 * no CTA, plus the "Beispiel"/"Example" tag (`leistungen.exampleAgentLabel`,
 * already used the same way by SituationsSection for its own example
 * agents) as a second, textual signal.
 *
 * Category icons and eyebrow labels are looked up from the existing
 * useServicesData() by matching `category`/`service.slug` — not duplicated
 * per tool or per agent option — so a second tool profile under any of the
 * four existing service categories needs no change here (acceptance
 * criterion 10).
 *
 * Mounted in Leistungen.tsx directly after <SkillMatrix /> so "AI Automation"
 * (the skill card just above) and "Beleg-Inbox" (this section) read as one
 * continuous proof, per the Approach.
 */

const ICON_BY_SERVICE_ICON: Record<Service["icon"], LucideIcon> = {
  code: Code2,
  grid: Building2,
  palette: Palette,
  bot: Bot,
};

/** `--ai-automation` in the variant C tokens — the one live tool's accent. */
const ACCENT = "#fda700";
const RELEASE_ACCENT = "#6ee7b7";

function iconFor(category: string, services: Service[]): LucideIcon {
  const service = services.find((s) => s.slug === category);
  return service ? ICON_BY_SERVICE_ICON[service.icon] : Bot;
}

function categoryLabel(category: string, services: Service[]): string {
  return services.find((s) => s.slug === category)?.title ?? category;
}

function ToolFact({
  label,
  value,
  accent = ACCENT,
  wide,
}: {
  label: string;
  value: string;
  accent?: string;
  wide?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-2 ${wide ? "sm:col-span-2" : ""}`}>
      <span
        className="self-start rounded-full px-3 py-1 font-bold uppercase tracking-[0.1em]"
        style={{ fontSize: "0.72rem", color: accent, backgroundColor: `${accent}2e` }}
      >
        {label}
      </span>
      <p className="text-white/80 font-light leading-relaxed" style={{ fontSize: "0.93rem" }}>
        {value}
      </p>
    </div>
  );
}

function ToolProfileCard({ tool, services }: { tool: ToolProfileData; services: Service[] }) {
  const { t } = useTranslation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const Icon = iconFor(tool.category, services);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="grid grid-cols-1 lg:grid-cols-[19rem_1fr] rounded-2xl overflow-hidden"
      style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }}
    >
      <div
        className="flex flex-col gap-5 p-8 lg:p-10"
        style={{ background: `linear-gradient(160deg, ${ACCENT}29 0%, ${ACCENT}0a 100%)` }}
      >
        <div
          className="w-12 h-12 flex items-center justify-center rounded-sm"
          style={{ background: `${ACCENT}33`, boxShadow: `inset 0 0 0 1px ${ACCENT}66` }}
        >
          <Icon size={22} strokeWidth={1.5} style={{ color: ACCENT }} />
        </div>

        <div>
          <span
            className="font-semibold uppercase tracking-[0.14em]"
            style={{ fontSize: "var(--text-small)", color: ACCENT }}
          >
            {categoryLabel(tool.category, services)}
          </span>
          <h3
            className="font-semibold text-white leading-tight mt-1"
            style={{ fontSize: "var(--text-h3)" }}
          >
            {tool.name}
          </h3>
        </div>

        <p className="text-white/75 font-light leading-relaxed" style={{ fontSize: "0.93rem" }}>
          {tool.task}
        </p>

        <span
          className="self-start inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold"
          style={{
            fontSize: "var(--text-small)",
            color: "rgba(255,255,255,0.8)",
            backgroundColor: "rgba(255,255,255,0.08)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)",
          }}
        >
          <span className="sr-only">{t("leistungen.toolCancellationLabel")}: </span>
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: RELEASE_ACCENT }}
            aria-hidden
          />
          {tool.cancellationNote}
        </span>

        <CtaButton
          href={BOOKING_URL}
          backgroundColor={ACCENT}
          textColor="text-[#1E1C27]"
          onClick={() => trackEvent(EVENTS.callLinkClicked, PLACEMENTS.toolProfile, CTAS.bookCall)}
        >
          {tool.ctaLabel}
        </CtaButton>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-8 lg:p-11"
        style={{ background: "rgba(255,255,255,0.02)" }}
      >
        <ToolFact label={t("leistungen.toolInputLabel")} value={tool.input} />
        <ToolFact label={t("leistungen.toolOutputLabel")} value={tool.output} />
        <ToolFact label={t("leistungen.toolWhereItRunsLabel")} value={tool.whereItRuns} />
        <ToolFact
          label={t("leistungen.toolReleaseLabel")}
          value={tool.releaseNote}
          accent={RELEASE_ACCENT}
          wide
        />
      </div>
    </motion.div>
  );
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
  const data = useLeistungenData();
  const tools = useToolProfilesData();
  const services = useServicesData();
  const headRef = useRef(null);
  const headInView = useInView(headRef, { once: true, margin: "-60px" });

  if (tools.length === 0) return null;

  const primary = tools[0];
  const agentOptions = tools.flatMap((tool) => tool.agentOptions);

  return (
    <>
      <section className="bg-[#0e0d13] py-24 border-t border-white/[0.08]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col gap-11">
          <motion.div
            ref={headRef}
            initial={{ opacity: 0, y: 20 }}
            animate={headInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-4 max-w-2xl"
          >
            <h2
              className="font-semibold text-white leading-tight"
              style={{ fontSize: "var(--text-section)" }}
            >
              {data.toolProfilesHeading}
            </h2>
            <p
              className="text-white/60 font-light leading-relaxed"
              style={{ fontSize: "var(--text-body)" }}
            >
              {data.toolProfilesIntro}
            </p>
          </motion.div>

          <div className="flex flex-col gap-8">
            {tools.map((tool) => (
              <ToolProfileCard key={tool.slug} tool={tool} services={services} />
            ))}
          </div>
        </div>
      </section>

      {agentOptions.length > 0 && (
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
      )}
    </>
  );
}
