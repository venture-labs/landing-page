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
 * "Mögliche Use Cases" — VL-11-S3 (CONCEPT.md §S3), extended by VL-11-S9
 * (CONCEPT.md §S9, VL-11-D19).
 *
 * ONE carousel of every use case, all in the situation format (a sentence the
 * customer would say about his problem on top, the agent name and what it takes
 * over with check marks below): 20 to 24 cards from `data.situations`. It is
 * built on the `ui/carousel.tsx` (embla-carousel-react) wrapper. The first card
 * is the Beleg-Inbox situation (`agentKind: live`) and shows the
 * `leistungen.useCases.liveLabel` pill ("läuft bei uns" / "Runs at our
 * company"); every other card (`agentKind: example`) shows the
 * `leistungen.exampleAgentLabel` pill ("Beispiel" / "Example"), which keeps
 * VL-11-D3's truth rule on the card itself as well as in the
 * `useCasesLeadLine` content field beneath the heading. The former second
 * section ("Was sonst noch möglich ist", `ToolProfile.tsx`) is gone — its
 * sixteen options are cards here.
 *
 * Navigation is the prev/next pair plus a short "k / n" position text
 * (`leistungen.useCases.position`); the former dot row does not fit 20 to 24
 * cards at 390 px. A screen-reader-only live region keeps the "Card k of n"
 * announcement (`leistungen.useCases.stepOf`).
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
 * programmatic move (`scrollPrev`/`scrollNext`) passes
 * `jump = Boolean(reducedMotion)`, which asks Embla to snap instead of
 * animate. `opts={{ align: "start", containScroll: false }}` keeps one Embla
 * scroll-snap per card regardless of how many cards fit a given viewport, so
 * the position text stays a true card index.
 *
 * Mounted in Leistungen.tsx directly after <PulseJourney /> (`#ablauf`),
 * ahead of <SkillMatrix />.
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
              const isLive = situation.agentKind === "live";
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
                    <div className="flex justify-end">
                      <span
                        className="font-bold uppercase tracking-[0.09em] rounded-full px-2.5 py-1 whitespace-nowrap"
                        style={
                          isLive
                            ? {
                                fontSize: "0.66rem",
                                color: "rgba(255,255,255,0.92)",
                                backgroundColor: `${accent}40`,
                              }
                            : {
                                fontSize: "0.66rem",
                                color: "rgba(255,255,255,0.42)",
                                backgroundColor: "rgba(255,255,255,0.05)",
                              }
                        }
                      >
                        {isLive ? t("leistungen.useCases.liveLabel") : t("leistungen.exampleAgentLabel")}
                      </span>
                    </div>
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

          <span
            aria-hidden
            className="min-w-[4.5rem] text-center text-white/60 font-light tabular-nums"
            style={{ fontSize: "var(--text-small)" }}
          >
            {t("leistungen.useCases.position", { current: selected + 1, total })}
          </span>

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
