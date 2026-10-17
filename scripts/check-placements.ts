/**
 * Shared by scripts/check-analytics.ts (criterion 15, run via `pnpm
 * check:analytics`) and scripts/prerender.ts (wired into `pnpm build` itself
 * — see assertPlacementIds() there), so there is exactly one definition of
 * "a booking CTA is missing its Plausible placement id" and the build fails
 * on it, not just a separately invoked check.
 *
 * 20261017-tracking-every-booking-contact-button-identifiab, Reviewer finding
 * 1 (round 3): the previous version only lived in check-analytics.ts, which
 * `pnpm build` never runs, so an unattributed CTA still shipped.
 *
 * Round 4, Reviewer finding 1: the previous version of the two checks below
 * missed two valid-JavaScript ways to end up with no real placement:
 *   - `trackEvent(EVENTS.callLinkClicked,)` / `trackEvent(link.track!,)` — a
 *     trailing comma with nothing after it is still only ONE argument in JS,
 *     but the old regex required the closing `)` to immediately follow the
 *     first argument, so it missed this form entirely.
 *   - Footer's config-row form: deleting `placement: PLACEMENTS.footer` from
 *     a `{ track: EVENTS.callLinkClicked, ... }` row leaves the call site
 *     `trackEvent(link.track!, link.placement)` syntactically untouched (two
 *     arguments are still there) — `link.placement` just evaluates to
 *     `undefined` at runtime. Neither regex, which only ever looked at the
 *     call site, could catch that; this needs to look at the config row
 *     itself.
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
 * The smallest `{ ... }` object literal that encloses `index`, or null when
 * `index` sits outside any object literal (or the braces are unbalanced).
 */
function enclosingObjectLiteral(src: string, index: number): string | null {
  let depth = 0;
  let start = -1;
  for (let i = index; i >= 0; i--) {
    const ch = src[i];
    if (ch === "}") depth++;
    else if (ch === "{") {
      if (depth === 0) {
        start = i;
        break;
      }
      depth--;
    }
  }
  if (start === -1) return null;

  depth = 0;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * True when `src` fires `EVENTS.callLinkClicked` without a real placement,
 * either:
 *   - directly: `trackEvent(EVENTS.callLinkClicked)` / `trackEvent(link.track!)`,
 *     with or without a trailing comma (`(x,)` is one argument in JS, not two) —
 *     no second argument at all; or
 *   - through a config row (Footer's `FooterLink` table): a `track:
 *     EVENTS.callLinkClicked` field whose enclosing object literal has no
 *     sibling `placement:` field, so the call site's second argument
 *     (`link.placement`) is `undefined` at runtime even though the call site
 *     itself looks fully attributed.
 */
function hasUnattributedCallLinkClicked(src: string): boolean {
  if (/trackEvent\(\s*EVENTS\.callLinkClicked\s*,?\s*\)/.test(src)) return true;
  if (/trackEvent\(\s*link\.track!?\s*,?\s*\)/.test(src)) return true;

  const trackFieldRegex = /\btrack:\s*EVENTS\.callLinkClicked\b/g;
  let match: RegExpExecArray | null;
  while ((match = trackFieldRegex.exec(src))) {
    const row = enclosingObjectLiteral(src, match.index);
    if (!row || !/\bplacement:/.test(row)) return true;
  }

  return false;
}

/**
 * Every file under `srcDir` that fires EVENTS.callLinkClicked (directly, or
 * through Footer's `link.track` table) without a real second (placement)
 * argument. Empty when every booking CTA is attributed.
 */
export function findMissingPlacementCallSites(srcDir: string): string[] {
  return findSourceFiles(srcDir).filter((f) => hasUnattributedCallLinkClicked(readFileSync(f, "utf-8")));
}
