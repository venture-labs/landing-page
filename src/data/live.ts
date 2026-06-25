/**
 * Dev-only live editing bridge: subscribes homepage components to TinaCMS's
 * edit-state so the preview pane updates as you type in the /admin panel.
 * Falls back to the build-time generated src/data/{de,en}/*.ts in production,
 * where there is no Tina admin iframe to subscribe to.
 */
import { useEffect, useState } from "react";
import { useTina } from "tinacms/dist/react";
import client from "../../tina/__generated__/client";
import { useLocale, type Locale } from "@/app/locale";

import { siteData as staticSiteDataDe } from "./de/site";
import { aboutData as staticAboutDataDe, type AboutData } from "./de/about";
import { services as staticServicesDe, type Service } from "./de/services";
import {
  featuredCases as staticFeaturedCasesDe,
  gridCases as staticGridCasesDe,
  type FeaturedCase,
  type GridCase,
} from "./de/cases";
import { siteData as staticSiteDataEn } from "./en/site";
import { aboutData as staticAboutDataEn } from "./en/about";
import { services as staticServicesEn } from "./en/services";
import { featuredCases as staticFeaturedCasesEn, gridCases as staticGridCasesEn } from "./en/cases";

const isDev = import.meta.env.DEV;

const siteRelativePath: Record<Locale, string> = {
  de: "home.md",
  en: "home.en.md",
};

const aboutRelativePath: Record<Locale, string> = {
  de: "about.md",
  en: "about.en.md",
};

const leistungenRelativePath: Record<Locale, string> = {
  de: "leistungen.md",
  en: "leistungen.en.md",
};

const staticSiteData: Record<Locale, typeof staticSiteDataDe> = {
  de: staticSiteDataDe,
  en: staticSiteDataEn,
};
const staticAboutData: Record<Locale, AboutData> = {
  de: staticAboutDataDe,
  en: staticAboutDataEn,
};

const staticLeistungenData: Record<Locale, any> = {
  de: {
    language: "de",
    heroTitlePrefix: "Unsere",
    heroTitleHighlight: "Leistungen",
    heroSubheading: "Wir bieten eine breite Palette von digitalen Services, um dein Business zu transformieren. Von Strategy über Design bis zur Entwicklung – alles aus einer Hand.",
    contactCallout: "Interessiert? Lass uns zusammen überlegen, wie wir dir helfen können.",
  },
  en: {
    language: "en",
    heroTitlePrefix: "Our",
    heroTitleHighlight: "Services",
    heroSubheading: "We offer a comprehensive range of digital services to transform your business. From strategy to design to development – everything from a single source.",
    contactCallout: "Interested? Let us think together about how we can help you.",
  },
};
const staticServices: Record<Locale, Service[]> = {
  de: staticServicesDe,
  en: staticServicesEn,
};
const staticFeaturedCases: Record<Locale, FeaturedCase[]> = {
  de: staticFeaturedCasesDe,
  en: staticFeaturedCasesEn,
};
const staticGridCases: Record<Locale, GridCase[]> = {
  de: staticGridCasesDe,
  en: staticGridCasesEn,
};

// Placeholder query used until the real query/data arrives from Tina's client.
// useTina is called unconditionally every render, so this must always be a
// syntactically valid GraphQL document — an empty string causes a parser
// "Unexpected <EOF>" error as soon as the admin tries to query against it.
const PLACEHOLDER_QUERY = "query Placeholder { __typename }";

function useLiveQuery<TData>(
  fetcher: () => Promise<{ query: string; variables: object; data: TData }>,
  staticData: TData,
  deps: unknown[]
): TData {
  const [response, setResponse] = useState<{
    query: string;
    variables: object;
    data: TData;
  }>({ query: PLACEHOLDER_QUERY, variables: {}, data: staticData });

  useEffect(() => {
    if (!isDev) return;
    fetcher()
      .then(setResponse)
      .catch((err) => console.warn("[live-content] query failed:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const { data } = useTina(response);
  return isDev ? data : staticData;
}

// NOTE: these hooks intentionally return Tina's raw query nodes (cast to our
// static types) rather than rebuilding plain objects. Tina attaches hidden
// metadata to each node that `tinaField()` needs to resolve click-to-edit
// targets in the admin's visual/contextual editing mode — reconstructing a
// plain object strips that metadata and breaks click-to-edit.

export function useSiteData(): typeof staticSiteDataDe {
  const { lang } = useLocale();
  const data = useLiveQuery(
    () => client.queries.site({ relativePath: siteRelativePath[lang] }),
    { site: staticSiteData[lang] } as any,
    [lang]
  );
  return (data as any).site;
}

export function useServicesData(): Service[] {
  const { lang } = useLocale();
  const data = useLiveQuery(
    () => client.queries.serviceConnection(),
    { serviceConnection: { edges: [] } } as any,
    [lang]
  );
  const edges = (data as any).serviceConnection?.edges;
  if (!isDev || !edges?.length) return staticServices[lang];
  return edges
    .map((e: any) => e!.node!)
    .filter((s: any) => (s.language ?? "de") === lang)
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
}

export function useCasesData(): { featuredCases: FeaturedCase[]; gridCases: GridCase[] } {
  const { lang } = useLocale();
  const data = useLiveQuery(
    () => client.queries.caseConnection(),
    { caseConnection: { edges: [] } } as any,
    [lang]
  );
  const edges = (data as any).caseConnection?.edges;
  if (!isDev || !edges?.length) {
    return { featuredCases: staticFeaturedCases[lang], gridCases: staticGridCases[lang] };
  }
  const cases = edges
    .map((e: any) => e!.node!)
    .filter((c: any) => (c.language ?? "de") === lang)
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
  return {
    featuredCases: cases.filter((c: any) => c.featured),
    gridCases: cases.filter((c: any) => !c.featured),
  };
}

export function useAboutData(): AboutData {
  const { lang } = useLocale();
  const data = useLiveQuery(
    () => client.queries.about({ relativePath: aboutRelativePath[lang] }),
    { about: staticAboutData[lang] } as any,
    [lang]
  );
  return (data as any).about;
}

export function useLeistungenData() {
  const { lang } = useLocale();
  const data = useLiveQuery(
    async () => {
      try {
        return await client.queries.leistungen({ relativePath: leistungenRelativePath[lang] });
      } catch (err) {
        return { query: PLACEHOLDER_QUERY, variables: {}, data: { leistungen: staticLeistungenData[lang] } };
      }
    },
    { leistungen: staticLeistungenData[lang] } as any,
    [lang]
  );
  const result = (data as any).leistungen;
  return result || staticLeistungenData[lang];
}

export function useServiceDetail(slug?: string) {
  const { lang } = useLocale();
  const data = useLiveQuery(
    () => client.queries.serviceConnection({ filter: { slug: { eq: slug } } }),
    { serviceConnection: { edges: [] } } as any,
    [lang, slug]
  );
  const edges = (data as any).serviceConnection?.edges;
  if (!isDev || !edges?.length) return null;
  const service = edges
    .map((e: any) => e!.node!)
    .find((s: any) => (s.language ?? "de") === lang && s.slug === slug);
  return service || null;
}

export function useCaseDetail(slug?: string) {
  const { lang } = useLocale();
  const data = useLiveQuery(
    async () => {
      try {
        return await client.queries.caseConnection({ filter: { slug: { eq: slug } } });
      } catch (err) {
        return { query: PLACEHOLDER_QUERY, variables: {}, data: { caseConnection: { edges: [] } } };
      }
    },
    { caseConnection: { edges: [] } } as any,
    [lang, slug]
  );
  const edges = (data as any).caseConnection?.edges;
  if (!isDev || !edges?.length) return null;
  const caseData = edges
    .map((e: any) => e!.node!)
    .find((c: any) => (c.language ?? "de") === lang && c.slug === slug);
  return caseData || null;
}

export function usePricingData() {
  // Pricing component removed from the site
  return [];
}
