import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Step {
  number: string;
  title: string;
  description: string;
}

export function HowWeWork() {
  const { t } = useTranslation();
  const steps = t("howWeWork.steps", { returnObjects: true }) as Step[];
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-[#181620] py-24" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col gap-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-4"
        >
          <h2
            className="font-semibold text-white leading-tight"
            style={{ fontSize: "var(--text-hero)" }}
          >
            {t("howWeWork.heading")}
          </h2>
          <p
            className="text-white/60 font-light leading-relaxed max-w-2xl"
            style={{ fontSize: "var(--text-body)" }}
          >
            {t("howWeWork.subheading")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 + i * 0.1 }}
              className="flex flex-col gap-4 relative"
            >
              <div className="flex items-center gap-3">
                <p
                  className="font-semibold text-white/40"
                  style={{ fontSize: "var(--text-h2)" }}
                >
                  {step.number}
                </p>
                {i < steps.length - 1 && (
                  <ArrowRight size={18} className="text-white/20 hidden lg:block" />
                )}
              </div>
              <h3
                className="font-semibold text-white"
                style={{ fontSize: "var(--text-card)" }}
              >
                {step.title}
              </h3>
              <p
                className="text-white/60 font-light leading-relaxed"
                style={{ fontSize: "var(--text-body)" }}
              >
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
