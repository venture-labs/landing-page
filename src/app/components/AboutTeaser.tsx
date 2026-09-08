import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/app/locale";
import { CtaButton } from "@/app/components/ui/CtaButton";

export function AboutTeaser() {
  const { t } = useTranslation();
  const { localizedPath } = useLocale();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-[#1E1C27] py-24" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-8 max-w-2xl"
        >
          <h2
            className="font-semibold text-white leading-tight"
            style={{ fontSize: "var(--text-h2)" }}
          >
            {t("aboutTeaser.heading")}
          </h2>
          <p
            className="text-white/60 font-light leading-relaxed"
            style={{ fontSize: "var(--text-body)" }}
          >
            {t("aboutTeaser.body")}
          </p>
          <CtaButton href={localizedPath("/ueber-uns")} backgroundColor="white" textColor="text-[#0e0d13]">
            {t("aboutTeaser.cta")}
          </CtaButton>
        </motion.div>
      </div>
    </section>
  );
}
