import { useEffect, useRef } from "react";
import { motion, useInView } from "motion/react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import { CtaButton } from "@/app/components/ui/CtaButton";
import { useLocale } from "@/app/locale";

const ACCENT = "#8129ff";

interface Step {
  number: string;
  title: string;
  description: string;
}

function Hero() {
  const { t } = useTranslation();
  const { localizedPath } = useLocale();

  return (
    <section className="relative pt-36 pb-24 bg-[#1E1C27] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[-150px] left-[-200px] w-[800px] h-[800px] rounded-full blur-[140px]"
          style={{ background: `${ACCENT}18` }}
        />
        <div
          className="absolute top-[200px] right-[-100px] w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ background: `${ACCENT}10` }}
        />
      </div>
      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-8 max-w-3xl"
        >
          <span
            className="font-semibold uppercase tracking-wide"
            style={{ fontSize: "var(--text-small)", color: ACCENT }}
          >
            {t("aiPulsePage.eyebrow")}
          </span>
          <h1
            className="font-semibold text-white leading-[1.05]"
            style={{ fontSize: "var(--text-hero)" }}
          >
            {t("aiPulsePage.heroHeadline")}
          </h1>
          <p
            className="text-white/60 font-light leading-relaxed max-w-2xl"
            style={{ fontSize: "var(--text-body)" }}
          >
            {t("aiPulsePage.heroSubline")}
          </p>
          <CtaButton href={localizedPath("/#kontakt")} backgroundColor={ACCENT}>
            {t("aiPulsePage.heroCta")}
          </CtaButton>
        </motion.div>
      </div>
    </section>
  );
}

function Problem() {
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
            {t("aiPulsePage.problemHeading")}
          </h2>
          <p
            className="text-white/60 font-light leading-relaxed"
            style={{ fontSize: "var(--text-body)" }}
          >
            {t("aiPulsePage.problemBody")}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function Process() {
  const { t } = useTranslation();
  const steps = t("aiPulsePage.steps", { returnObjects: true }) as Step[];
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-[#181620] py-24" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col gap-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="font-semibold text-white leading-tight"
          style={{ fontSize: "var(--text-hero)" }}
        >
          {t("aiPulsePage.processHeading")}
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 + i * 0.1 }}
              className="flex flex-col gap-4"
            >
              <p
                className="font-semibold text-white/40"
                style={{ fontSize: "var(--text-h2)" }}
              >
                {step.number}
              </p>
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

function Output() {
  const { t } = useTranslation();
  const items = t("aiPulsePage.outputItems", { returnObjects: true }) as string[];
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-[#0e0d13] py-24" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col gap-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="font-semibold text-white leading-tight"
          style={{ fontSize: "var(--text-hero)" }}
        >
          {t("aiPulsePage.outputHeading")}
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="flex items-start gap-3 p-6 rounded-xl border border-white/8 bg-white/[0.02]"
            >
              <Check size={18} className="mt-0.5 shrink-0" style={{ color: ACCENT }} strokeWidth={2.5} />
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

function PulseCta() {
  const { t } = useTranslation();
  const { localizedPath } = useLocale();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="py-24"
      style={{ background: `linear-gradient(135deg, ${ACCENT}11 0%, ${ACCENT}08 50%, #1E1C27 100%)` }}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="flex flex-col gap-4 max-w-2xl">
          <h2
            className="font-semibold text-white leading-tight"
            style={{ fontSize: "var(--text-section)" }}
          >
            {t("aiPulsePage.ctaHeading")}
          </h2>
          <p
            className="text-white/80 font-light leading-relaxed"
            style={{ fontSize: "var(--text-body)" }}
          >
            {t("aiPulsePage.ctaBody")}
          </p>
        </div>
        <CtaButton
          href={localizedPath("/#kontakt")}
          backgroundColor="white"
          textColor="text-[#1E1C27]"
          fontSize="var(--text-body)"
        >
          {t("aiPulsePage.heroCta")}
        </CtaButton>
      </div>
    </motion.section>
  );
}

export function AIPulse() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#0e0d13] text-white">
      <Navbar />
      <Hero />
      <Problem />
      <Process />
      <Output />
      <PulseCta />
      <Footer />
    </div>
  );
}
