import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLeistungenData } from "@/data/content";
import { CtaButton } from "@/app/components/ui/CtaButton";
import { BOOKING_URL } from "@/app/links";
import { CTAS, EVENTS, PLACEMENTS, trackEvent } from "@/app/analytics";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/app/components/ui/carousel";

/**
 * "Mögliche Use Cases" — VL-11-S3 (CONCEPT.md §S3).
 *
 * Replaces this file's former `SituationsSection` ("Kommt dir eine davon
 * bekannt vor?", a vertical stack of quote bubbles) and deletes the large
 * "Im Einsatz: Beleg-Inbox" Steckbrief box that used to live in
 * `ToolProfile.tsx` — the two are merged into one horizontal, navigable
 * carousel of uniform cards, built on the existing, previously-unused
 * `ui/carousel.tsx` (embla-carousel-react) wrapper. The former `receipts`
 * situation (`agentName: 'Beleg-Inbox'`, `agentKind: live`) stays the
 * carousel's Beleg-Inbox card — no new, differently-shaped card is built
 * from `content/tools/beleg-inbox.md`'s richer fields (see the spec's
 * Assumptions).
 *
 * The per-card "Beispiel"/"Example" badge (`agentKind === "example"`) is
 * dropped entirely — VL-11-D3's truth rule is kept instead by the section's
 * own heading ("**Mögliche** Use Cases" / "**Possible** use cases") and the
 * `useCasesLeadLine` content field beneath it, which names the one use case
 * that runs today and marks the rest as examples (criterion 7a). `agentKind`
 * itself stays in the content and the generated data — only the per-card
 * badge markup is gone.
 *
 * Carousel behaviour follows `ClusterStorySection`'s established, SSR-safe
 * pattern: `useReducedMotion()` (motion/react) is read client-side only,
 * `embla-carousel-react` mounts the Embla engine inside `useEffect` only
 * (verified in its own source), so every card's markup renders identically
 * on the server and survives `renderToString`/prerender with no client-only
 * gating. `CarouselPrevious`/`CarouselNext` from `ui/carousel.tsx` are not
 * reused because their sr-only labels are hardcoded English, never routed
 * through i18next — this section writes its own prev/next buttons against
 * the Embla `api` obtained via `<Carousel setApi={setApi}>`, with
 * `aria-label`s from `leistungen.useCases.{prevLabel,nextLabel}`. Every
 * programmatic move (`scrollPrev`/`scrollNext`/`scrollTo`) passes
 * `jump = Boolean(reducedMotion)`, which asks Embla to snap instead of
 * animate (criterion 11). `opts={{ align: "start", containScroll: false }}`
 * keeps one Embla scroll-snap per card regardless of how many cards fit a
 * given viewport, so the dot row stays a true one-dot-per-card index.
 *
 * Mounted in Leistungen.tsx directly after <ClusterStorySection />.
 */

const ACCENTS = ["#2b95f6", "#a318f8", "#fda700", "#8129ff", "#2b95f6"];

export function UseCasesSection() {
  const { t } = useTranslation();
  const data = useLeistungenData();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reducedMotion = useReducedMotion();
  const jump = Boolean(reducedMotion);

  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setSelected(api.selectedScrollSnap());
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };

    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  const total = data.situations.length;

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="bg-[#181620] py-24"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col gap-10">
        <div className="max-w-2xl mx-auto text-center flex flex-col gap-4">
          <h2
            className="font-semibold text-white leading-tight"
            style={{ fontSize: "var(--text-section)" }}
          >
            {data.useCasesHeading}
          </h2>
          <p
            className="text-white/60 font-light leading-relaxed"
            style={{ fontSize: "var(--text-body)" }}
          >
            {data.useCasesLeadLine}
          </p>
        </div>

        <Carousel opts={{ align: "start", containScroll: false }} setApi={setApi} className="w-full">
          <CarouselContent>
            {data.situations.map((situation, index) => {
              const accent = ACCENTS[index % ACCENTS.length];
              return (
                <CarouselItem
                  key={situation.id}
                  className="basis-[88%] sm:basis-[62%] lg:basis-[34%]"
                >
                  <div
                    className="h-full rounded-3xl p-6 md:p-8 flex flex-col gap-4"
                    style={{
                      backgroundColor: `${accent}1a`,
                      boxShadow: `inset 0 0 0 1px ${accent}59`,
                    }}
                  >
                    <p
                      className="font-light text-white leading-snug"
                      style={{ fontSize: "var(--text-h3)" }}
                    >
                      <span aria-hidden style={{ color: accent }}>
                        “
                      </span>
                      {situation.text}
                      <span aria-hidden style={{ color: accent }}>
                        ”
                      </span>
                    </p>
                    <div className="flex flex-col gap-2 pt-3 border-t border-white/10 mt-auto">
                      <span
                        className="font-semibold"
                        style={{ color: accent, fontSize: "var(--text-body)" }}
                      >
                        {situation.agentName}
                      </span>
                      <ul className="flex flex-col gap-1.5">
                        {situation.capabilities.map((capability) => (
                          <li
                            key={capability}
                            className="flex items-start gap-2 text-white/70 font-light"
                            style={{ fontSize: "var(--text-small)" }}
                          >
                            <Check
                              size={14}
                              className="mt-0.5 shrink-0"
                              style={{ color: accent }}
                              aria-hidden
                            />
                            {capability}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>

        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            aria-label={t("leistungen.useCases.prevLabel")}
            disabled={!canScrollPrev}
            onClick={() => api?.scrollPrev(jump)}
            className="w-10 h-10 flex items-center justify-center rounded-full border border-white/15 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-2">
            {data.situations.map((situation, index) => (
              <button
                key={situation.id}
                type="button"
                aria-label={t("leistungen.useCases.stepOf", { current: index + 1, total })}
                aria-current={index === selected ? "true" : undefined}
                onClick={() => api?.scrollTo(index, jump)}
                className="rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{
                  width: index === selected ? "1.5rem" : "0.5rem",
                  height: "0.5rem",
                  backgroundColor:
                    index === selected ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.25)",
                  transition: reducedMotion ? "none" : "width 0.2s ease, background-color 0.2s ease",
                }}
              />
            ))}
          </div>

          <button
            type="button"
            aria-label={t("leistungen.useCases.nextLabel")}
            disabled={!canScrollNext}
            onClick={() => api?.scrollNext(jump)}
            className="w-10 h-10 flex items-center justify-center rounded-full border border-white/15 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ArrowRight size={18} />
          </button>
        </div>

        <span className="sr-only" aria-live="polite">
          {t("leistungen.useCases.stepOf", { current: selected + 1, total })}
        </span>

        <div className="flex justify-center">
          <CtaButton
            href={BOOKING_URL}
            backgroundColor="#8129ff"
            onClick={() => trackEvent(EVENTS.callLinkClicked, PLACEMENTS.situations, CTAS.bookCall)}
          >
            {data.useCasesCtaLabel}
          </CtaButton>
        </div>
      </div>
    </motion.section>
  );
}
