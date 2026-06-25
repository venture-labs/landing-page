import { useRef } from "react";
import { Link } from "react-router";
import { motion, useInView } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import { featuredCases, gridCases } from "@/data/cases";

function CasesHero() {
  return (
    <section
      className="relative pt-40 pb-32 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #1E1C27 0%, #1E1C27 40%, #0e0d13 100%)",
      }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-250px] left-[-200px] w-[700px] h-[500px] rounded-full bg-[#8129ff]/10 blur-[120px]" />
      </div>
      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-8 max-w-3xl"
        >
          <h1
            className="font-['Sofia_Pro',sans-serif] font-semibold text-white leading-[1.05]"
            style={{ fontSize: "var(--text-hero)" }}
          >
            Unsere Projekte
          </h1>
          <p
            className="text-white/60 font-['Sofia_Pro',sans-serif] font-light leading-relaxed max-w-2xl"
            style={{ fontSize: "var(--text-body)" }}
          >
            Unsere Projekte ziehen sich durch alle Branchen. Zu unseren Kunden
            zählen Start-ups wie Großkonzerne.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function CaseGridCard({ c, index }: { c: { slug: string; title: string; subtitle: string; image: string }; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: (index % 6) * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        to={`/cases/${c.slug}`}
        className="flex flex-col gap-6 group cursor-pointer hover:opacity-90 transition-opacity"
      >
        <div className="overflow-hidden rounded-xl">
          <img
            src={c.image}
            alt={c.title}
            className="w-full h-[280px] object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-col gap-2">
          <h3
            className="font-semibold text-white leading-tight"
            style={{ fontSize: "var(--text-card)" }}
          >
            {c.title}
          </h3>
          <p
            className="text-white/60 font-light leading-snug"
            style={{ fontSize: "var(--text-small)" }}
          >
            {c.subtitle}
          </p>
          <span className="inline-flex items-center gap-2 text-[#a318f8] text-sm mt-2">
            Zum Projekt
            <ArrowRight size={14} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export function CasesOverview() {
  const glowRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!glowRef.current) return;
    glowRef.current.style.setProperty("--gx", `${e.clientX}px`);
    glowRef.current.style.setProperty("--gy", `${e.clientY}px`);
    glowRef.current.style.opacity = "1";
  }

  const allCases = [...featuredCases, ...gridCases];

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
      <CasesHero />
      <section className="bg-[#0e0d13] pb-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {allCases.map((c, i) => (
              <CaseGridCard key={c.slug} c={c} index={i} />
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
