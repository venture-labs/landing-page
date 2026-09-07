import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { useTranslation } from "react-i18next";

export function ProblemSection() {
  const { t } = useTranslation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-[#0e0d13] py-24" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-6 max-w-3xl"
        >
          <h2
            className="font-semibold text-white leading-tight"
            style={{ fontSize: "var(--text-h2)" }}
          >
            {t("problem.heading")}
          </h2>
          <p
            className="text-white/60 font-light leading-relaxed"
            style={{ fontSize: "var(--text-body)" }}
          >
            {t("problem.body")}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
