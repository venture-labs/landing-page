import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import { CtaButton } from "@/app/components/ui/CtaButton";
import { PulseCheckModal } from "@/app/components/PulseCheckModal";
import { useLocale } from "@/app/locale";
import { CTAS, EVENTS, PLACEMENTS, trackEvent } from "@/app/analytics";
import { BOOKING_URL } from "@/app/links";
import type { LandingPage } from "@/data/de/landing";

/**
 * An SEO landing page under /leistungen/<slug>, written in content/landing/.
 * Sections are plain text blocks (paragraphs, bullets, links), the FAQ is a
 * native <details> list so every answer is in the prerendered HTML and the
 * same text goes into the page's FAQPage JSON-LD (scripts/prerender.ts).
 */

type CtaKind = "quiz" | "book" | "contact";
type CtaSpot = "hero" | "bottom";

function LandingCta({
  cta,
  spot,
  accent,
  variant,
  onQuiz,
}: {
  cta: { kind: CtaKind; label: string };
  spot: CtaSpot;
  accent: string;
  variant: "primary" | "secondary";
  onQuiz: (placement: string) => void;
}) {
  const { localizedPath } = useLocale();
  const background = variant === "primary" ? accent : "rgba(255,255,255,0.1)";

  if (cta.kind === "quiz") {
    return (
      <CtaButton
        onClick={() => onQuiz(spot === "hero" ? PLACEMENTS.landingHeroQuiz : PLACEMENTS.landingBottomQuiz)}
        backgroundColor={background}
      >
        {cta.label}
      </CtaButton>
    );
  }
  if (cta.kind === "book") {
    return (
      <CtaButton
        href={BOOKING_URL}
        onClick={() =>
          trackEvent(
            EVENTS.callLinkClicked,
            spot === "hero" ? PLACEMENTS.landingHeroCta : PLACEMENTS.landingBottomCta,
            CTAS.bookCall,
          )
        }
        backgroundColor={background}
      >
        {cta.label}
      </CtaButton>
    );
  }
  return (
    <CtaButton
      href={localizedPath("/kontakt")}
      onClick={() =>
        trackEvent(
          EVENTS.contactSent,
          spot === "hero" ? PLACEMENTS.landingHeroCta : PLACEMENTS.landingBottomCta,
          CTAS.contact,
        )
      }
      backgroundColor={background}
    >
      {cta.label}
    </CtaButton>
  );
}

export function SeoLanding({ page }: { page: LandingPage }) {
  const { localizedPath } = useLocale();
  const glowRef = useRef<HTMLDivElement>(null);
  const [quizPlacement, setQuizPlacement] = useState<string | null>(null);
  const accent = page.accent;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page.slug]);

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

      {/* ─── hero ─── */}
      <section className="relative pt-36 pb-20 bg-[#1E1C27] overflow-hidden">
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
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-[1400px] mx-auto flex flex-col gap-8 px-6 lg:px-12"
        >
          <span
            className="font-semibold uppercase tracking-wide"
            style={{ fontSize: "var(--text-small)", color: accent }}
          >
            {page.eyebrow}
          </span>
          <h1
            className="font-semibold text-white leading-[1.08] max-w-5xl"
            style={{ fontSize: "var(--text-hero)" }}
          >
            {page.title}
          </h1>
          <p
            className="text-white/70 font-light leading-relaxed max-w-3xl"
            style={{ fontSize: "var(--text-body)" }}
          >
            {page.lead}
          </p>
          <div className="flex flex-wrap gap-4">
            <LandingCta
              cta={page.primaryCta}
              spot="hero"
              accent={accent}
              variant="primary"
              onQuiz={setQuizPlacement}
            />
            {page.secondaryCta && (
              <LandingCta
                cta={page.secondaryCta}
                spot="hero"
                accent={accent}
                variant="secondary"
                onQuiz={setQuizPlacement}
              />
            )}
          </div>
        </motion.div>
      </section>

      {/* ─── content sections ─── */}
      {page.sections.map((section, i) => (
        <section key={section.heading} className={i % 2 === 0 ? "bg-[#0e0d13] py-20" : "bg-[#1c1a27] py-20"}>
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <h2
              className="font-semibold text-white leading-tight lg:col-span-5"
              style={{ fontSize: "var(--text-section)" }}
            >
              {section.heading}
            </h2>
            <div className="lg:col-span-7 flex flex-col gap-5 min-w-0">
              {section.paragraphs.map((p) => (
                <p key={p} className="text-white/70 font-light leading-relaxed" style={{ fontSize: "var(--text-body)" }}>
                  {p}
                </p>
              ))}
              {section.bullets.length > 0 && (
                <ul className="flex flex-col gap-3">
                  {section.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex gap-3 text-white/80 font-light leading-relaxed"
                      style={{ fontSize: "var(--text-body)" }}
                    >
                      <span
                        className="mt-[0.6em] h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: accent }}
                        aria-hidden
                      />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
              {section.links.map((l) => (
                <Link
                  key={l.href}
                  to={localizedPath(l.href)}
                  className="inline-flex items-center gap-2 w-fit font-semibold underline underline-offset-4 transition-opacity hover:opacity-80"
                  style={{ color: accent, fontSize: "var(--text-body)" }}
                >
                  {l.label} <ArrowRight size={16} />
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* ─── FAQ ─── */}
      {page.faq.length > 0 && (
        <section className="bg-[#0e0d13] py-20 border-t border-white/8">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <h2
              className="font-semibold text-white leading-tight lg:col-span-5"
              style={{ fontSize: "var(--text-section)" }}
            >
              {page.faqHeading}
            </h2>
            <div className="lg:col-span-7 flex flex-col">
              {page.faq.map((f) => (
                <details key={f.question} className="group border-t border-white/10 last:border-b py-5">
                  <summary
                    className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold text-white [&::-webkit-details-marker]:hidden"
                    style={{ fontSize: "var(--text-body)" }}
                  >
                    <span>{f.question}</span>
                    <ChevronDown
                      size={20}
                      className="mt-1 shrink-0 text-white/50 transition-transform group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <p
                    className="mt-4 text-white/70 font-light leading-relaxed"
                    style={{ fontSize: "var(--text-body)" }}
                  >
                    {f.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── related ─── */}
      {page.related.length > 0 && (
        <section className="bg-[#1c1a27] py-16">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col gap-6">
            <h2 className="font-semibold text-white" style={{ fontSize: "var(--text-h2)" }}>
              {page.relatedHeading}
            </h2>
            <div className="flex flex-col gap-3">
              {page.related.map((l) => (
                <Link
                  key={l.href}
                  to={localizedPath(l.href)}
                  className="inline-flex items-center gap-2 w-fit font-semibold underline underline-offset-4 transition-opacity hover:opacity-80"
                  style={{ color: accent, fontSize: "var(--text-body)" }}
                >
                  {l.label} <ArrowRight size={16} />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── closing call to action ─── */}
      <section
        className="py-24"
        style={{ background: `linear-gradient(135deg, ${accent}11 0%, ${accent}08 50%, #1E1C27 100%)` }}
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="flex flex-col gap-4 max-w-2xl">
            <h2 className="font-semibold text-white leading-tight" style={{ fontSize: "var(--text-section)" }}>
              {page.ctaHeadline}
            </h2>
            <p className="text-white/80 font-light leading-relaxed" style={{ fontSize: "var(--text-body)" }}>
              {page.ctaBody}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0">
            <LandingCta
              cta={page.primaryCta}
              spot="bottom"
              accent={accent}
              variant="primary"
              onQuiz={setQuizPlacement}
            />
            {page.secondaryCta && (
              <LandingCta
                cta={page.secondaryCta}
                spot="bottom"
                accent={accent}
                variant="secondary"
                onQuiz={setQuizPlacement}
              />
            )}
          </div>
        </div>
      </section>

      <PulseCheckModal
        open={quizPlacement !== null}
        onOpenChange={(open) => {
          if (!open) setQuizPlacement(null);
        }}
        placement={quizPlacement ?? PLACEMENTS.landingHeroQuiz}
      />
      <Footer />
    </div>
  );
}
