import { useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { Code2, Building2, Palette, Bot, ArrowUpRight } from "lucide-react";
import { services, type Service } from "@/data/services";

const iconMap: Record<Service["icon"], React.ReactNode> = {
  code: <Code2 size={40} strokeWidth={1.5} className="text-white/90" />,
  grid: <Building2 size={40} strokeWidth={1.5} className="text-white/90" />,
  palette: <Palette size={40} strokeWidth={1.5} className="text-white/90" />,
  bot: <Bot size={40} strokeWidth={1.5} className="text-white/90" />,
};

/* Extract the accent color from the gradient string so the radial spotlight
   can use the same hue as each card's directional gradient */
const cardAccentColors: Record<string, string> = {
  development: "163, 24, 248",
  "company-building": "255, 50, 50",
  webdesign: "43, 149, 246",
  "ki-strategie": "253, 167, 0",
};

function ServiceCard({ service, index }: { service: Service; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);

  const accent = cardAccentColors[service.slug] ?? "163, 24, 248";

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMouse({ x, y });
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-xl cursor-pointer"
      style={{ minHeight: "392px" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Static base gradient (always visible, low opacity) */}
      <div
        className="absolute inset-0 mix-blend-lighten opacity-60 transition-opacity duration-300"
        style={{ background: service.gradient }}
      />

      {/* Mouse-following radial spotlight */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(circle 400px at ${mouse.x}% ${mouse.y}%, rgba(${accent}, 0.55) 0%, rgba(${accent}, 0) 70%)`,
        }}
      />

      {/* Dark base */}
      <div className="absolute inset-0 bg-[#1c1a27]/75" />

      {/* Subtle border glow on hover */}
      <div
        className="absolute inset-0 rounded-xl transition-opacity duration-300 pointer-events-none"
        style={{
          opacity: hovered ? 1 : 0,
          boxShadow: `inset 0 0 0 1px rgba(${accent}, 0.3)`,
        }}
      />

      <div
        className="relative z-10 p-7 h-full flex flex-col gap-4 justify-between"
        style={{ minHeight: "392px" }}
      >
        <div className="flex flex-col gap-3">
          {iconMap[service.icon]}
          <h3
            className="font-['Sofia_Pro',sans-serif] font-semibold text-white leading-tight"
            style={{ fontSize: "var(--text-card)" }}
          >
            {service.title}
          </h3>
          <p
            className="text-white/80 font-['Sofia_Pro',sans-serif] font-light leading-snug"
            style={{ fontSize: "var(--text-body)" }}
          >
            {service.description}
          </p>
        </div>
        <div className="flex justify-end">
          <div
            className="w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-300"
            style={{
              borderColor: hovered ? `rgba(${accent}, 0.5)` : "rgba(255,255,255,0.2)",
              color: hovered ? `rgba(${accent}, 0.9)` : "rgba(255,255,255,0.5)",
            }}
          >
            <ArrowUpRight size={16} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Services() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="leistungen" className="bg-[#0e0d13] py-24" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-10 mb-16"
        >
          <h2
            className="font-['Sofia_Pro',sans-serif] font-semibold text-white leading-none"
            style={{ fontSize: "var(--text-hero)" }}
          >
            Unsere Leistungen
          </h2>
          <p
            className="text-[#c0c0c0] font-['Sofia_Pro',sans-serif] font-light leading-snug max-w-3xl"
            style={{ fontSize: "var(--text-h2)" }}
          >
            VentureLabs hilft Unternehmen, digitale Produkte schneller zu
            denken, zu planen und umzusetzen – mit einem Team aus
            Spezialist:innen für Design, Entwicklung und AI.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {services.map((service, i) => (
            <ServiceCard key={service.slug} service={service} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
