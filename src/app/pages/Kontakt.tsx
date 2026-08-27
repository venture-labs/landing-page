import { useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";

/* ─── data ───────────────────────────────────────────────────────────── */

const topicCategories = [
  { slug: "development", accent: "#a318f8" },
  { slug: "company-building", accent: "#ef4444" },
  { slug: "webdesign", accent: "#2b95f6" },
  { slug: "ki-strategie", accent: "#fda700" },
] as const;

const teamContacts = [
  {
    name: "Christian Wenzel",
    roleKey: "christianRole",
    initials: "CW",
    color: "#8129ff",
    email: "christian.wenzel@venturelabs.team",
    phone: "+49 156778 387064",
  },
  {
    name: "Martin Henrich",
    roleKey: "martinRole",
    initials: "MH",
    color: "#2b95f6",
    email: "martin.henrich@venturelabs.team",
  },
];

/* ─── topic picker ───────────────────────────────────────────────────── */

function TopicPicker({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (chip: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      {topicCategories.map((cat) => {
        const label = t(`kontakt.topics.${cat.slug}.label`);
        const chips = t(`kontakt.topics.${cat.slug}.chips`, { returnObjects: true }) as string[];
        return (
          <div
            key={cat.slug}
            className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 bg-white/[0.03] border border-white/8 rounded-xl p-6"
          >
            <span
              className="font-['sofia-pro',sans-serif] font-semibold text-white/40 shrink-0 w-full sm:w-40"
              style={{ fontSize: "var(--text-small)" }}
            >
              {label}
            </span>
            <div className="flex flex-wrap gap-3">
              {chips.map((chip) => {
                const active = selected.includes(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => onToggle(chip)}
                    className="font-['sofia-pro',sans-serif] font-light rounded-full px-4 py-2 border transition-all"
                    style={{
                      fontSize: "var(--text-small)",
                      backgroundColor: active ? `${cat.accent}22` : "transparent",
                      borderColor: active ? cat.accent : "rgba(255,255,255,0.12)",
                      color: active ? cat.accent : "rgba(255,255,255,0.6)",
                    }}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── direct contact sidebar ────────────────────────────────────────── */

function DirectContact() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-8">
      <h3
        className="font-['sofia-pro',sans-serif] font-semibold text-white"
        style={{ fontSize: "var(--text-card)" }}
      >
        {t("kontakt.directContact")}
      </h3>
      <div className="flex flex-col gap-6">
        {teamContacts.map((person) => (
          <div key={person.name} className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-['sofia-pro',sans-serif] font-semibold text-white"
              style={{ backgroundColor: person.color, fontSize: "var(--text-small)" }}
            >
              {person.initials}
            </div>
            <div className="flex flex-col gap-1">
              <p
                className="font-['sofia-pro',sans-serif] font-semibold text-white"
                style={{ fontSize: "var(--text-small)" }}
              >
                {person.name}
              </p>
              <p
                className="text-white/50 font-['sofia-pro',sans-serif] font-light"
                style={{ fontSize: "var(--text-small)" }}
              >
                {t(`kontakt.team.${person.roleKey}`)}
              </p>
              <a
                href={`mailto:${person.email}`}
                className="text-[#a318f8] hover:text-white font-['sofia-pro',sans-serif] font-light transition-colors"
                style={{ fontSize: "var(--text-small)" }}
              >
                {person.email}
              </a>
              {person.phone && (
                <a
                  href={`tel:${person.phone.replace(/\s+/g, "")}`}
                  className="text-white/50 hover:text-white font-['sofia-pro',sans-serif] font-light transition-colors"
                  style={{ fontSize: "var(--text-small)" }}
                >
                  {person.phone}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── form ───────────────────────────────────────────────────────────── */

const fieldClasses =
  "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 font-['sofia-pro',sans-serif] font-light outline-none transition-colors focus:border-[#8129ff]";

function ContactForm({ selectedTopics }: { selectedTopics: string[] }) {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const bodyLines = [
      selectedTopics.length > 0 ? `Themen: ${selectedTopics.join(", ")}` : null,
      "",
      message,
      "",
      `Name: ${name}`,
      company ? `Unternehmen: ${company}` : null,
      role ? `Rolle: ${role}` : null,
      `E-Mail: ${email}`,
      phone ? `Telefon: ${phone}` : null,
    ].filter((line): line is string => line !== null);

    const subject = encodeURIComponent(`Kontaktanfrage von ${name || "der Website"}`);
    const body = encodeURIComponent(bodyLines.join("\n"));
    window.location.href = `mailto:contact@venturelabs.team?subject=${subject}&body=${body}`;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <h3
          className="font-['sofia-pro',sans-serif] font-semibold text-white"
          style={{ fontSize: "var(--text-card)" }}
        >
          {t("kontakt.formHeading")}
        </h3>
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("kontakt.messagePlaceholder")}
          rows={6}
          className={fieldClasses}
        />
      </div>

      <div className="flex flex-col gap-4">
        <h3
          className="font-['sofia-pro',sans-serif] font-semibold text-white"
          style={{ fontSize: "var(--text-card)" }}
        >
          {t("kontakt.dataHeading")}
        </h3>
        <input
          required
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("kontakt.namePlaceholder")}
          className={fieldClasses}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder={t("kontakt.companyPlaceholder")}
            className={fieldClasses}
          />
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder={t("kontakt.rolePlaceholder")}
            className={fieldClasses}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3
          className="font-['sofia-pro',sans-serif] font-semibold text-white"
          style={{ fontSize: "var(--text-card)" }}
        >
          {t("kontakt.contactHeading")}
        </h3>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("kontakt.emailPlaceholder")}
          className={fieldClasses}
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t("kontakt.phonePlaceholder")}
          className={fieldClasses}
        />
      </div>

      <div className="flex flex-col gap-4">
        <h4
          className="font-['sofia-pro',sans-serif] font-semibold text-white"
          style={{ fontSize: "var(--text-small)" }}
        >
          {t("kontakt.privacyHeading")}
        </h4>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            required
            type="checkbox"
            className="mt-1 w-4 h-4 shrink-0 accent-[#8129ff]"
          />
          <span
            className="text-white/50 font-['sofia-pro',sans-serif] font-light leading-relaxed"
            style={{ fontSize: "var(--text-small)" }}
          >
            {t("kontakt.privacyText")}{" "}
            <a href="#" className="text-white/70 underline hover:text-white transition-colors">
              {t("kontakt.privacyLinkLabel")}
            </a>
            .
          </span>
        </label>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          className="w-full bg-[#8129ff] hover:bg-[#a318f8] text-white font-['sofia-pro',sans-serif] font-semibold rounded-lg px-6 py-4 transition-all hover:scale-[1.01]"
          style={{ fontSize: "var(--text-body)" }}
        >
          {t("kontakt.submit")}
        </button>
        <p
          className="text-white/30 font-['sofia-pro',sans-serif] font-light"
          style={{ fontSize: "var(--text-small)" }}
        >
          {t("kontakt.submitHint")}
        </p>
      </div>
    </form>
  );
}

/* ─── hero / topics section ─────────────────────────────────────────── */

function KontaktHero({
  selectedTopics,
  onToggleTopic,
}: {
  selectedTopics: string[];
  onToggleTopic: (chip: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <section className="relative pt-40 pb-24 bg-[#1E1C27] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-[-150px] w-[700px] h-[700px] rounded-full bg-[#8129ff]/10 blur-[140px]" />
      </div>
      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col gap-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-6 max-w-2xl"
        >
          <h1
            className="font-['sofia-pro',sans-serif] font-semibold text-white leading-[1.05]"
            style={{ fontSize: "var(--text-hero)" }}
          >
            {t("kontakt.heroTitle")}
          </h1>
          <p
            className="text-white/60 font-['sofia-pro',sans-serif] font-light leading-relaxed"
            style={{ fontSize: "var(--text-body)" }}
          >
            {t("kontakt.heroSubtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <TopicPicker selected={selectedTopics} onToggle={onToggleTopic} />
        </motion.div>
      </div>
    </section>
  );
}

/* ─── form section ───────────────────────────────────────────────────── */

function FormSection({ selectedTopics }: { selectedTopics: string[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="bg-[#0e0d13] py-24" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-3 gap-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="lg:col-span-2"
        >
          <ContactForm selectedTopics={selectedTopics} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <DirectContact />
        </motion.div>
      </div>
    </section>
  );
}

/* ─── cta strip ──────────────────────────────────────────────────────── */

function CtaStrip() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { t } = useTranslation();

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="bg-[#1c1a27] py-20"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <p
          className="text-white/50 font-['sofia-pro',sans-serif] font-light max-w-xl"
          style={{ fontSize: "var(--text-body)" }}
        >
          {t("kontakt.ctaQuestion")}
        </p>
        <div className="flex flex-col gap-3">
          <a
            href="tel:+491487418f6"
            className="font-['sofia-pro',sans-serif] font-semibold text-[#8129ff] hover:text-[#a318f8] transition-colors"
            style={{ fontSize: "clamp(1.2rem, 2vw, 1.75rem)" }}
          >
            +49 148 74 18 f6
          </a>
          <a
            href="mailto:contact@venturelabs.team"
            className="font-['sofia-pro',sans-serif] font-semibold text-[#8129ff] hover:text-[#a318f8] transition-colors"
            style={{ fontSize: "clamp(1.2rem, 2vw, 1.75rem)" }}
          >
            contact@venturelabs.team
          </a>
        </div>
      </div>
    </motion.section>
  );
}

/* ─── page ───────────────────────────────────────────────────────────── */

export function Kontakt() {
  const glowRef = useRef<HTMLDivElement>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  function toggleTopic(chip: string) {
    setSelectedTopics((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  }

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
      <KontaktHero selectedTopics={selectedTopics} onToggleTopic={toggleTopic} />
      <FormSection selectedTopics={selectedTopics} />
      <CtaStrip />
      <Footer />
    </div>
  );
}
