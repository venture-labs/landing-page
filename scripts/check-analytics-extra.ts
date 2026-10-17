/**
 * Mechanical assertions the build-output harness (scripts/check-analytics.ts)
 * cannot make, added because no Test Writer ran for this task.
 *
 *   pnpm exec tsx scripts/check-analytics-extra.ts
 *
 * Covers, without needing a build:
 *   - criterion 1  — plausiblePlugin() is apply:'build', so `pnpm dev` can
 *                    never inject the tag (the mechanism, not just the symptom)
 *   - criteria 2/5 — the CONTEXT gate itself: the transformIndexHtml hook
 *                    returns the two tags for unset/"production" and nothing
 *                    for "deploy-preview"/"branch-deploy"
 *   - criterion 6  — trackEvent() genuinely does not throw when
 *                    window.plausible is undefined, and forwards the name when
 *                    it is defined (the static harness only greps the source)
 *   - criterion 13 — dependencies/devDependencies byte-identical to `dev` and
 *                    only `scripts` gained check:analytics; no GA/GTM/consent
 *                    library anywhere in the tracked source. Comparing against
 *                    `git show dev:package.json` is not circular, so this is
 *                    mechanical after all rather than the spec's "manual".
 *   - criterion 16 — (20261017-tracking-every-booking-contact-button-identifiab)
 *                    trackEvent()'s exact `props` payload: page/lang derived
 *                    from a DE and an EN route, both home routes (page
 *                    collapses to "/"), a placement passed vs. omitted, and
 *                    window.location missing entirely (never throws, safe
 *                    defaults) — the static harness only greps for argument
 *                    presence, never the runtime values.
 *
 * Exits non-zero with a FAIL line per failed check.
 */
import { execFileSync } from "child_process";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { pathToFileURL } from "url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE_REF = process.env.BASE_REF ?? "dev";

let failed = 0;
const pass = (c: string, m: string) => console.log(`PASS  [${c}] ${m}`);
const fail = (c: string, m: string) => {
  failed++;
  console.error(`FAIL  [${c}] ${m}`);
};
const check = (c: string, ok: boolean, okMsg: string, failMsg: string) =>
  ok ? pass(c, okMsg) : fail(c, failMsg);

const git = (...args: string[]) =>
  execFileSync("git", args, { cwd: repoRoot, encoding: "utf-8", maxBuffer: 32 * 1024 * 1024 });

type InjectedTag = { tag: string; injectTo?: string; attrs?: Record<string, unknown>; children?: string };
type PluginLike = { name: string; apply?: string; transformIndexHtml?: () => InjectedTag[] };

/** The plausible plugin object, taken from the real vite.config.ts. */
async function loadPlausiblePlugin(): Promise<PluginLike | undefined> {
  // vite.config.ts uses the CJS `__dirname` for its `@` alias; Vite supplies it
  // when it loads the config, so provide it before importing the file as ESM.
  (globalThis as { __dirname?: string }).__dirname ??= repoRoot;
  const mod = await import(pathToFileURL(resolve(repoRoot, "vite.config.ts")).href);
  const config = typeof mod.default === "function" ? mod.default({ command: "build", mode: "production" }) : mod.default;
  const plugins: PluginLike[] = (await config).plugins.flat(Infinity);
  return plugins.find((p) => p && p.name === "plausible-analytics");
}

/** Runs the hook with process.env.CONTEXT set to `value` (undefined = unset). */
function withContext<T>(value: string | undefined, fn: () => T): T {
  const previous = process.env.CONTEXT;
  if (value === undefined) delete process.env.CONTEXT;
  else process.env.CONTEXT = value;
  try {
    return fn();
  } finally {
    if (previous === undefined) delete process.env.CONTEXT;
    else process.env.CONTEXT = previous;
  }
}

async function checkPluginGate(): Promise<void> {
  const plugin = await loadPlausiblePlugin();
  if (!plugin) {
    fail("1", "vite.config.ts registers no plugin named 'plausible-analytics'");
    return;
  }

  check(
    "1",
    plugin.apply === "build",
    "plausiblePlugin() is apply:'build' — the dev server can never inject the tag",
    `plausiblePlugin().apply is ${JSON.stringify(plugin.apply)}, expected 'build'`
  );

  const hook = plugin.transformIndexHtml;
  if (typeof hook !== "function") {
    fail("2", "plausiblePlugin() has no transformIndexHtml hook");
    return;
  }

  for (const context of [undefined, "production"] as const) {
    const tags = withContext(context, () => hook());
    const loader = tags.find((t) => typeof t.attrs?.src === "string");
    const stub = tags.find((t) => typeof t.children === "string");
    check(
      "2",
      tags.length === 2 &&
        loader?.injectTo === "head" &&
        loader?.attrs?.defer === true &&
        loader?.attrs?.["data-domain"] === "venturelabs.team" &&
        loader?.attrs?.src === "https://plausible.io/js/script.file-downloads.outbound-links.js" &&
        stub?.injectTo === "head" &&
        /window\.plausible\s*=\s*window\.plausible\s*\|\|/.test(stub?.children ?? "") &&
        /window\.plausible\.q\s*=\s*window\.plausible\.q\s*\|\|/.test(stub?.children ?? "") &&
        (stub?.children ?? "").includes("push(arguments)"),
      `CONTEXT=${context ?? "<unset>"} injects the loader tag + the queue stub into <head>`,
      `CONTEXT=${context ?? "<unset>"} injected ${JSON.stringify(tags)}`
    );
  }

  for (const context of ["deploy-preview", "branch-deploy"] as const) {
    const tags = withContext(context, () => hook());
    check(
      "5",
      Array.isArray(tags) && tags.length === 0,
      `CONTEXT=${context} injects nothing (the gate holds)`,
      `CONTEXT=${context} injected ${JSON.stringify(tags)} — expected []`
    );
  }
}

async function checkTrackEventRuntime(): Promise<void> {
  const globalWithWindow = globalThis as { window?: unknown };
  const hadWindow = "window" in globalWithWindow;
  const previousWindow = globalWithWindow.window;

  try {
    // No stub at all — exactly the `pnpm dev` situation.
    globalWithWindow.window = {};
    const { trackEvent, EVENTS } = await import(
      pathToFileURL(resolve(repoRoot, "src/app/analytics.ts")).href
    );

    let threw: unknown = null;
    try {
      trackEvent("X");
      for (const name of Object.values(EVENTS) as string[]) trackEvent(name);
    } catch (error) {
      threw = error;
    }
    check(
      "6",
      threw === null,
      "trackEvent() does not throw when window.plausible is undefined",
      `trackEvent() threw without the stub: ${String(threw)}`
    );

    check(
      "6",
      JSON.stringify(Object.values(EVENTS)) ===
        JSON.stringify(["Quiz Started", "Quiz Completed", "Contact Sent", "Call Link Clicked"]),
      "EVENTS values are exactly the four goal names, in funnel order",
      `EVENTS values are ${JSON.stringify(Object.values(EVENTS))}`
    );

    check(
      "6",
      Object.isFrozen(EVENTS),
      "EVENTS is frozen — a call site cannot rename a goal at runtime",
      "EVENTS is not frozen"
    );

    // Stub present — the name must reach it unchanged, exactly once per call.
    const seen: string[] = [];
    globalWithWindow.window = { plausible: (name: string) => seen.push(name) };
    trackEvent(EVENTS.quizStarted);
    trackEvent(EVENTS.callLinkClicked);
    check(
      "6",
      JSON.stringify(seen) === JSON.stringify(["Quiz Started", "Call Link Clicked"]),
      "trackEvent() forwards the goal name verbatim to window.plausible, once per call",
      `window.plausible received ${JSON.stringify(seen)}`
    );
  } finally {
    if (hadWindow) globalWithWindow.window = previousWindow;
    else delete globalWithWindow.window;
  }
}

/**
 * Criterion 16 (20261017-tracking-every-booking-contact-button-identifiab,
 * Reviewer finding 2) — the exact `props` payload trackEvent() attaches:
 * German and English routes, both home routes (page collapses to "/"),
 * missing window.location entirely, and calls with and without a placement.
 * checkTrackEventRuntime() above only ever asserted the event *name* reached
 * window.plausible — never the props object this task added.
 */
async function checkTrackEventProps(): Promise<void> {
  const globalWithWindow = globalThis as { window?: any };
  const hadWindow = "window" in globalWithWindow;
  const previousWindow = globalWithWindow.window;

  type Call = [string, { props?: Record<string, string> }?];

  try {
    const { trackEvent, EVENTS, PLACEMENTS } = await import(
      pathToFileURL(resolve(repoRoot, "src/app/analytics.ts")).href
    );

    let calls: Call[] = [];
    globalWithWindow.window = {
      location: { pathname: "/de/leistungen/ai-automation" },
      plausible: (...args: Call) => calls.push(args),
    };

    calls = [];
    trackEvent(EVENTS.callLinkClicked, PLACEMENTS.footer);
    check(
      "16",
      JSON.stringify(calls) ===
        JSON.stringify([
          [
            "Call Link Clicked",
            { props: { page: "/leistungen/ai-automation", lang: "de", placement: "footer" } },
          ],
        ]),
      "DE route, with placement: trackEvent() attaches page/lang/placement exactly",
      `got ${JSON.stringify(calls)}`
    );

    globalWithWindow.window.location.pathname = "/en/kontakt";
    calls = [];
    trackEvent(EVENTS.contactSent);
    check(
      "16",
      JSON.stringify(calls) ===
        JSON.stringify([["Contact Sent", { props: { page: "/kontakt", lang: "en" } }]]),
      "EN route, no placement: trackEvent() attaches page/lang only, no placement key",
      `got ${JSON.stringify(calls)}`
    );

    for (const home of ["/de", "/en"] as const) {
      globalWithWindow.window.location.pathname = home;
      calls = [];
      trackEvent(EVENTS.quizStarted);
      const expectedLang = home === "/en" ? "en" : "de";
      check(
        "16",
        JSON.stringify(calls) ===
          JSON.stringify([["Quiz Started", { props: { page: "/", lang: expectedLang } }]]),
        `home route ${home}: page collapses to "/"`,
        `got ${JSON.stringify(calls)}`
      );
    }

    // No window.location at all (not just an absent pathname) — must default
    // safely to page "/", lang "de", and never throw.
    calls = [];
    globalWithWindow.window = { plausible: (...args: Call) => calls.push(args) };
    let threw: unknown = null;
    try {
      trackEvent(EVENTS.callLinkClicked, PLACEMENTS.navbarDesktop);
    } catch (error) {
      threw = error;
    }
    check(
      "16",
      threw === null &&
        JSON.stringify(calls) ===
          JSON.stringify([
            ["Call Link Clicked", { props: { page: "/", lang: "de", placement: "navbar-desktop" } }],
          ]),
      'missing window.location: defaults to page "/", lang "de", never throws',
      `threw=${String(threw)} calls=${JSON.stringify(calls)}`
    );
  } finally {
    if (hadWindow) globalWithWindow.window = previousWindow;
    else delete globalWithWindow.window;
  }
}

function checkNoNewDependencies(): void {
  let basePackageJson: string;
  try {
    basePackageJson = git("show", `${BASE_REF}:package.json`);
  } catch {
    fail("13", `cannot read package.json from '${BASE_REF}' — set BASE_REF to the base branch`);
    return;
  }

  const base = JSON.parse(basePackageJson);
  const head = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf-8"));
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

  check(
    "13",
    same(base.dependencies, head.dependencies),
    `dependencies are byte-identical to ${BASE_REF}`,
    `dependencies differ from ${BASE_REF}`
  );
  check(
    "13",
    same(base.devDependencies, head.devDependencies),
    `devDependencies are byte-identical to ${BASE_REF} (Playwright stayed out of the repo)`,
    `devDependencies differ from ${BASE_REF}`
  );

  const addedScripts = Object.keys(head.scripts ?? {}).filter((k) => !(k in (base.scripts ?? {})));
  const changedScripts = Object.keys(base.scripts ?? {}).filter(
    (k) => base.scripts[k] !== head.scripts?.[k]
  );
  check(
    "13",
    same(addedScripts, ["check:analytics"]) && changedScripts.length === 0,
    "scripts gained only check:analytics; no existing script was changed",
    `scripts added ${JSON.stringify(addedScripts)} and changed ${JSON.stringify(changedScripts)}`
  );

  const otherKeys = [...new Set([...Object.keys(base), ...Object.keys(head)])].filter(
    (k) => k !== "scripts"
  );
  const differing = otherKeys.filter((k) => !same(base[k], head[k]));
  check(
    "13",
    differing.length === 0,
    "no other package.json key changed",
    `package.json keys changed besides scripts: ${differing.join(", ")}`
  );
}

function checkNoTrackerLibraries(): void {
  const pattern =
    "gtag|googletagmanager|google-analytics|cookiebot|usercentrics|klaro|cookieconsent|consent-manager|matomo|hotjar|connect\\.facebook\\.net";
  let hits = "";
  try {
    hits = git(
      "grep",
      "-nIiE",
      pattern,
      "--",
      ".",
      ":!pnpm-lock.yaml",
      ":!docs/specs",
      ":!scripts/check-analytics-extra.ts"
    );
  } catch {
    hits = ""; // git grep exits 1 when nothing matched
  }
  check(
    "13",
    hits.trim() === "",
    "no GA / GTM / consent-banner library anywhere in the tracked source",
    `tracker or consent library found:\n${hits.trim()}`
  );
}

async function main(): Promise<void> {
  console.log(`check-analytics-extra: gate, runtime and dependency checks (base ${BASE_REF})\n`);

  await checkPluginGate();
  await checkTrackEventRuntime();
  await checkTrackEventProps();
  checkNoNewDependencies();
  checkNoTrackerLibraries();

  console.log("");
  if (failed > 0) {
    console.error(`check-analytics-extra: ${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("check-analytics-extra: all checks passed");
}

void main();
