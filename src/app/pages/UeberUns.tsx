import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Users, Lightbulb, Target, Zap } from "lucide-react";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import { useLocale } from "@/app/locale";
import { useAboutData } from "@/data/live";

/* ─── hero ──────────────────────────────────────────────────────────── */

function UeberUnsHero({ data }: { data: ReturnType<typeof useAboutData> }) {
  return (
    <section
      className="relative pt-40 pb-48 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #1E1C27 0%, #1E1C27 40%, #0e0d13 100%)"
      }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-250px] right-[-200px] w-[700px] h-[500px] rounded-full bg-[#8129ff]/10 blur-[120px]" />
      </div>
      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-8 max-w-3xl"
        >
          <h1
            className="font-['sofia-pro',sans-serif] font-semibold text-white leading-[1.05]"
            style={{ fontSize: "var(--text-hero)" }}
          >
            {data.heroTitle}
          </h1>
          <p
            className="text-white/60 font-['sofia-pro',sans-serif] font-light leading-relaxed max-w-2xl"
            style={{ fontSize: "var(--text-body)" }}
          >
            {data.heroSubheading}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── mission section ────────────────────────────────────────────────── */

function MissionSection({ data }: { data: ReturnType<typeof useAboutData> }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className="border-t border-white/8 py-24 px-6 lg:px-12 max-w-[1400px] mx-auto"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
        <div>
          <h2
            className="font-['sofia-pro',sans-serif] font-semibold text-white"
            style={{ fontSize: "var(--text-h2)" }}
          >
            {data.missionTitle}
          </h2>
        </div>
        <div>
          <p
            className="text-white/60 font-['sofia-pro',sans-serif] font-light leading-relaxed"
            style={{ fontSize: "var(--text-body)" }}
          >
            {data.missionText}
          </p>
        </div>
      </div>
    </motion.section>
  );
}

/* ─── values section ────────────────────────────────────────────────── */

const valueIcons: Record<string, React.ReactNode> = {
  0: <Users size={24} strokeWidth={1.5} className="text-white" />,
  1: <Target size={24} strokeWidth={1.5} className="text-white" />,
  2: <Lightbulb size={24} strokeWidth={1.5} className="text-white" />,
  3: <Zap size={24} strokeWidth={1.5} className="text-white" />,
};

function ValuesSection({ data }: { data: ReturnType<typeof useAboutData> }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.65 }}
      className="border-t border-white/8 py-24 px-6 lg:px-12 max-w-[1400px] mx-auto"
    >
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.65, delay: 0.1 }}
        className="font-['sofia-pro',sans-serif] font-semibold text-white mb-16"
        style={{ fontSize: "var(--text-h2)" }}
      >
        {data.valuesTitle}
      </motion.h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {data.valuesItems.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.15 + i * 0.08 }}
            className="flex flex-col gap-6"
          >
            <div
              className="w-12 h-12 flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#8129ff22", border: "1px solid #8129ff44" }}
            >
              {valueIcons[String(i)]}
            </div>
            <div className="flex flex-col gap-3">
              <h3
                className="font-['sofia-pro',sans-serif] font-semibold text-white"
                style={{ fontSize: "var(--text-card)" }}
              >
                {item.title}
              </h3>
              <p
                className="text-white/60 font-['sofia-pro',sans-serif] font-light leading-relaxed"
                style={{ fontSize: "var(--text-body)" }}
              >
                {item.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

/* ─── process section ────────────────────────────────────────────────── */

function ProcessSection({ data }: { data: ReturnType<typeof useAboutData> }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.65 }}
      className="border-t border-white/8 py-24 px-6 lg:px-12 max-w-[1400px] mx-auto"
    >
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.65, delay: 0.1 }}
        className="font-['sofia-pro',sans-serif] font-semibold text-white mb-16"
        style={{ fontSize: "var(--text-h2)" }}
      >
        {data.processTitle}
      </motion.h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {data.processSteps.map((step, i) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.15 + i * 0.08 }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-4">
              <p
                className="font-['sofia-pro',sans-serif] font-semibold text-white/40"
                style={{ fontSize: "var(--text-h2)" }}
              >
                {step.number}
              </p>
              <h3
                className="font-['sofia-pro',sans-serif] font-semibold text-white"
                style={{ fontSize: "var(--text-card)" }}
              >
                {step.title}
              </h3>
            </div>
            <p
              className="text-white/60 font-['sofia-pro',sans-serif] font-light leading-relaxed"
              style={{ fontSize: "var(--text-body)" }}
            >
              {step.description}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

/* ─── team section ───────────────────────────────────────────────────── */

function TeamSection({ data }: { data: ReturnType<typeof useAboutData> }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className="border-t border-white/8 py-24 px-6 lg:px-12 max-w-[1400px] mx-auto"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
        <div>
          <h2
            className="font-['sofia-pro',sans-serif] font-semibold text-white"
            style={{ fontSize: "var(--text-h2)" }}
          >
            {data.teamTitle}
          </h2>
        </div>
        <div>
          <p
            className="text-white/60 font-['sofia-pro',sans-serif] font-light leading-relaxed"
            style={{ fontSize: "var(--text-body)" }}
          >
            {data.teamDescription}
          </p>
        </div>
      </div>
    </motion.section>
  );
}

/* ─── cta section ────────────────────────────────────────────────────── */

function CtaSection({ data }: { data: ReturnType<typeof useAboutData> }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { localizedPath } = useLocale();

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="bg-[#1c1a27] py-20 border-t border-white/8"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <div className="flex flex-col gap-4 max-w-xl">
          <p
            className="text-white font-['sofia-pro',sans-serif] font-semibold"
            style={{ fontSize: "var(--text-h2)" }}
          >
            {data.cta}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href={localizedPath("/#kontakt")}
            className="inline-flex items-center gap-2 bg-[#8129ff] hover:bg-[#a318f8] border border-[#8129ff] text-white font-['sofia-pro',sans-serif] font-semibold px-[24px] py-[11px] rounded-lg transition-all"
            style={{ fontSize: "var(--text-btn)" }}
          >
            Kontakt aufnehmen
          </a>
        </div>
      </div>
    </motion.section>
  );
}

/* ─── page ───────────────────────────────────────────────────────────── */

export function UeberUns() {
  const glowRef = useRef<HTMLDivElement>(null);
  const data = useAboutData();

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!glowRef.current) return;
    glowRef.current.style.setProperty("--gx", `${e.clientX}px`);
    glowRef.current.style.setProperty("--gy", `${e.clientY}px`);
    glowRef.current.style.opacity = "1";
  }

  return (
    <div
      className="min-h-screen bg-[#0e0d13] text-white relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => glowRef.current && (glowRef.current.style.opacity = "0")}
    >
      <div
        ref={glowRef}
        className="pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-300"
        style={{
          opacity: 0,
          background:
            "radial-gradient(600px circle at var(--gx, 50%) var(--gy, 50%), rgba(129, 41, 255, 0.08) 0%, rgba(163, 24, 248, 0.04) 40%, transparent 70%)",
        }}
        aria-hidden
      />
      <Navbar />
      <UeberUnsHero data={data} />
      <MissionSection data={data} />
      <ValuesSection data={data} />
      <ProcessSection data={data} />
      <TeamSection data={data} />
      <CtaSection data={data} />
      <Footer />
    </div>
  );
}
