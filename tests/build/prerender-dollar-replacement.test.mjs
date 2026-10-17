/**
 * 20261017-seo-the-full-page-content-is-in-the-html-before-
 *
 * Reviewer finding 1 (fix round): scripts/prerender.ts's renderHtml() used to
 * inject the server-rendered body with
 *   shell.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)
 * — String.replace's STRING replacement form treats "$$", "$&", "$1", "$`",
 * "$'" as special patterns, so rendered editorial copy that happens to
 * contain a literal dollar sequence (e.g. a price like "$$ 1.000") would be
 * silently collapsed ("$$" -> "$") in the written HTML, serving different
 * copy to a crawler than what React actually rendered. The fix passes a
 * replacement CALLBACK instead, whose return value is always inserted
 * verbatim. This test proves the real renderHtml() export (not a re-typed
 * copy of its logic) is immune to every one of String.replace's special
 * replacement patterns.
 *
 * Imports scripts/prerender.ts directly (through tsx, which this repo's own
 * build already depends on) rather than re-implementing the replacement
 * logic, because the point is to test the actual shipped code path.
 * scripts/prerender.ts guards its own main() invocation behind an
 * "is this the entry point" check specifically so this import does not
 * re-run the whole build.
 *
 * Run (needs the tsx loader, unlike the dependency-free tests/build/*.mjs
 * files that only read text — scripts/prerender.ts is TypeScript):
 *   pnpm exec tsx --test tests/build/prerender-dollar-replacement.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";
import { renderHtml } from "../../scripts/prerender.ts";

const SHELL = `<!DOCTYPE html>
<html lang="de">
  <head>
    <title>Old title</title>
    <meta name="description" content="Old description" />
    <meta property="og:locale" content="de_DE" />
    <meta property="og:title" content="Old og title" />
    <meta property="og:description" content="Old og description" />
  </head>
  <body>
    <form name="contact" data-netlify="true" hidden></form>
    <div id="root"></div>
  </body>
</html>`;

const PAGE = {
  path: "/de/leistungen",
  lang: "de",
  title: "New title",
  description: "New description",
};

/**
 * Every literal sequence String.replace's STRING replacement form treats
 * specially: "$$" -> "$", "$&" -> the whole match, "$`"/"$'" -> text
 * before/after the match, "$1" -> a capture group (none exist here, so it
 * would be dropped). A naive `.replace(pattern, stringWithBodyHtml)` call
 * mangles every one of these the same way the booking CTA/editorial price
 * example in the finding does.
 */
const DOLLAR_BODY = '<p>Price: $$ 1.000, match $&, before $`, after $\', group $1.</p>';

test("renderHtml() injects a literal $$/$&/$`/$'/$1 body verbatim, unmangled", () => {
  const html = renderHtml(SHELL, PAGE, [], DOLLAR_BODY);
  assert.ok(
    html.includes(`<div id="root">${DOLLAR_BODY}</div>`),
    `expected the exact dollar-sequence body inside #root, got:\n${html}`
  );
});

test("renderHtml() leaves the rest of the shell (forms, other head tags) untouched by the dollar body", () => {
  const html = renderHtml(SHELL, PAGE, [], DOLLAR_BODY);
  assert.ok(html.includes('<form name="contact" data-netlify="true" hidden></form>'));
  assert.ok(html.includes("<title>New title</title>"));
});
