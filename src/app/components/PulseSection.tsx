import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Check } from "lucide-react";
import { useLocale } from "@/app/locale";
import { COPY, PulseQuiz, type Copy } from "@/app/components/PulseQuiz";

function PulsePricing({ copy, accent }: { copy: Copy; accent: string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {copy.steps.map((step) => (
        <div key={step.title} className="flex flex-col gap-5 p-7 rounded-xl border border-white/8 bg-white/[0.02]">
          <div className="flex flex-col gap-1">
            <span className="font-['sofia-pro',sans-serif] font-semibold uppercase tracking-wide" style={{ fontSize: "var(--text-small)", color: accent }}>
              {step.stepLabel}
            </span>
            <h3 className="font-['sofia-pro',sans-serif] font-semibold text-white" style={{ fontSize: "var(--text-h2)" }}>
              {step.title}
            </h3>
            <span className="font-['sofia-pro',sans-serif] font-semibold text-white/70" style={{ fontSize: "var(--text-body)" }}>
              {step.price}
            </span>
          </div>
          <p className="text-white/60 font-['sofia-pro',sans-serif] font-light leading-relaxed" style={{ fontSize: "var(--text-body)" }}>
            {step.description}
          </p>
          <div className="flex flex-col gap-2 text-white/50 font-['sofia-pro',sans-serif] font-light" style={{ fontSize: "var(--text-small)" }}>
            <p>
              <span className="text-white/70 font-semibold">{step.inputLabel}: </span>
              {step.input}
            </p>
            <p>
              <span className="text-white/70 font-semibold">{step.outputLabel}: </span>
              {step.output}
            </p>
          </div>
          <ul className="flex flex-col gap-2 mt-1">
            {step.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-white/70 font-['sofia-pro',sans-serif] font-light leading-snug" style={{ fontSize: "var(--text-small)" }}>
                <Check size={13} style={{ color: accent }} strokeWidth={3} className="mt-0.5 shrink-0" />
                {b}
              </li>
            ))}
          </ul>
          <p className="text-white/35 font-['sofia-pro',sans-serif] font-light italic mt-auto" style={{ fontSize: "var(--text-small)" }}>
            {step.footnote}
          </p>
        </div>
      ))}
    </div>
  );
}

export function PulseSection({ accent }: { accent: string }) {
  const { lang } = useLocale();
  const copy = COPY[lang];
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-[#181620] py-24" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col gap-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-10"
        >
          <div className="flex flex-col gap-4">
            <h2 className="font-['sofia-pro',sans-serif] font-semibold text-white leading-tight" style={{ fontSize: "var(--text-hero)" }}>
              {copy.pulseHeading}
            </h2>
            <p className="text-white/60 font-['sofia-pro',sans-serif] font-light leading-relaxed max-w-2xl" style={{ fontSize: "var(--text-body)" }}>
              {copy.pulseIntro}
            </p>
          </div>
          <PulsePricing copy={copy} accent={accent} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col gap-8 p-8 lg:p-12 rounded-2xl border border-white/8 bg-white/[0.015]"
        >
          <h3 className="font-['sofia-pro',sans-serif] font-semibold text-white leading-tight" style={{ fontSize: "var(--text-section)" }}>
            {copy.quizHeading}
          </h3>
          <PulseQuiz copy={copy} accent={accent} />
        </motion.div>
      </div>
    </section>
  );
}
