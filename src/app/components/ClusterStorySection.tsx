import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Check } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { CTAS, EVENTS, PLACEMENTS, trackEvent } from "@/app/analytics";
import { BOOKING_URL } from "@/app/links";
import { CtaButton } from "@/app/components/ui/CtaButton";
import { useLeistungenData } from "@/data/content";
import type { ClusterStoryStep } from "@/data/de/leistungen";
import { ClusterStoryWorld } from "./cluster-story/ClusterStoryWorld";
import { FINAL_F, LABEL_KEYS, clamp, type Labels } from "./cluster-story/world";

/**
 * ClusterStorySection — VL-11-S7 (the growing cluster story, design "Cluster Grafik" v2).
 *
 * ONE sticky "world" stage: a single connected map that only grows, panned and zoomed by a camera
 * as a pure function of the story position `f` (and a quiet clock `t`). `f` comes from the scroll
 * position (a block's centre against the viewline), so the picture scrubs both ways; the ten
 * step blocks (nine steps plus the optional, marked-as-planned "Ausblick") sit beside it on
 * desktop and beneath it on phones, where the stage stays pinned to the top. Everything the
 * stage draws lives in `cluster-story/world.ts` (pure model; its docblock holds the `setF` /
 * `setStep` / `?video=1` contract, the step-mark rules and the colour of each element group)
 * and `cluster-story/ClusterStoryWorld.tsx` (the renderer).
 *
 * SSR-safe by construction: the server and the first client render show the finished picture
 * (`f = 8.2`, desktop camera, no clock) plus the complete ordered list of ten blocks. Scroll,
 * narrow viewport, reduced motion and `?video=1` are read in effects only; nothing here touches
 * `window`, `document` or `matchMedia` at module scope or during render. Under
 * `prefers-reduced-motion: reduce` there is no clock and no transition: `f` snaps to the finished
 * state of the nearest step (`k + 0.2`).
 */

const TOTAL_STEPS = 9;
/** Index of the area that carries the "Beispiel"/"Example" Tap2Link tag (step 8's third tile). */
const EXAMPLE_AREA_INDEX = 2;
/** The step whose block carries the booking button (the offer: build and run). */
const OFFER_STEP_INDEX = 8;

/** One accent per step, in storyline order; the tenth (Ausblick) is amber like the "geplant" tags. */
const STEP_ACCENTS = [
  "#2b95f6", // 0 input
  "#8129ff", // 1 concepts
  "#a318f8", // 2 handover
  "#a318f8", // 3 build
  "#d9aeff", // 4 install
  "#2b95f6", // 5 telemetry
  "#fda700", // 6 loop
  "#fda700", // 7 growth
  "#a318f8", // 8 service
  "#fda700", // 9 outlook
];

const ACTIVE_TEXT_DARK = "#0e0d13";
const ACTIVE_TEXT_LIGHT = "#ffffff";

/** WCAG relative luminance of a `#rrggbb` hex colour. */
function relLuminance(hex: string): number {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const toLinear = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** The active pill's foreground: whichever fixed foreground clears 4.5:1 on the step's accent. */
function activeNavTextColor(accent: string): string {
  const hi = Math.max(relLuminance(accent), relLuminance(ACTIVE_TEXT_DARK));
  const lo = Math.min(relLuminance(accent), relLuminance(ACTIVE_TEXT_DARK));
  return (hi + 0.05) / (lo + 0.05) >= 4.5 ? ACTIVE_TEXT_DARK : ACTIVE_TEXT_LIGHT;
}

/** Where on the screen a block counts as "current": the middle (side by side) or just below the pinned stage. */
function viewLine(sticky: HTMLElement | null): number {
  const vh = window.innerHeight;
  if (window.innerWidth >= 1024 || !sticky) return vh * 0.5;
  // The stage's bottom edge once pinned (its `top` plus its height), never its current position:
  // the target of a pill click must not move while the page is still scrolling it into place.
  const pinnedBottom = (parseFloat(window.getComputedStyle(sticky).top) || 0) + sticky.offsetHeight;
  return Math.min(pinnedBottom + 130, vh - 80);
}

/** The story position for the current scroll position: block centres against the viewline. */
function readF(blocks: Array<HTMLElement | null>, sticky: HTMLElement | null): number {
  const vh = window.innerHeight;
  const line = viewLine(sticky);
  const c: number[] = [];
  let lastHeight = 0;
  for (const el of blocks) {
    if (!el) return FINAL_F;
    const r = el.getBoundingClientRect();
    c.push(r.top + r.height / 2);
    lastHeight = r.height;
  }
  const last = c.length - 1;
  if (line <= c[0]) return Math.max(-1, (line - c[0]) / (vh * 0.84));
  if (line >= c[last]) return last + clamp((line - c[last]) / (lastHeight * 0.5)) * 0.2;
  let k = 0;
  while (c[k + 1] <= line) k++;
  return k + (line - c[k]) / (c[k + 1] - c[k]);
}

interface VideoWindow {
  setF?: (f: number, t?: number) => void;
  setStep?: (n: number, p?: number, t?: number) => void;
}

interface View {
  f: number;
  t: number | null;
}

export function ClusterStorySection() {
  const { t } = useTranslation();
  const { clusterStory, useCasesCtaLabel } = useLeistungenData();
  const reducedMotion = useReducedMotion();

  // Server and first client render: the finished picture, desktop camera, no clock.
  const [view, setView] = useState<View>({ f: FINAL_F, t: null });
  const [narrow, setNarrow] = useState(false);
  const [video, setVideo] = useState(false);
  const [inView, setInView] = useState(false);

  const sectionRef = useRef<HTMLElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const blockRefs = useRef<Array<HTMLLIElement | null>>([]);
  const blockRefCallbacks = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => (el: HTMLLIElement | null) => {
        blockRefs.current[index] = el;
      }),
    [],
  );

  const steps = clusterStory?.steps;
  const stepCount = steps?.length ?? 0;
  const motionOff = reducedMotion === true;

  const labels = useMemo<Labels>(
    () => ({
      g: Object.fromEntries(LABEL_KEYS.map((key) => [key, t(`leistungen.clusterStory.graphic.${key}`)])),
      ch: steps?.[0]?.channels?.map((c) => c.label) ?? [],
      areas: steps?.[7]?.areas?.map((a) => a.label) ?? [],
      planned: t("leistungen.clusterStory.plannedChannelTag"),
      example: t("leistungen.exampleAgentLabel"),
    }),
    [t, steps],
  );

  // Viewport facts and the `?video=1` switch: effects only.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    setVideo(new URLSearchParams(window.location.search).get("video") === "1");
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Scroll position -> f. One passive listener, coalesced into one frame (synchronous under reduced motion).
  useEffect(() => {
    if (video || stepCount === 0) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      let f = Math.round(readF(blockRefs.current.slice(0, stepCount), stickyRef.current) * 1000) / 1000;
      if (motionOff) f = Math.round(clamp(f, 0, stepCount - 1)) + 0.2;
      setView((v) => (v.f === f && (!motionOff || v.t === null) ? v : { f, t: motionOff ? null : v.t }));
    };
    const onChange = () => {
      if (motionOff) update();
      else if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onChange, { passive: true });
    window.addEventListener("resize", onChange);
    const ro = new ResizeObserver(onChange);
    if (sectionRef.current) ro.observe(sectionRef.current);
    return () => {
      window.removeEventListener("scroll", onChange);
      window.removeEventListener("resize", onChange);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [video, motionOff, stepCount]);

  // The quiet clock: only while the stage is on screen and motion is allowed.
  useEffect(() => {
    if (video || reducedMotion !== false || !inView) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      setView((v) => ({ f: v.f, t: (now - t0) / 1000 }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [video, reducedMotion, inView]);

  // `?video=1`: the stage fills the window, the page does not scroll, and `setF` / `setStep` drive it.
  useEffect(() => {
    if (!video) return;
    const w = window as unknown as VideoWindow;
    const setF = (f: number, tt = 0) => flushSync(() => setView({ f, t: tt }));
    w.setF = setF;
    w.setStep = (n, p = 1, tt = 0) => setF(n - 0.5 + 0.7 * p, tt);
    const html = document.documentElement.style.overflow;
    const body = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      delete w.setF;
      delete w.setStep;
      document.documentElement.style.overflow = html;
      document.body.style.overflow = body;
    };
  }, [video]);

  const active = clamp(Math.floor(view.f + 0.3), 0, Math.max(stepCount - 1, 0));

  const goTo = useCallback(
    (index: number) => {
      const el = blockRefs.current[index];
      if (!el) return;
      const r = el.getBoundingClientRect();
      const top = window.scrollY + r.top + r.height / 2 - viewLine(stickyRef.current);
      window.scrollTo({ top, behavior: motionOff ? "auto" : "smooth" });
    },
    [motionOff],
  );

  if (!clusterStory || !steps || steps.length === 0) return null;

  return (
    <section ref={sectionRef} className="bg-[#0e0d13] py-24 [overflow-x:clip]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col gap-10">
        <div className="max-w-2xl flex flex-col gap-4">
          <h2
            id="cluster-story-heading"
            className="font-semibold text-white leading-tight"
            style={{ fontSize: "var(--text-section)" }}
          >
            {clusterStory.heading}
          </h2>
          <p className="text-white/60 font-light leading-relaxed" style={{ fontSize: "var(--text-body)" }}>
            {clusterStory.intro}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-8 lg:gap-16 items-start">
          <div
            ref={stickyRef}
            // Below `lg` default grid auto-placement would give this item its OWN row, sized to its
            // own short content, so the sticky stage's containing block could never span the whole
            // story. Forcing this item and the `<ol>` into the SAME row (`grid-row: 1`) AND the
            // same column (`grid-column: 1`, else auto-placement opens an implicit second column)
            // makes the shared row as tall as the `<ol>`; `self-start` keeps this box small and
            // pinned to the row's top. At `lg` both reset to `auto`: the explicit 2-column
            // template places them already. The wrapper is opaque so text never shows through
            // the pinned stage and rail on phones.
            className={`[grid-row:1] [grid-column:1] lg:[grid-row:auto] lg:[grid-column:auto] lg:sticky lg:top-28 top-24 sticky self-start ${
              video ? "z-[9999]" : "z-10"
            } -mx-2 md:mx-0 bg-[#0e0d13]`}
          >
            <div
              id="cluster-story-stage"
              data-cluster-stage=""
              data-f={String(Math.round(view.f * 100) / 100)}
              className={
                video
                  ? "fixed inset-0 z-[9999] bg-[#14131b]"
                  : "relative w-full max-w-[640px] aspect-[358/300] md:aspect-[600/470] overflow-hidden rounded-2xl bg-[#14131b]"
              }
              style={video ? undefined : { boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }}
            >
              <ClusterStoryWorld f={view.f} t={view.t} narrow={narrow} labels={labels} />
            </div>

            <nav
              aria-label={t("leistungen.clusterStory.stepNavLabel")}
              className={`mt-3 h-12 items-center gap-1 md:gap-2 max-w-[640px] ${video ? "hidden" : "flex"}`}
            >
              {steps.map((step, index) => (
                <StepPill
                  key={step.id}
                  index={index}
                  step={step}
                  accent={STEP_ACCENTS[index] ?? "#8129ff"}
                  current={index === active}
                  done={index < active}
                  planned={step.status === "planned"}
                  plannedTag={labels.planned}
                  onGo={goTo}
                />
              ))}
            </nav>
          </div>

          <ol
            aria-label={clusterStory.heading}
            // Shares the sticky stage's row AND column (see above) so that cell's height follows
            // the `<ol>`'s own content. The top padding reserves the pinned stage plus its rail
            // (stage width x aspect + 60px) so the first block never starts underneath it.
            className="[grid-row:1] [grid-column:1] lg:[grid-row:auto] lg:[grid-column:auto] pt-[calc((100vw-32px)*0.838+60px)] md:pt-[calc(min(640px,100vw-48px)*0.783+60px)] lg:pt-0 flex flex-col"
          >
            {steps.map((step, index) => (
              <StoryBlock
                key={step.id}
                step={step}
                index={index}
                accent={STEP_ACCENTS[index] ?? "#8129ff"}
                setRef={blockRefCallbacks[index]}
                ctaLabel={index === OFFER_STEP_INDEX ? useCasesCtaLabel : undefined}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

const StepPill = memo(function StepPill({
  index,
  step,
  accent,
  current,
  done,
  planned,
  plannedTag,
  onGo,
}: {
  index: number;
  step: ClusterStoryStep;
  accent: string;
  current: boolean;
  done: boolean;
  planned: boolean;
  plannedTag: string;
  onGo: (index: number) => void;
}) {
  return (
    <button
      type="button"
      aria-current={current ? "step" : undefined}
      aria-label={`${index + 1}. ${step.navLabel}${planned ? ` (${plannedTag})` : ""}`}
      onClick={() => onGo(index)}
      className={`min-w-0 h-8 flex items-center justify-center gap-1.5 rounded-full font-semibold transition-colors motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fda700] ${
        current ? "flex-none md:px-3 w-8 md:w-auto" : "flex-1 max-w-8"
      } ${planned ? (current ? "border border-dashed border-[#0e0d13]/70" : "border border-dashed border-[#fda700]/70") : ""}`}
      style={{
        fontSize: "0.78rem",
        backgroundColor: current ? accent : "rgba(255,255,255,0.06)",
        color: current ? activeNavTextColor(accent) : "rgba(255,255,255,0.75)",
      }}
    >
      {done ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : <span>{index + 1}</span>}
      {current ? (
        <span className="hidden md:inline whitespace-nowrap">
          {step.navLabel}
          {planned ? ` · ${plannedTag}` : ""}
        </span>
      ) : null}
    </button>
  );
});

const StoryBlock = memo(function StoryBlock({
  step,
  index,
  accent,
  setRef,
  ctaLabel,
}: {
  step: ClusterStoryStep;
  index: number;
  accent: string;
  setRef: (el: HTMLLIElement | null) => void;
  ctaLabel?: string;
}) {
  const { t } = useTranslation();
  const planned = step.status === "planned";

  return (
    <li
      ref={setRef}
      data-step-index={index}
      className="min-h-[62vh] lg:min-h-[84vh] flex flex-col justify-center gap-3 py-8"
    >
      {planned ? (
        <span className="flex items-center gap-3">
          <span className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize: "0.75rem", color: accent }}>
            {t("leistungen.clusterStory.outlookEyebrow")}
          </span>
          <span
            className="rounded-full border border-dashed border-[#fda700] font-bold uppercase tracking-wide px-2 py-0.5 text-[#fda700]"
            style={{ fontSize: "0.62rem" }}
          >
            {t("leistungen.clusterStory.plannedChannelTag")}
          </span>
        </span>
      ) : (
        <span className="font-semibold uppercase tracking-[0.12em]" style={{ fontSize: "0.75rem", color: accent }}>
          {t("leistungen.clusterStory.stepOf", { current: index + 1, total: TOTAL_STEPS })}
        </span>
      )}
      <h3 className="font-semibold text-white leading-tight" style={{ fontSize: "var(--text-h2)" }}>
        {step.heading}
      </h3>
      <p className="text-white/65 font-light leading-relaxed max-w-xl" style={{ fontSize: "var(--text-body)" }}>
        {step.body}
      </p>

      {step.channels && (
        <div className="flex flex-wrap gap-2 mt-1">
          {step.channels.map((channel) => (
            <span
              key={channel.label}
              className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5 text-white/80"
              style={{ fontSize: "0.86rem" }}
            >
              {channel.label}
              {channel.status === "planned" && (
                <span
                  className="rounded-full font-bold uppercase tracking-wide px-2 py-0.5"
                  style={{ fontSize: "0.62rem", background: "var(--brand-muted)", color: "#1E1C27" }}
                >
                  {t("leistungen.clusterStory.plannedChannelTag")}
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      {step.areas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
          {step.areas.map((area, areaIndex) => (
            <div
              key={area.label}
              className="flex items-center gap-2 flex-wrap rounded-xl bg-white/[0.03] px-3 py-2 text-white/78"
              style={{ fontSize: "0.88rem" }}
            >
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: "#fda700" }} aria-hidden />
              <span>{area.label}</span>
              {areaIndex === EXAMPLE_AREA_INDEX && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="font-semibold text-white/85">Tap2Link</span>
                  <span
                    className="rounded-full font-bold uppercase tracking-wide px-2 py-0.5"
                    style={{ fontSize: "0.6rem", background: "var(--brand-muted)", color: "#1E1C27" }}
                  >
                    {t("leistungen.exampleAgentLabel")}
                  </span>
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {step.billingNote && (
        <p className="font-medium text-white mt-1" style={{ fontSize: "1rem" }}>
          {step.billingNote}
        </p>
      )}

      {ctaLabel ? (
        <div className="mt-3">
          <CtaButton
            href={BOOKING_URL}
            backgroundColor="#8129ff"
            onClick={() => trackEvent(EVENTS.callLinkClicked, PLACEMENTS.clusterStory, CTAS.bookCall)}
          >
            {ctaLabel}
          </CtaButton>
        </div>
      ) : null}
    </li>
  );
});
