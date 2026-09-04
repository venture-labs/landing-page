import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, Play, Pause } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSiteData } from "@/data/content";
import { useLocale } from "@/app/locale";
import svgPaths from "@/imports/🖌Homepage/svg-oa0apfkpzr";
import heroVideo from "@/assets/venturelabs reel.mp4";

function BackgroundBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[-200px] left-[-300px] w-[800px] h-[800px] rounded-full bg-[#8129ff]/10 blur-[120px]" />
      <div className="absolute top-[200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-[#a318f8]/8 blur-[100px]" />
    </div>
  );
}

function HeroHeadline({
  headline,
  highlight,
}: {
  headline: string;
  highlight: string;
}) {
  const parts = headline.split(highlight);
  return (
    <h1
      className="font-semibold text-white leading-[1.05] tracking-tight w-full"
      style={{ fontSize: "var(--text-hero)" }}
    >
      {parts[0]}
      <span className="relative inline-block">
        <span className="relative z-10 text-white">{highlight}</span>
        <svg
          className="absolute -bottom-2 left-0 w-full"
          viewBox="0 0 400 16"
          fill="none"
          preserveAspectRatio="none"
          style={{ height: "10px" }}
        >
          <path
            d={svgPaths.p333f0a80}
            stroke="#A318F8"
            strokeLinecap="round"
            strokeWidth="8"
          />
        </svg>
      </span>
      {parts[1]}
    </h1>
  );
}

export function Hero() {
  const siteData = useSiteData();
  const { t } = useTranslation();
  const { localizedPath } = useLocale();
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  const [maxScale, setMaxScale] = useState(1);

  useEffect(() => {
    const updateMaxScale = () => {
      if (!videoContainerRef.current) return;
      const containerWidth = videoContainerRef.current.offsetWidth;
      if (containerWidth > 0) {
        setMaxScale(window.innerWidth / containerWidth);
      }
    };

    updateMaxScale();
    window.addEventListener("resize", updateMaxScale);
    return () => window.removeEventListener("resize", updateMaxScale);
  }, []);

  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, 600], [1, maxScale], {
    clamp: true,
  });

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <section className="relative min-h-screen flex items-start pt-28 overflow-hidden bg-[#1E1C27]">
      <BackgroundBlobs />

      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Outer max-width wrapper — nothing grows beyond 1400px */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto pb-20">
        {/* Text content with comfortable side padding */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-8 px-6 lg:px-12"
        >
          <HeroHeadline
            headline={siteData.heroHeadline}
            highlight={t("hero.headlineHighlight")}
          />

          <p
            className="text-white/60 font-light leading-relaxed max-w-2xl"
            style={{ fontSize: "var(--text-body)" }}
          >
            {siteData.heroSubline}
          </p>

          <div className="flex flex-wrap gap-4">
            <a
              href={localizedPath("/#kontakt")}
              className="inline-flex items-center gap-2 bg-[#8129ff] hover:bg-[#9140ff] text-white font-semibold rounded-lg transition-all hover:scale-[1.02] px-[24px] py-[11px]"
              style={{ fontSize: "var(--text-body)" }}
            >
              {siteData.heroCta}
              <ArrowRight size={16} />
            </a>
            <a
              href={localizedPath("/cases")}
              className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/12 text-white font-medium px-6 py-3.5 rounded-lg transition-all"
              style={{ fontSize: "var(--text-body)" }}
            >
              {siteData.heroCtaSecondary}
            </a>
          </div>
        </motion.div>

        {/* Video block — minimal side padding so it's the widest visible element */}
        <motion.div
          ref={videoContainerRef}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ scale, maxWidth: "calc(100% - 3rem)" }}
          className="mt-10 relative w-full overflow-hidden bg-black mx-auto"
        >
          <video
            ref={videoRef}
            src={heroVideo}
            className="w-full object-cover"
            style={{ minHeight: "480px", maxHeight: "640px" }}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
          <button
            aria-label={isPlaying ? t("hero.videoPause") : t("hero.videoPlay")}
            onClick={togglePlay}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex md:hidden items-center justify-center w-20 h-20 rounded-full bg-white/50 hover:bg-white/70 transition-colors backdrop-blur-sm"
          >
            {isPlaying ? (
              <Pause size={28} fill="white" className="ml-0 text-white" />
            ) : (
              <Play size={28} fill="white" className="ml-1 text-white" />
            )}
          </button>
        </motion.div>
      </div>
    </section>
  );
}