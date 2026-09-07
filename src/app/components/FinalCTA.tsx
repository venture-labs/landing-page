import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/app/locale";
import { CtaButton } from "@/app/components/ui/CtaButton";

export function FinalCTA() {
  const { t } = useTranslation();
  const { localizedPath } = useLocale();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-[#0e0d13] py-24" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-start gap-8"
        >
          <h2
            className="font-semibold text-white leading-tight max-w-2xl"
            style={{ fontSize: "var(--text-hero)" }}
          >
            {t("finalCta.heading")}
          </h2>
          <p
            className="text-white/60 font-light leading-relaxed"
            style={{ fontSize: "var(--text-body)" }}
          >
            {t("finalCta.body")}
          </p>
          <div className="flex flex-wrap gap-4">
            <CtaButton href={localizedPath("/ai-pulse")} backgroundColor="#8129ff">
              {t("finalCta.primaryCta")}
            </CtaButton>
            <a
              href={localizedPath("/#kontakt")}
              className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/12 text-white font-medium px-6 py-3.5 rounded-lg transition-all"
              style={{ fontSize: "var(--text-body)" }}
            >
              {t("finalCta.secondaryCta")}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
