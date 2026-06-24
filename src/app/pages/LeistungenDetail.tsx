import { useRef, useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { motion, useInView } from "motion/react";
import { ArrowRight, Code2, Building2, Palette, Bot } from "lucide-react";
import heroDetailImg from "@/imports/image-3.png";
import { StrengthSection } from "@/app/components/StrengthSection";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import { services } from "@/data/services";
import { serviceDetails } from "@/data/serviceDetails";

/* ─── helpers ────────────────────────────────────────────────────────── */

const accentColors: Record<string, string> = {
  development: "#a318f8",
  "company-building": "#ef4444",
  webdesign: "#2b95f6",
  "ki-strategie": "#fda700",
};

const iconMap: Record<string, React.ReactNode> = {
  code: <Code2 size={20} strokeWidth={1.5} className="text-white" />,
  grid: <Building2 size={20} strokeWidth={1.5} className="text-white" />,
  palette: <Palette size={20} strokeWidth={1.5} className="text-white" />,
  bot: <Bot size={20} strokeWidth={1.5} className="text-white" />,
};

/* ─── hero ───────────────────────────────────────────────────────────── */

function DetailHero({ detail, accent }: { detail: any; accent: string }) {
  return (
    <section className="relative pt-36 pb-0 bg-[#1E1C27] overflow-hidden">
      {/* ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[-150px] left-[-200px] w-[800px] h-[800px] rounded-full blur-[140px]"
          style={{ background: `${accent}18` }}
        />
        <div
          className="absolute top-[200px] right-[-100px] w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ background: `${accent}10` }}
        />
      </div>

      <div className="relative max-w-[1400px] mx-auto">
        {/* ── TEXT BLOCK — padded, full width ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-8 px-6 lg:px-12 pb-12"
        >
          <p
            className="font-['Sofia_Pro',sans-serif] font-light"
            style={{ fontSize: "var(--text-body)", color: accent }}
          >
            Leistung · {detail.heroHeadline.split(" ").slice(0, 3).join(" ")}
          </p>
          <h1
            className="font-['Sofia_Pro',sans-serif] font-semibold text-white leading-[1.05]"
            style={{ fontSize: "var(--text-hero)" }}
          >
            {detail.heroHeadline}
          </h1>
          <p
            className="text-white/60 font-['Sofia_Pro',sans-serif] font-light leading-relaxed max-w-2xl"
            style={{ fontSize: "var(--text-body)" }}
          >
            {detail.heroSubline}
          </p>
          <a
            href="/#kontakt"
            className="self-start inline-flex items-center gap-2 text-white font-['Sofia_Pro',sans-serif] font-semibold px-[24px] pt-[14px] pb-[8px] rounded-lg transition-all hover:scale-[1.02]"
            style={{ fontSize: "var(--text-btn)", backgroundColor: accent }}
          >
            Jetzt anfragen
            <ArrowRight size={15} />
          </a>
        </motion.div>

        {/* ── IMAGE — minimal side margin, near full 1400px width ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="mx-6 lg:mx-8 rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
        >
          <img
            src={heroDetailImg}
            alt={detail.heroHeadline}
            className="w-full object-cover"
            style={{ maxHeight: "560px" }}
          />
        </motion.div>

        {/* ── STRENGTH SECTION — below the image ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mx-6 lg:mx-8 mt-8 mb-0 rounded-xl overflow-hidden"
        >
          <StrengthSection />
        </motion.div>
      </div>
    </section>
  );
}

/* ─── process ────────────────────────────────────────────────────────── */

function ProcessStep({
  step,
  index,
  accent,
}: {
  step: { number: string; title: string; description: string };
  index: number;
  accent: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [open, setOpen] = useState(index === 0);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className="border-t border-white/8 cursor-pointer"
      onClick={() => setOpen((v) => !v)}
    >
      <div className="flex items-center gap-8 py-7">
        <span
          className="font-['Sofia_Pro',sans-serif] font-semibold shrink-0 w-12 tabular-nums"
          style={{ fontSize: "var(--text-h2)", color: open ? accent : "rgba(255,255,255,0.2)" }}
        >
          {step.number}
        </span>
        <h3
          className="flex-1 font-['Sofia_Pro',sans-serif] font-semibold text-white transition-colors"
          style={{ fontSize: "var(--text-h2)" }}
        >
          {step.title}
        </h3>
        <div
          className="shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300"
          style={{
            borderColor: open ? accent : "rgba(255,255,255,0.15)",
            color: open ? accent : "rgba(255,255,255,0.4)",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
          }}
        >
          <ArrowRight size={14} />
        </div>
      </div>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="pl-20 pb-8"
        >
          <p
            className="text-white/60 font-['Sofia_Pro',sans-serif] font-light leading-relaxed max-w-2xl"
            style={{ fontSize: "var(--text-body)" }}
          >
            {step.description}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

function ProcessSection({
  detail,
  accent,
}: {
  detail: any;
  accent: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-[#0e0d13] py-24" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="font-['Sofia_Pro',sans-serif] font-semibold text-white mb-16 leading-[1.1]"
          style={{ fontSize: "var(--text-hero)" }}
        >
          So entwickeln wir dein Produkt
        </motion.h2>
        <div>
          {detail.process.map((step: any, i: number) => (
            <ProcessStep key={step.number} step={step} index={i} accent={accent} />
          ))}
          <div className="border-t border-white/8" />
        </div>
      </div>
    </section>
  );
}

/* ─── case study ─────────────────────────────────────────────────────── */

function CaseSection({ detail, accent }: { detail: any; accent: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-[#272530] py-24" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="font-['Sofia_Pro',sans-serif] font-semibold text-white mb-16"
          style={{ fontSize: "var(--text-section)" }}
        >
          Beispielcase {detail.caseTitle}
        </motion.p>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-3 gap-0 mb-16 border border-white/8 rounded-xl overflow-hidden"
        >
          {detail.caseStats.map((stat: any, i: number) => (
            <div
              key={stat.label}
              className={`flex flex-col gap-2 p-8 ${i < 2 ? "border-r border-white/8" : ""}`}
            >
              <span
                className="font-['Sofia_Pro',sans-serif] font-semibold"
                style={{ fontSize: "var(--text-hero)", color: accent }}
              >
                {stat.value}
              </span>
              <span
                className="text-white/60 font-['Sofia_Pro',sans-serif] font-light"
                style={{ fontSize: "var(--text-body)" }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Image + text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
        >
          <div className="overflow-hidden rounded-xl">
            <img
              src={detail.caseImage}
              alt={detail.caseTitle}
              className="w-full h-[360px] object-cover"
            />
          </div>
          <div className="flex flex-col gap-6">
            <h3
              className="font-['Sofia_Pro',sans-serif] font-semibold text-white leading-tight"
              style={{ fontSize: "var(--text-h2)" }}
            >
              {detail.caseSubtitle}
            </h3>
            <p
              className="text-white/60 font-['Sofia_Pro',sans-serif] font-light leading-relaxed"
              style={{ fontSize: "var(--text-body)" }}
            >
              {detail.caseDescription}
            </p>
            <Link
              to={`/#projekte`}
              className="self-start inline-flex items-center gap-2 text-white/70 hover:text-white font-['Sofia_Pro',sans-serif] font-light transition-colors"
              style={{ fontSize: "var(--text-body)" }}
            >
              Zum Case ansehen
              <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── CTA banner ─────────────────────────────────────────────────────── */

function CtaBanner({ detail, accent }: { detail: any; accent: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="py-24 relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${accent}cc 0%, ${accent}88 50%, #1E1C27 100%)` }}
    >
      <div className="absolute inset-0 opacity-20" style={{ background: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.1\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }} />
      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="flex flex-col gap-4 max-w-2xl">
          <h2
            className="font-['Sofia_Pro',sans-serif] font-semibold text-white leading-tight"
            style={{ fontSize: "var(--text-section)" }}
          >
            {detail.ctaHeadline}
          </h2>
          <p
            className="text-white/80 font-['Sofia_Pro',sans-serif] font-light leading-relaxed"
            style={{ fontSize: "var(--text-body)" }}
          >
            {detail.ctaBody}
          </p>
        </div>
        <a
          href="/#kontakt"
          className="shrink-0 inline-flex items-center gap-2 bg-white text-[#1E1C27] font-['Sofia_Pro',sans-serif] font-semibold px-[24px] pt-[14px] pb-[8px] rounded-lg transition-all hover:scale-[1.02] hover:bg-white/90"
          style={{ fontSize: "var(--text-body)" }}
        >
          Jetzt Kontakt aufnehmen
          <ArrowRight size={16} />
        </a>
      </div>
    </motion.section>
  );
}

/* ─── other services ─────────────────────────────────────────────────── */

function OtherServices({ currentSlug }: { currentSlug: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const others = services.filter((s) => s.slug !== currentSlug);

  return (
    <section className="bg-[#0e0d13] py-24" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="font-['Sofia_Pro',sans-serif] font-semibold text-white mb-12"
          style={{ fontSize: "var(--text-section)" }}
        >
          Weitere Leistungen, die dein Projekt ergänzen
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {others.map((s, i) => {
            const acc = accentColors[s.slug] ?? "#8129ff";
            return (
              <motion.div
                key={s.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <Link
                  to={`/leistungen/${s.slug}`}
                  className="group flex flex-col gap-4 p-6 rounded-xl border border-white/8 bg-[#1c1a27] hover:border-white/20 transition-all hover:-translate-y-1 block"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: acc + "22" }}
                  >
                    {iconMap[s.icon]}
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3
                      className="font-['Sofia_Pro',sans-serif] font-semibold text-white"
                      style={{ fontSize: "var(--text-body)" }}
                    >
                      {s.title}
                    </h3>
                    <p
                      className="text-white/50 font-['Sofia_Pro',sans-serif] font-light leading-snug"
                      style={{ fontSize: "var(--text-small)" }}
                    >
                      {s.description}
                    </p>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 font-['Sofia_Pro',sans-serif] font-semibold mt-auto"
                    style={{ fontSize: "var(--text-small)", color: acc }}
                  >
                    Mehr erfahren <ArrowRight size={13} />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── contact strip ──────────────────────────────────────────────────── */

function ContactStrip() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="bg-[#1c1a27] py-20"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <p
          className="text-white/50 font-['Sofia_Pro',sans-serif] font-light max-w-xl"
          style={{ fontSize: "var(--text-body)" }}
        >
          Interessiert an einer Zusammenarbeit für dein Projekt? Nimm jetzt Kontakt auf.
        </p>
        <div className="flex flex-col gap-3">
          <a
            href="tel:+491487418f6"
            className="font-['Sofia_Pro',sans-serif] font-semibold text-[#8129ff] hover:text-[#a318f8] transition-colors"
            style={{ fontSize: "clamp(1.2rem, 2vw, 1.75rem)" }}
          >
            +49 148 74 18 f6
          </a>
          <a
            href="mailto:contact@venturelabs.team"
            className="font-['Sofia_Pro',sans-serif] font-semibold text-[#8129ff] hover:text-[#a318f8] transition-colors"
            style={{ fontSize: "clamp(1.2rem, 2vw, 1.75rem)" }}
          >
            contact@venturelabs.team
          </a>
        </div>
      </div>
    </motion.section>
  );
}

/* ─── page ───────────────────────────────────────────────────────────── */

export function LeistungenDetail() {
  const { slug } = useParams<{ slug: string }>();
  const glowRef = useRef<HTMLDivElement>(null);
  const detail = serviceDetails.find((d) => d.slug === slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!detail) {
    return (
      <div className="min-h-screen bg-[#0e0d13] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/50 font-['Sofia_Pro',sans-serif] mb-4">Service nicht gefunden.</p>
          <Link to="/leistungen" className="text-[#8129ff] hover:underline font-['Sofia_Pro',sans-serif]">
            Zurück zur Übersicht
          </Link>
        </div>
      </div>
    );
  }

  const accent = accentColors[detail.slug] ?? "#8129ff";

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
      <DetailHero detail={detail as any} accent={accent} />
      <ProcessSection detail={detail} accent={accent} />
      <CaseSection detail={detail} accent={accent} />
      <CtaBanner detail={detail} accent={accent} />
      <OtherServices currentSlug={detail.slug} />
      <ContactStrip />
      <Footer />
    </div>
  );
}
