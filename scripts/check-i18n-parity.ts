/**
 * check-i18n-parity.ts - the build's gate for "every page in German AND English,
 * every video with captions in both languages".
 *
 * Runs after check-meta in `pnpm build` and as `pnpm check:i18n`. Dependency-free
 * (fs + path). Reads content/, src/locales/, src/app/ and public/video/ plus the
 * finished dist/. Fails the build (exit 1, one `FAIL` line each) when:
 *   - a route exists under /de but not under /en, or the reverse,
 *   - a content/**\/x.md has no x.en.md (or the reverse),
 *   - a UI string key of src/locales/de.json is missing in en.json (or the reverse),
 *   - an English page shows German running text (stop-word heuristic over the
 *     prerendered body; the German pages are exempt: English claims there are the
 *     brand layer, a decided rule),
 *   - a video file in public/video/ lacks <name>.de.vtt or <name>.en.vtt, or a
 *     VTT has no matching video, or the two VTTs have a different cue count,
 *   - a component renders a <video> without `muted` and without <track> elements.
 * hreflang, canonical and sitemap pairs are check-meta.ts's job.
 *
 *   pnpm build && pnpm check:i18n
 *
 * Exit codes: 0 = ok, 1 = at least one failure, 2 = dist/ missing.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { dirname, join, relative, resolve, sep } from "path";
import { fileURLToPath } from "url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures: string[] = [];
const fail = (m: string) => failures.push(m);

function walk(dir: string, accept: (f: string) => boolean, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, accept, out);
    else if (accept(p)) out.push(p);
  }
  return out;
}
const rel = (p: string) => relative(repoRoot, p).split(sep).join("/");

// 1. Routes
const dist = join(repoRoot, "dist");
if (!existsSync(dist)) {
  console.error("check-i18n-parity: dist/ missing, run `pnpm build` first");
  process.exit(2);
}
const routes = new Set<string>();
for (const lang of ["de", "en"]) {
  for (const f of walk(join(dist, lang), (f) => f.endsWith("index.html"))) {
    routes.add(`${lang}:/${rel(dirname(f)).replace(new RegExp(`^dist/${lang}/?`), "")}`);
  }
}
for (const r of routes) {
  const [lang, path] = r.split(":");
  const other = `${lang === "de" ? "en" : "de"}:${path}`;
  if (!routes.has(other)) fail(`route ${r} has no ${other}`);
}

// 2. Content files
const contentDir = join(repoRoot, "content");
const md = new Set(walk(contentDir, (f) => f.endsWith(".md")).map(rel));
for (const f of md) {
  const isEn = f.endsWith(".en.md");
  const partner = isEn ? f.replace(/\.en\.md$/, ".md") : f.replace(/\.md$/, ".en.md");
  if (!md.has(partner)) fail(`${f} has no partner ${partner}`);
}

// 3. UI strings
type Json = { [k: string]: Json | string | number | boolean | null | Json[] };
function flat(o: Json, p = "", out: string[] = []): string[] {
  for (const [k, v] of Object.entries(o)) {
    if (v && typeof v === "object" && !Array.isArray(v)) flat(v as Json, `${p}${k}.`, out);
    else out.push(p + k);
  }
  return out;
}
const de = new Set(flat(JSON.parse(readFileSync(join(repoRoot, "src/locales/de.json"), "utf8"))));
const en = new Set(flat(JSON.parse(readFileSync(join(repoRoot, "src/locales/en.json"), "utf8"))));
for (const k of de) if (!en.has(k)) fail(`src/locales/en.json lacks key ${k}`);
for (const k of en) if (!de.has(k)) fail(`src/locales/de.json lacks key ${k}`);

// 4. German text on English pages
const DE_WORDS = new Set(
  "der die das und ist nicht ein eine einen mit für auf wir ihr euch deine dein dich dir sie wie wenn oder auch von zu im den dem des zum zur bei aus nach über wird werden haben hat sind kann können mehr noch nur aber als so um".split(" "),
);
const EN_WORDS = new Set(
  "the and is are not a an with for on we you your to of in it that this from or as at be by have has can will more only but how what our their they which when into".split(" "),
);
for (const r of routes) {
  const [lang, path] = r.split(":");
  if (lang !== "en") continue;
  const file = join(dist, "en", path.replace(/^\/?/, ""), "index.html");
  if (!existsSync(file)) continue;
  const body = readFileSync(file, "utf8")
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<head[\s\S]*?<\/head>/, " ")
    .replace(/<[^>]+>/g, "\n");
  const bad: string[] = [];
  for (const line of body.split("\n").map((s) => s.trim())) {
    if (line.length < 25) continue;
    const w = line.toLowerCase().match(/[a-zäöüß]+/g) ?? [];
    if (w.length < 5) continue;
    const d = w.filter((x) => DE_WORDS.has(x)).length;
    const e = w.filter((x) => EN_WORDS.has(x)).length;
    if (d >= 3 && d > e) bad.push(line.slice(0, 80));
  }
  if (bad.length) fail(`en${path} shows German text: «${bad[0]}»${bad.length > 1 ? ` (+${bad.length - 1} more)` : ""}`);
}

// 5. Videos and captions
const videoDir = join(repoRoot, "public/video");
if (existsSync(videoDir)) {
  const files = readdirSync(videoDir);
  const videos = files.filter((f) => /\.(mp4|webm|mov)$/.test(f)).map((f) => f.replace(/\.[^.]+$/, ""));
  for (const v of videos) {
    const base = v.replace(/-\d+$/, ""); // erklaervideo-v5-720 -> erklaervideo-v5
    const cues: Record<string, number> = {};
    for (const l of ["de", "en"]) {
      const f = `${base}.${l}.vtt`;
      if (!files.includes(f)) fail(`public/video/${v} has no caption file ${f}`);
      else cues[l] = (readFileSync(join(videoDir, f), "utf8").match(/-->/g) ?? []).length;
    }
    if (cues.de !== undefined && cues.en !== undefined && cues.de !== cues.en)
      fail(`public/video/${base}: ${cues.de} German cues but ${cues.en} English cues`);
  }
  for (const f of files.filter((f) => f.endsWith(".vtt"))) {
    const base = f.replace(/\.(de|en)\.vtt$/, "");
    if (!videos.some((v) => v === base || v.startsWith(`${base}-`))) fail(`public/video/${f} belongs to no video`);
  }
}
for (const f of walk(join(repoRoot, "src/app"), (f) => f.endsWith(".tsx"))) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(/<video\b[\s\S]*?<\/video>|<video\b[^>]*\/>/g)) {
    const el = m[0];
    const silent = /\smuted\b/.test(el);
    if (!silent && !/<track\b/.test(el)) fail(`${rel(f)}: <video> with sound has no <track> captions`);
  }
}

if (failures.length) {
  for (const f of failures) console.error(`FAIL ${f}`);
  console.error(`check-i18n-parity: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log(`check-i18n-parity: ok (${routes.size} routes, ${md.size} content files, ${de.size} UI keys)`);
