import { useRef, useState, useCallback } from "react";
import { motion, useInView } from "motion/react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { featuredCases, type FeaturedCase } from "@/data/cases";
import svgPaths from "@/imports/🖌Homepage/svg-oa0apfkpzr";

function CheckIcon() {
  return (
    <svg
      width="19"
      height="20"
      viewBox="0 0 19.13 20.0052"
      fill="none"
      className="shrink-0 mt-0.5"
    >
      <path
        d={svgPaths.p41039c0}
        stroke="#FAFAFA"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.59"
      />
      <path
        d={svgPaths.p5d74292}
        stroke="#FAFAFA"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.59"
      />
    </svg>
  );
}

/** Big circle cursor bubble that follows the mouse over each case image */
function CaseCursorBubble({
  visible,
  x,
  y,
}: {
  visible: boolean;
  x: number;
  y: number;
}) {
  return (
    <motion.div
      className="pointer-events-none fixed z-50 flex items-center justify-center rounded-full bg-[#8129ff] text-white"
      style={{
        width: 96,
        height: 96,
        top: y,
        left: x,
        translateX: "-50%",
        translateY: "-50%",
      }}
      animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.5 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <ArrowUpRight size={32} strokeWidth={2} />
    </motion.div>
  );
}

function CaseCard({ c, index }: { c: FeaturedCase; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const isLeft = c.imagePosition === "left";

  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
  }, []);

  return (
    <>
      <CaseCursorBubble visible={cursorVisible} x={cursorPos.x} y={cursorPos.y} />

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className={`flex flex-col ${isLeft ? "lg:flex-row-reverse" : "lg:flex-row"} gap-12 lg:gap-16 items-center`}
      >
        {/* Image with custom cursor */}
        <div
          className="flex-1 lg:max-w-[45%] cursor-none"
          onMouseEnter={() => setCursorVisible(true)}
          onMouseLeave={() => setCursorVisible(false)}
          onMouseMove={handleMouseMove}
        >
          <div className="overflow-hidden rounded-xl">
            <img
              src={c.image}
              alt={c.title}
              className="w-full h-[400px] lg:h-[480px] object-cover transition-transform duration-500 hover:scale-[1.02]"
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-8 justify-center">
          <div className="flex flex-col gap-4">
            <h3
              className="font-['Sofia_Pro',sans-serif] font-light text-white leading-tight"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
            >
              {c.title}
            </h3>
            <p
              className="text-[#a1a1a1] font-['Sofia_Pro',sans-serif] font-light leading-relaxed"
              style={{ fontSize: "var(--text-body)" }}
            >
              {c.subtitle}
            </p>
          </div>

          <ul className="flex flex-col gap-3">
            {c.stats.map((stat) => (
              <li key={stat} className="flex items-start gap-3">
                <CheckIcon />
                <span
                  className="text-white/90 font-['Sofia_Pro',sans-serif] font-light leading-snug"
                  style={{ fontSize: "var(--text-body)" }}
                >
                  {stat}
                </span>
              </li>
            ))}
          </ul>

          <button className="self-start flex items-center gap-2 bg-white/4 hover:bg-white/8 border border-white/12 text-white text-sm px-5 py-2.5 rounded-lg transition-all font-['Sofia_Pro',sans-serif]">
            Zum Projekt
            <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>
    </>
  );
}

export function ProjectsFeatured() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="projekte" className="bg-[#272530] py-24" ref={ref}>
      <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-6 mb-20"
        >
          <h2
            className="font-['Sofia_Pro',sans-serif] font-semibold text-white leading-none"
            style={{ fontSize: "var(--text-hero)" }}
          >
            Projekte
          </h2>
          <p
            className="text-[#c0c0c0] font-['Sofia_Pro',sans-serif] font-light leading-snug max-w-3xl"
            style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.75rem)" }}
          >
            Unsere Projekte ziehen sich durch alle Branchen.{" "}
            <br className="hidden lg:block" />
            Zu unseren Kunden zählen Start-ups wie Großkonzerne. Und besonders
            spannend wird&#39;s, wenn wir unsere eigenen Kunden sind.
          </p>
        </motion.div>

        <div className="flex flex-col gap-24">
          {featuredCases.map((c, i) => (
            <CaseCard key={c.slug} c={c} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
