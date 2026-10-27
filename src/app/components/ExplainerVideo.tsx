import { useEffect, useRef, useState } from "react";
import { ArrowRight, Clock, Captions, Play, Volume2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BOOKING_URL } from "@/app/links";
import { CTAS, EVENTS, PLACEMENTS, trackEvent } from "@/app/analytics";

/**
 * The explainer video at the top of /de/leistungen, as a facade: only the
 * poster (WebP, fixed 16:9 box, so CLS 0) is on the page at load; the <video>
 * is created on the click, with preload="metadata" and the German captions
 * on by default. No autoplay: the video lives on the voice. Self-hosted
 * (public/video/), so no third-party request and no consent banner.
 *
 * Fast start: once the page is loaded and the browser idle, the <video> is
 * created hidden behind the poster and buffers its first seconds
 * (preload="auto"), so the tap only has to call play(). Never on Save-Data or
 * a slow connection (see canWarmVideo), and never before the page is
 * interactive, so it cannot delay LCP or hydration.
 *
 * The file names carry the version (v5): a new cut gets a new name, which is
 * what lets netlify.toml cache /video/* as immutable for a year. Duration
 * label and aria label (locales: leistungen.video.*) follow the file.
 */
const SRC = "/video/erklaervideo-v5-720.mp4";
const VTT = "/video/erklaervideo-v5.de.vtt";
const POSTER = "/video/erklaervideo-poster-v5.webp";
const POSTER_SMALL = "/video/erklaervideo-poster-v5-640.webp";

type Phase = "poster" | "playing" | "ended";

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

/** Warm the first video bytes only where it is cheap: no Save-Data, no 2G/3G. */
function canWarmVideo(): boolean {
  const c = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (!c) return true;
  if (c.saveData) return false;
  return !c.effectiveType || c.effectiveType === "4g";
}

function whenIdle(cb: () => void): () => void {
  let cancelled = false;
  let handle = 0;
  const run = () => {
    if (cancelled) return;
    handle = window.requestIdleCallback
      ? window.requestIdleCallback(cb, { timeout: 4000 })
      : window.setTimeout(cb, 1500);
  };
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener("load", run);
    if (window.cancelIdleCallback) window.cancelIdleCallback(handle);
    else window.clearTimeout(handle);
  };
}

export function ExplainerVideo({ onQuizOpen }: { onQuizOpen: () => void }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("poster");
  const [mounted, setMounted] = useState(false);
  const [warm, setWarm] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const halfFired = useRef(false);

  useEffect(() => {
    if (!canWarmVideo()) return;
    return whenIdle(() => setWarm(true));
  }, []);

  // The <video> exists hidden once warm, visible once the facade was clicked;
  // start it in the same task chain as the click so the browser accepts the sound.
  useEffect(() => {
    if (!mounted) return;
    const v = videoRef.current;
    if (!v) return;
    if (v.textTracks[0]) v.textTracks[0].mode = "showing";
    v.focus();
    v.play().catch(() => {});
  }, [mounted]);

  function start() {
    trackEvent(EVENTS.videoPlayed, PLACEMENTS.leistungenHero);
    halfFired.current = false;
    setPhase("playing");
    setMounted(true);
  }

  function replay() {
    const v = videoRef.current;
    if (!v) return;
    halfFired.current = false;
    v.currentTime = 0;
    setPhase("playing");
    v.play().catch(() => {});
  }

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (!v || halfFired.current || !v.duration) return;
    if (v.currentTime >= v.duration / 2) {
      halfFired.current = true;
      trackEvent(EVENTS.video50, PLACEMENTS.leistungenHero);
    }
  }

  function handleEnded() {
    trackEvent(EVENTS.videoCompleted, PLACEMENTS.leistungenHero);
    setPhase("ended");
  }

  return (
    <div
      className="relative aspect-video overflow-hidden rounded-[18px] bg-black border border-white/15"
      style={{ boxShadow: "0 30px 80px rgba(0,0,0,.5), 0 0 0 1px rgba(129,41,255,.15)" }}
    >
      {!mounted && (
        <>
          <img
            src={POSTER}
            srcSet={`${POSTER_SMALL} 640w, ${POSTER} 1280w`}
            sizes="(min-width: 1024px) 560px, calc(100vw - 48px)"
            width={1280}
            height={720}
            alt={t("leistungen.video.posterAlt")}
            decoding="async"
            // React 18 has no typed prop for it; the attribute passes through.
            {...({ fetchpriority: "high" } as Record<string, string>)}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(14,13,19,0) 55%, rgba(14,13,19,.7) 100%)" }}
          />
          <button
            type="button"
            onClick={start}
            aria-label={t("leistungen.video.playLabel")}
            className="absolute left-1/2 top-[60%] sm:top-[67%] z-10 -translate-x-1/2 -translate-y-1/2 inline-flex items-center gap-3 whitespace-nowrap rounded-full bg-[#8129ff] py-2 pl-3 pr-4 text-[15px] sm:py-3.5 sm:pl-[18px] sm:pr-[26px] sm:text-lg font-semibold text-white transition-transform hover:scale-[1.04] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-white"
            style={{ boxShadow: "0 0 0 8px rgba(129,41,255,.28), 0 12px 40px rgba(129,41,255,.5)" }}
          >
            <Play className="size-5 sm:size-[22px]" fill="currentColor" strokeWidth={0} aria-hidden />
            {t("leistungen.video.play")}
            <span className="hidden sm:inline border-l border-white/40 pl-3 text-[15px] font-medium opacity-85">
              {t("leistungen.video.duration")}
            </span>
          </button>
          <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-2 sm:bottom-3.5 sm:left-4" aria-hidden>
            {[
              { icon: Clock, label: t("leistungen.video.duration") },
              { icon: Volume2, label: t("leistungen.video.withSound") },
              { icon: Captions, label: t("leistungen.video.captions") },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-[#0e0d13]/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm sm:px-3 sm:text-[13.5px]"
              >
                <Icon className="size-3.5" aria-hidden />
                {label}
              </span>
            ))}
          </div>
        </>
      )}

      {(mounted || warm) && (
        <video
          ref={videoRef}
          controls
          playsInline
          preload={mounted ? "auto" : "metadata"}
          src={SRC}
          aria-label={t("leistungen.video.videoLabel")}
          aria-hidden={mounted ? undefined : true}
          tabIndex={mounted ? undefined : -1}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          className={`absolute inset-0 h-full w-full bg-black object-cover ${mounted ? "" : "invisible"}`}
        >
          <track kind="captions" srcLang="de" label={t("leistungen.video.trackLabel")} src={VTT} default />
        </video>
      )}

      {phase === "ended" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2.5 sm:gap-3.5 bg-[#0e0d13]/90 p-3 sm:p-5 text-center backdrop-blur-sm">
          <h3 className="font-semibold text-white text-lg sm:text-[clamp(1.3rem,2.4vw,2rem)]">
            {t("leistungen.video.endTitle")}
          </h3>
          <p className="hidden sm:block font-light text-white/65">{t("leistungen.video.endBody")}</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent(EVENTS.callLinkClicked, PLACEMENTS.videoEnd, CTAS.bookCall)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#8129ff] px-3.5 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base font-semibold text-white"
            >
              {t("leistungen.video.endBook")}
            </a>
            <button
              type="button"
              onClick={onQuizOpen}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base font-semibold text-white"
            >
              {t("leistungen.pulseCta")}
              <ArrowRight size={16} aria-hidden />
            </button>
          </div>
          <button
            type="button"
            onClick={replay}
            className="text-sm text-white/70 underline underline-offset-2 hover:text-white"
          >
            {t("leistungen.video.endReplay")}
          </button>
        </div>
      )}
    </div>
  );
}
