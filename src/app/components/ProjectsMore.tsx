import { useRef, useState } from "react";
import { Link } from "react-router";
import { motion, useInView } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { type GridCase } from "@/data/de/cases";
import { useCasesData } from "@/data/live";
import { useLocale } from "@/app/locale";
import { tinaField } from "tinacms/dist/react";

function GridCard({ c }: { c: GridCase }) {
  const { localizedPath } = useLocale();
  return (
    <Link
      to={localizedPath(`/cases/${c.slug}`)}
      className="flex flex-col gap-6 group cursor-pointer shrink-0 w-[360px] hover:opacity-90 transition-opacity"
    >
      <div className="overflow-hidden">
        <img
          src={c.image}
          alt={c.title}
          className="w-full h-[260px] object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col gap-2">
        <h3
          data-tina-field={tinaField(c, "title")}
          className=" font-semibold text-white leading-tight"
          style={{ fontSize: "calc(var(--text-card) * 0.75)", lineHeight: 1.1 }}
        >
          {c.title}
        </h3>
        <p
          data-tina-field={tinaField(c, "subtitle")}
          className="text-white/60 font-light leading-snug"
          style={{ fontSize: "var(--text-small)" }}
        >
          {c.subtitle}
        </p>
      </div>
    </Link>
  );
}

export function ProjectsMore() {
  const { gridCases } = useCasesData();
  const { t } = useTranslation();
  const ref = useRef(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [hovered, setHovered] = useState(false);

  function scrollBy(dir: "left" | "right") {
    scrollRef.current?.scrollBy({
      left: dir === "right" ? 400 : -400,
      behavior: "smooth",
    });
  }

  return (
    <section className="bg-[#272530] pb-24">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.h3
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className=" font-semibold text-white mb-12"
          style={{ fontSize: "var(--text-h2)" }}
        >
          {t("projects.moreHeading")}
        </motion.h3>
      </div>

      {/* Scroll container — full-width within the 1400px, no right padding so cards bleed */}
      <div
        className="relative max-w-[1400px] mx-auto"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Left arrow */}
        <motion.button
          aria-label={t("projects.scrollBack")}
          onClick={() => scrollBy("left")}
          initial={false}
          animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : -8 }}
          transition={{ duration: 0.2 }}
          className="absolute left-2 top-[130px] z-10 flex items-center justify-center w-12 h-12 rounded-full bg-[#0e0d13]/80 backdrop-blur-sm border border-white/10 text-white hover:bg-[#8129ff] transition-colors pointer-events-auto"
          style={{ pointerEvents: hovered ? "auto" : "none" }}
        >
          <ChevronLeft size={22} />
        </motion.button>

        {/* Right arrow */}
        <motion.button
          aria-label={t("projects.scrollForward")}
          onClick={() => scrollBy("right")}
          initial={false}
          animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : 8 }}
          transition={{ duration: 0.2 }}
          className="absolute right-2 top-[130px] z-10 flex items-center justify-center w-12 h-12 rounded-full bg-[#0e0d13]/80 backdrop-blur-sm border border-white/10 text-white hover:bg-[#8129ff] transition-colors"
          style={{ pointerEvents: hovered ? "auto" : "none" }}
        >
          <ChevronRight size={22} />
        </motion.button>

        {/* Horizontal scroll track */}
        <div
          ref={scrollRef}
          className="flex gap-8 overflow-x-auto px-6 lg:px-12 pb-4 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {gridCases.map((c) => (
            <GridCard key={c.slug} c={c} />
          ))}
        </div>
      </div>
    </section>
  );
}
