/**
 * Plausible custom events for the four funnel points of venturelabs.team.
 *
 * The loader tag and the queue stub are injected into the built HTML shell by
 * plausiblePlugin() in vite.config.ts (build only). In `pnpm dev` there is no
 * stub, so window.plausible is undefined and trackEvent() simply no-ops.
 *
 * The four values below are the Goal names Christian creates in the Plausible
 * UI (type "Custom event"). They are code constants, never translated — do not
 * move them into src/locales/*.json.
 */

declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props?: Record<string, string> }) => void;
  }
}

export const EVENTS = Object.freeze({
  quizStarted: "Quiz Started",
  quizCompleted: "Quiz Completed",
  contactSent: "Contact Sent",
  callLinkClicked: "Call Link Clicked",
} as const);

/**
 * One stable id per booking button, so Plausible can break "Call Link
 * Clicked" down by placement. See docs/analytics-events.md for the full
 * id → component → file:line table.
 */
export const PLACEMENTS = Object.freeze({
  navbarDesktop: "navbar-desktop",
  navbarMobile: "navbar-mobile",
  finalCta: "final-cta",
  footer: "footer",
  quizResult: "quiz-result",
  kontakt: "kontakt",
  leistungenDetailCta: "leistungen-detail-cta",
  leistungenDetailContact: "leistungen-detail-contact",
  situations: "situations",
  clusterStory: "cluster-story",
  toolProfile: "tool-profile",
  kontaktForm: "kontakt-form",
  kontaktTeamMail: "kontakt-team-mail",
  kontaktTeamPhone: "kontakt-team-phone",
  kontaktBottomMail: "kontakt-bottom-mail",
  footerJobsMail: "footer-jobs-mail",
  footerContactMail: "footer-contact-mail",
  leistungenDetailMail: "leistungen-detail-mail",
  leistungenMail: "leistungen-mail",
  impressumMail: "impressum-mail",
  datenschutzMail: "datenschutz-mail",
  heroContact: "hero-contact",
  pulseJourney: "pulse-journey",
  heroQuiz: "hero-quiz",
  aiPulseTeaser: "ai-pulse-teaser",
  leistungenHero: "leistungen-hero",
  leistungenPulseCallout: "leistungen-pulse-callout",
  leistungenDetailQuiz: "leistungen-detail-quiz",
  leistungenHeroContact: "leistungen-hero-contact",
  leistungenPulseCalloutContact: "leistungen-pulse-callout-contact",
  leistungenDetailHeroCta: "leistungen-detail-hero-cta",
  caseDetailCta: "case-detail-cta",
  caseDetailBottomCta: "case-detail-bottom-cta",
  blogDetailCta: "blog-detail-cta",
  ueberUnsCta: "ueber-uns-cta",
} as const);

/**
 * The five kinds of call-to-action Plausible can break any of the four
 * events down by, via the `cta` custom property. Frozen, code constants —
 * never translated, never extended without updating docs/analytics-events.md.
 */
export const CTAS = Object.freeze({
  bookCall: "book-call",
  contact: "contact",
  quiz: "quiz",
  mail: "mail",
  phone: "phone",
} as const);

/**
 * The route without its `/de`/`/en` prefix, e.g. "/leistungen/ai-automation"
 * for "/de/leistungen/ai-automation", or "/" for "/de". Optional-chained
 * because `window.location` can be absent (see scripts/check-analytics-extra.ts's
 * `window = {}` stub) — this must never throw.
 */
function currentPage(): string {
  const pathname = window.location?.pathname ?? "/";
  const rest = pathname.replace(/^\/(de|en)(?=\/|$)/, "");
  return rest === "" ? "/" : rest;
}

/** The locale segment of the current path, defaulting to "de" when absent. */
function currentLang(): "de" | "en" {
  const pathname = window.location?.pathname ?? "";
  const match = /^\/(de|en)(?:\/|$)/.exec(pathname);
  return match?.[1] === "en" ? "en" : "de";
}

/**
 * Fires a Plausible custom event with `page` and `lang` always attached, plus
 * `placement` and `cta` when the call site names them. Safe no-op when the
 * script is not loaded.
 */
export function trackEvent(name: string, placement?: string, cta?: string): void {
  const props: Record<string, string> = { page: currentPage(), lang: currentLang() };
  if (placement) props.placement = placement;
  if (cta) props.cta = cta;
  window.plausible?.(name, { props });
}
