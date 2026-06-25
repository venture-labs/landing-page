import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { type PricingPlan } from "@/data/de/pricing";
import { usePricingData } from "@/data/live";
import { tinaField } from "tinacms/dist/react";
import svgPaths from "@/imports/🖌Homepage/svg-oa0apfkpzr";

function PricingCard({
  plan,
  index,
}: {
  plan: PricingPlan;
  index: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col flex-1 min-w-[280px] bg-[#1c1a27] rounded-2xl overflow-hidden border border-white/8"
    >
      <div className="p-10 flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: plan.badgeColor + "20" }}>
            <svg width="20" height="20" viewBox="0 0 40 41" fill="none">
              <g clipPath="url(#clip-pricing)">
                <path d={svgPaths.p113a100} fill={plan.badgeColor} />
              </g>
              <defs>
                <clipPath id="clip-pricing">
                  <rect fill="white" height="41" width="40" />
                </clipPath>
              </defs>
            </svg>
          </div>
          <div
            className="text-xs font-['Inter',sans-serif] font-medium px-3 py-1.5 rounded-full text-white/40"
            style={{ backgroundColor: "rgba(140,147,158,0.2)" }}
          >
            {plan.badge}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3
            data-tina-field={tinaField(plan, "title")}
            className=" font-light text-white leading-tight"
            style={{ fontSize: "var(--text-card)" }}
          >
            {plan.title}
          </h3>
          <p
            data-tina-field={tinaField(plan, "description")}
            className="text-[#a1a1a1] font-light leading-relaxed"
            style={{ fontSize: "var(--text-small)" }}
          >
            {plan.description}
          </p>
        </div>
      </div>

      <div className="px-10 pb-4">
        <div className="flex items-end gap-1">
          <span
            data-tina-field={tinaField(plan, "price")}
            className=" font-light text-white"
            style={{ fontSize: "var(--text-price)" }}
          >
            {plan.price}
          </span>
          {plan.priceUnit && (
            <span className="text-[#a1a1a1] text-xs mb-2">
              {plan.priceUnit}
            </span>
          )}
        </div>
      </div>

      <div className="px-10 pb-6">
        <button className="w-full bg-white/4 hover:bg-white/8 border border-white/12 text-white text-sm flex items-center justify-center gap-2 px-5 py-3 rounded-lg transition-all">
          {plan.cta}
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="px-10 pb-10">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {plan.features.map((feature) => (
            <div key={feature} className="flex items-start gap-2">
              <Check size={13} className="text-[#8129ff] shrink-0 mt-0.5" />
              <span
                className="text-[#a1a1a1] font-light leading-snug"
                style={{ fontSize: "var(--text-small)" }}
              >
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function Pricing() {
  const pricingPlans = usePricingData();
  const { t } = useTranslation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="pricing" className="bg-[#0e0d13] py-24" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-6 mb-16"
        >
          <h2
            className=" font-bold text-white leading-none"
            style={{ fontSize: "var(--text-h2)" }}
          >
            {t("pricing.heading")}
          </h2>
          <p
            className="text-[#c0c0c0] font-light leading-relaxed max-w-3xl"
            style={{ fontSize: "var(--text-body)" }}
          >
            {t("pricing.subheading")}
          </p>
        </motion.div>

        <div className="flex flex-wrap gap-6">
          {pricingPlans.map((plan, i) => (
            <PricingCard key={plan.slug} plan={plan} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
