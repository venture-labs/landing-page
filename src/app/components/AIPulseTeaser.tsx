import { useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { useTranslation } from "react-i18next";
import { CtaButton } from "@/app/components/ui/CtaButton";
import { PulseCheckModal } from "@/app/components/PulseCheckModal";

export function AIPulseTeaser() {
  const { t } = useTranslation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [quizOpen, setQuizOpen] = useState(false);

  return (
    <section className="bg-[#0e0d13] py-24" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6"
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col gap-6 p-8 lg:p-12 rounded-2xl border border-white/8 bg-white/[0.02]"
          >
            <p
              className="text-white/60 font-light leading-relaxed"
              style={{ fontSize: "var(--text-body)" }}
            >
              {t("aiPulse.body")}
            </p>
            <CtaButton onClick={() => setQuizOpen(true)} backgroundColor="#8129ff">
              {t("aiPulse.cta")}
            </CtaButton>
          </motion.div>
        </div>
      </div>

      <PulseCheckModal open={quizOpen} onOpenChange={setQuizOpen} />
    </section>
  );
}
