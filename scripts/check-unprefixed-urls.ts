/**
 * Live check: every sitemap route requested WITHOUT its /de or /en prefix must
 * answer 302 to the prefixed URL chosen by Accept-Language (de, en-US, none -> de),
 * keep the query string and never loop.
 * Usage: tsx scripts/check-unprefixed-urls.ts <base-url, default https://venturelabs.team>
 */
const base = (process.argv[2] ?? "https://venturelabs.team").replace(/\/+$/, "");

async function main() {
  const xml = await (await fetch(`${base}/sitemap.xml`)).text();
  const paths = [...xml.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map((m) => m[1]);
  const slugs = [...new Set(paths.map((p) => p.match(/^\/(?:de|en)(\/.+?)\/?$/)?.[1]).filter(Boolean) as string[])];
  const cases: [string | null, string][] = [["de", "de"], ["en-US,en;q=0.9", "en"], [null, "de"]];
  let bad = 0;
  for (const slug of slugs) {
    const available = new Set(paths.filter((p) => p.replace(/\/$/, "").endsWith(slug)).map((p) => p.slice(1, 3)));
    for (const [header, want] of cases) {
      const lang = available.has(want) ? want : [...available][0];
      const res = await fetch(`${base}${slug}?utm_source=t`, {
        redirect: "manual",
        headers: header ? { "Accept-Language": header } : {},
      });
      const loc = res.headers.get("location") ?? "";
      const ok = res.status === 302 && loc.includes(`/${lang}${slug}`) && loc.includes("utm_source=t");
      if (!ok) {
        bad++;
        console.error(`FAIL ${slug} [${header ?? "none"}] -> ${res.status} ${loc} (want /${lang}${slug})`);
      }
    }
  }
  console.log(`check-unprefixed-urls: ${slugs.length} paths x ${cases.length} languages, ${bad} failures`);
  process.exit(bad ? 1 : 0);
}
main();
