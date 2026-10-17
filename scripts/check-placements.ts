/**
 * Shared by scripts/check-analytics.ts (criterion 15, run via `pnpm
 * check:analytics`) and scripts/prerender.ts (wired into `pnpm build` itself
 * — see assertPlacementIds() there), so there is exactly one definition of
 * "a booking CTA is missing its Plausible placement id" and the build fails
 * on it, not just a separately invoked check.
 *
 * 20261017-tracking-every-booking-contact-button-identifiab, Reviewer finding
 * 1: the previous version only lived in check-analytics.ts, which `pnpm
 * build` never runs, so an unattributed CTA still shipped.
 */
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const CODE_EXTENSIONS = /\.(ts|tsx)$/;

/** Every .ts/.tsx file under `dir`, recursively. */
function findSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...findSourceFiles(full));
    else if (CODE_EXTENSIONS.test(entry)) out.push(full);
  }
  return out;
}

/**
 * Every file under `srcDir` that fires EVENTS.callLinkClicked (directly, or
 * through Footer's `link.track` table) without a second (placement)
 * argument. Empty when every booking CTA is attributed.
 */
export function findMissingPlacementCallSites(srcDir: string): string[] {
  return findSourceFiles(srcDir).filter((f) => {
    const src = readFileSync(f, "utf-8");
    return (
      /trackEvent\(\s*EVENTS\.callLinkClicked\s*\)/.test(src) ||
      /trackEvent\(\s*link\.track!?\s*\)/.test(src)
    );
  });
}
