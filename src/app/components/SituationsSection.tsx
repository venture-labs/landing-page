import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Check } from "lucide-react";
import { useLeistungenData } from "@/data/content";
import { CtaButton } from "@/app/components/ui/CtaButton";
import { BOOKING_URL } from "@/app/links";
import { EVENTS, trackEvent } from "@/app/analytics";

/**
 * "Ihre Situation" — VL-5-S11.
 *
 * Follows the picked handoff (design/handoff/leistungen-ihre-situation/variant-c.html,
 * variant C, quote bubbles) as amended by Christian's 2026-10-16 revision
 * (VL-5-D1, see CONCEPT.md §S11 and DECISIONS.md): a situation is answered by
 * naming what solves it and listing its concrete capabilities underneath, not
 * by a repeated booking CTA. Variant C's per-bubble CTA column is therefore
 * replaced by a capability list, and the whole block closes with exactly one
 * shared CtaButton — the only click target left, so no per-situation Plausible
 * attribution is needed and trackEvent() stays untouched (VL-5-S11-Q3).
 *
 * Mounted in Leistungen.tsx below PulseJourney ("Check. Build. Care."), per
 * VL-5-S11-Q4 — "deeper" with no exact position fixed by the decision.
 */

const ACCENTS = ["#2b95f6", "#a318f8", "#fda700", "#8129ff", "#d9aeff"];

export function SituationsSection() {
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
                  <span
                    className="font-semibold"
                    style={{ color: accent, fontSize: "var(--text-body)" }}
                  >
                    {situation.agentName}
                  </span>
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
