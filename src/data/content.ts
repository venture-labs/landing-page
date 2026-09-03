/**
 * Locale-aware accessors for the site's content.
 *
 * Every value here is generated at build time from the markdown in content/
 * by scripts/generate-content.ts, so these hooks are plain lookups keyed by
 * the active locale — no requests, no client, no CMS runtime.
 */
import { useLocale, type Locale } from "@/app/locale";

import { siteData as siteDe } from "./de/site";
import { aboutData as aboutDe, type AboutData } from "./de/about";
import { leistungenData as leistungenDe, type LeistungenData } from "./de/leistungen";
import { services as servicesDe, type Service } from "./de/services";
import { serviceDetails as serviceDetailsDe, type ServiceDetail } from "./de/serviceDetails";
import {
  featuredCases as featuredCasesDe,
  gridCases as gridCasesDe,
  type FeaturedCase,
  type GridCase,
} from "./de/cases";
import { caseDetailsMap as caseDetailsDe, type CaseDetail } from "./de/caseDetails";
import { blogPosts as blogPostsDe, type BlogPost } from "./de/blog";

import { siteData as siteEn } from "./en/site";
import { aboutData as aboutEn } from "./en/about";
import { leistungenData as leistungenEn } from "./en/leistungen";
import { services as servicesEn } from "./en/services";
import { serviceDetails as serviceDetailsEn } from "./en/serviceDetails";
import { featuredCases as featuredCasesEn, gridCases as gridCasesEn } from "./en/cases";
import { caseDetailsMap as caseDetailsEn } from "./en/caseDetails";
import { blogPosts as blogPostsEn } from "./en/blog";

const site: Record<Locale, typeof siteDe> = { de: siteDe, en: siteEn };
const about: Record<Locale, AboutData> = { de: aboutDe, en: aboutEn };
const leistungen: Record<Locale, LeistungenData> = { de: leistungenDe, en: leistungenEn };
const services: Record<Locale, Service[]> = { de: servicesDe, en: servicesEn };
const serviceDetails: Record<Locale, ServiceDetail[]> = {
  de: serviceDetailsDe,
  en: serviceDetailsEn,
};
const featuredCases: Record<Locale, FeaturedCase[]> = { de: featuredCasesDe, en: featuredCasesEn };
const gridCases: Record<Locale, GridCase[]> = { de: gridCasesDe, en: gridCasesEn };
const caseDetails: Record<Locale, Record<string, CaseDetail>> = {
  de: caseDetailsDe,
  en: caseDetailsEn,
};
const blogPosts: Record<Locale, BlogPost[]> = { de: blogPostsDe, en: blogPostsEn };

export function useSiteData(): typeof siteDe {
  return site[useLocale().lang];
}

export function useAboutData(): AboutData {
  return about[useLocale().lang];
}

export function useLeistungenData(): LeistungenData {
  return leistungen[useLocale().lang];
}

export function useServicesData(): Service[] {
  return services[useLocale().lang];
}

export function useServiceDetail(slug?: string): ServiceDetail | null {
  const { lang } = useLocale();
  return serviceDetails[lang].find((d) => d.slug === slug) ?? null;
}

export function useCasesData(): { featuredCases: FeaturedCase[]; gridCases: GridCase[] } {
  const { lang } = useLocale();
  return { featuredCases: featuredCases[lang], gridCases: gridCases[lang] };
}

export function useCaseDetail(slug?: string): CaseDetail | null {
  const { lang } = useLocale();
  return (slug ? caseDetails[lang][slug] : undefined) ?? null;
}

export function useBlogData(): BlogPost[] {
  return blogPosts[useLocale().lang];
}

export function useBlogDetail(slug?: string): BlogPost | null {
  const { lang } = useLocale();
  return blogPosts[lang].find((p) => p.slug === slug) ?? null;
}

export function usePricingData() {
  // Pricing component removed from the site
  return [];
}
