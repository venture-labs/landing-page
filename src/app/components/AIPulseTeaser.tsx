import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/app/locale";
import { CtaButton } from "@/app/components/ui/CtaButton";

export function AIPulseTeaser() {
  const { t } = useTranslation();
  const { localizedPath } = useLocale();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-[#181620] py-24" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-8 p-8 lg:p-12 rounded-2xl border border-white/8 bg-white/[0.02] max-w-3xl"
        >
          <div className="flex flex-col gap-4">
            <h2
              className="font-semibold text-white leading-tight"
              style={{ fontSize: "var(--text-hero)" }}
            >
              {t("aiPulse.heading")}
            </h2>
            <p
              className="text-white/60 font-light leading-relaxed"
              style={{ fontSize: "var(--text-body)" }}
            >
              {t("aiPulse.body")}
            </p>
          </div>
          <CtaButton href={localizedPath("/ai-pulse")} backgroundColor="#8129ff">
            {t("aiPulse.cta")}
          </CtaButton>
        </motion.div>
      </div>
    </section>
  );
}
