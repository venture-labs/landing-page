import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { useSiteData } from "@/data/content";
import svgPaths from "@/imports/🖌Homepage/svg-oa0apfkpzr";

function LidlLogo() {
  return (
    <svg className="h-10 w-auto" fill="none" viewBox="0 0 210 84.2675">
      <path clipRule="evenodd" d={svgPaths.p15c4a200} fill="#C0C0C0" fillRule="evenodd" />
      <path clipRule="evenodd" d={svgPaths.p1f4e5480} fill="#C0C0C0" fillRule="evenodd" />
      <path clipRule="evenodd" d={svgPaths.p22e18f00} fill="#C0C0C0" fillRule="evenodd" />
      <path clipRule="evenodd" d={svgPaths.p81da440} fill="#C0C0C0" fillRule="evenodd" />
      <path clipRule="evenodd" d={svgPaths.p28e76280} fill="#C0C0C0" fillRule="evenodd" />
    </svg>
  );
}

function BmwLogo() {
  return (
    <svg className="h-8 w-auto" fill="none" viewBox="0 0 210 62.4113">
      <path clipRule="evenodd" d={svgPaths.pe3c6272} fill="#C0C0C0" fillRule="evenodd" />
      <path clipRule="evenodd" d={svgPaths.p241a6c00} fill="#C0C0C0" fillRule="evenodd" />
      <path d={svgPaths.p3b4cb00} fill="#C0C0C0" />
      <path d={svgPaths.p12042200} fill="#C0C0C0" />
      <path d={svgPaths.p391e1400} fill="#C0C0C0" />
    </svg>
  );
}

function HubergroupLogo() {
  return (
    <svg className="h-8 w-auto" fill="none" viewBox="0 0 210 33.7316">
      <g clipPath="url(#clip-huber)">
        <path d={svgPaths.p11a34500} fill="#C0C0C0" />
      </g>
      <defs>
        <clipPath id="clip-huber">
          <rect fill="white" height="33.7316" width="210" />
        </clipPath>
      </defs>
    </svg>
  );
}

function GerchLogo() {
  return (
    <svg className="h-10 w-auto" fill="none" viewBox="0 0 125.195 25.2561">
      <path clipRule="evenodd" d={svgPaths.p39390f00} fill="#C0C0C0" fillRule="evenodd" />
    </svg>
  );
}

function BrylliantLogoSmall() {
  return (
    <svg className="h-8 w-auto" fill="none" viewBox="0 0 210.03 39.7307">
      <path d={svgPaths.pd710280} fill="#C0C0C0" />
    </svg>
  );
}

const logos = [
  { id: "lidl", element: <LidlLogo /> },
  { id: "bmw", element: <BmwLogo /> },
  { id: "huber", element: <HubergroupLogo /> },
  { id: "gerch", element: <GerchLogo /> },
  { id: "brylliant", element: <BrylliantLogoSmall /> },
  { id: "lidl2", element: <LidlLogo /> },
  { id: "bmw2", element: <BmwLogo /> },
  { id: "huber2", element: <HubergroupLogo /> },
];

export function ClientLogos() {
  const siteData = useSiteData();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="bg-[#0e0d13] py-20 overflow-hidden" ref={ref}>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee 32s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 mb-12">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-white font-semibold"
          style={{ fontSize: "var(--text-hero)" }}
        >
          {siteData.clientLogosLabel}
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="overflow-hidden"
      >
        {/* Duplicate the list so the loop is seamless: renders 2× then translates -50% */}
        <div className="marquee-track flex gap-6 w-max">
          {[...logos, ...logos].map((logo, i) => (
            <div
              key={`${logo.id}-${i}`}
              className="shrink-0 bg-[#272530] w-[220px] h-[140px] flex items-center justify-center"
            >
              {logo.element}
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
