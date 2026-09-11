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
    plausible?: (eventName: string) => void;
  }
}

export const EVENTS = Object.freeze({
  quizStarted: "Quiz Started",
  quizCompleted: "Quiz Completed",
  contactSent: "Contact Sent",
  callLinkClicked: "Call Link Clicked",
} as const);

/** Fires a Plausible custom event. Safe no-op when the script is not loaded. */
export function trackEvent(name: string): void {
  window.plausible?.(name);
}
