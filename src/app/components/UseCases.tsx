import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

export function UseCases() {
  const { t } = useTranslation();
  const items = t("useCases.items", { returnObjects: true }) as string[];
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-[#0e0d13] py-24" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col gap-12">
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
            {t("useCases.heading")}
          </h2>
          <p
            className="text-[#c0c0c0] font-light leading-snug max-w-2xl"
            style={{ fontSize: "var(--text-h2)" }}
          >
            {t("useCases.subheading")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="flex items-start gap-3 p-6 rounded-xl border border-white/8 bg-white/[0.02]"
            >
              <Check size={18} className="text-[#8129ff] mt-0.5 shrink-0" strokeWidth={2.5} />
              <p
                className="text-white/85 font-medium leading-snug"
                style={{ fontSize: "var(--text-body)" }}
              >
                {item}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
