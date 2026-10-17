import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLeistungenData } from "@/data/content";
import { CtaButton } from "@/app/components/ui/CtaButton";
import { BOOKING_URL } from "@/app/links";
import { EVENTS, trackEvent } from "@/app/analytics";

/**
 * "Ihre Situation" — VL-5-S11, extended by VL-5-S13.
 *
 * Follows the picked handoff (design/handoff/leistungen-ihre-situation/variant-c.html,
 * variant C, quote bubbles) as amended by Christian's 2026-10-16 revision
 * (VL-5-D1, see CONCEPT.md §S11/§S13 and DECISIONS.md): a situation is
 * answered by naming what solves it and listing its concrete capabilities
 * underneath, not by a repeated booking CTA. Variant C's per-bubble CTA
 * column is therefore replaced by a capability list, and the whole block
 * closes with exactly one shared CtaButton — the only click target left, so
 * no per-situation Plausible attribution is needed and trackEvent() stays
 * untouched (VL-5-S11-Q3).
 *
 * S13's own change request — "Wir bräuchten für jede Aussage
 * Beispielagenten, die das Problem lösen könnten" — extends every situation
 * beyond receipts with its own, distinct, illustrative agent, each carrying
 * the "Beispiel"/"Example" marker below; the receipts situation keeps naming
 * Beleg-Inbox, the one real, sellable tool, and carries no marker
 * (`agentKind === "live"`).
 *
 * Mounted in Leistungen.tsx between SkillMatrix and PulseCallout, per S13's
 * own acceptance criteria 1 and VL-5-D1's "deeper in the page".
 */

const ACCENTS = ["#2b95f6", "#a318f8", "#fda700", "#8129ff", "#2b95f6"];

export function SituationsSection() {
  const { t } = useTranslation();
  const data = useLeistungenData();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="bg-[#181620] py-24"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <h2
            className="font-semibold text-white leading-tight"
            style={{ fontSize: "var(--text-section)" }}
          >
            {data.situationsHeading}
          </h2>
        </div>

        <div className="flex flex-col gap-5 max-w-3xl mx-auto">
          {data.situations.map((situation, index) => {
            const accent = ACCENTS[index % ACCENTS.length];
            const alignRight = index % 2 === 1;
            return (
              <div
                key={situation.id}
                className={`relative rounded-3xl p-6 md:p-8 flex flex-col gap-4 w-full sm:max-w-[85%] ${
                  alignRight ? "sm:self-end" : "sm:self-start"
                }`}
                style={{
                  backgroundColor: `${accent}1a`,
                  boxShadow: `inset 0 0 0 1px ${accent}59`,
                }}
              >
                <p
                  className="font-light text-white leading-snug"
                  style={{ fontSize: "var(--text-h3)" }}
                >
                  <span aria-hidden style={{ color: accent }}>
                    “
                  </span>
                  {situation.text}
                  <span aria-hidden style={{ color: accent }}>
                    ”
                  </span>
                </p>
                <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="font-semibold"
                      style={{ color: accent, fontSize: "var(--text-body)" }}
                    >
                      {situation.agentName}
                    </span>
                    {situation.agentKind === "example" && (
                      <span
                        className="font-semibold uppercase tracking-wide rounded-full px-2 py-0.5"
                        style={{
                          fontSize: "var(--text-small)",
                          color: accent,
                          backgroundColor: `${accent}26`,
                        }}
                      >
                        {t("leistungen.exampleAgentLabel")}
                      </span>
                    )}
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {situation.capabilities.map((capability) => (
                      <li
                        key={capability}
                        className="flex items-start gap-2 text-white/70 font-light"
                        style={{ fontSize: "var(--text-small)" }}
                      >
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0"
                          style={{ color: accent }}
                          aria-hidden
                        />
                        {capability}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center mt-14">
          <CtaButton
            href={BOOKING_URL}
            backgroundColor="#8129ff"
            onClick={() => trackEvent(EVENTS.callLinkClicked)}
          >
            {data.situationsCtaLabel}
          </CtaButton>
        </div>
      </div>
    </motion.section>
  );
}
