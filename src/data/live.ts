/**
 * Dev-only live editing bridge: subscribes homepage components to TinaCMS's
 * edit-state so the preview pane updates as you type in the /admin panel.
 * Falls back to the build-time generated src/data/*.ts in production, where
 * there is no Tina admin iframe to subscribe to.
 */
import { useEffect, useState } from "react";
import { useTina } from "tinacms/dist/react";
import client from "../../tina/__generated__/client";
import { siteData as staticSiteData } from "./site";
import { services as staticServices, type Service } from "./services";
import {
  featuredCases as staticFeaturedCases,
  gridCases as staticGridCases,
  type FeaturedCase,
  type GridCase,
} from "./cases";
import { pricingPlans as staticPricingPlans, type PricingPlan } from "./pricing";

const isDev = import.meta.env.DEV;

// Placeholder query used until the real query/data arrives from Tina's client.
// useTina is called unconditionally every render, so this must always be a
// syntactically valid GraphQL document — an empty string causes a parser
// "Unexpected <EOF>" error as soon as the admin tries to query against it.
const PLACEHOLDER_QUERY = "query Placeholder { __typename }";

function useLiveQuery<TData>(
  fetcher: () => Promise<{ query: string; variables: object; data: TData }>,
  staticData: TData
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
  }, []);

  const { data } = useTina(response);
  return isDev ? data : staticData;
}

// NOTE: these hooks intentionally return Tina's raw query nodes (cast to our
// static types) rather than rebuilding plain objects. Tina attaches hidden
// metadata to each node that `tinaField()` needs to resolve click-to-edit
// targets in the admin's visual/contextual editing mode — reconstructing a
// plain object strips that metadata and breaks click-to-edit.

export function useSiteData(): typeof staticSiteData {
  const data = useLiveQuery(
    () => client.queries.site({ relativePath: "home.md" }),
    { site: staticSiteData } as any
  );
  return (data as any).site;
}

export function useServicesData(): Service[] {
  const data = useLiveQuery(
    () => client.queries.serviceConnection(),
    { serviceConnection: { edges: [] } } as any
  );
  const edges = (data as any).serviceConnection?.edges;
  if (!isDev || !edges?.length) return staticServices;
  return edges
    .map((e: any) => e!.node!)
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
}

export function useCasesData(): { featuredCases: FeaturedCase[]; gridCases: GridCase[] } {
  const data = useLiveQuery(
    () => client.queries.caseConnection(),
    { caseConnection: { edges: [] } } as any
  );
  const edges = (data as any).caseConnection?.edges;
  if (!isDev || !edges?.length) {
    return { featuredCases: staticFeaturedCases, gridCases: staticGridCases };
  }
  const cases = edges
    .map((e: any) => e!.node!)
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
  return {
    featuredCases: cases.filter((c: any) => c.featured),
    gridCases: cases.filter((c: any) => !c.featured),
  };
}

export function usePricingData(): PricingPlan[] {
  const data = useLiveQuery(
    () => client.queries.pricingPlanConnection(),
    { pricingPlanConnection: { edges: [] } } as any
  );
  const edges = (data as any).pricingPlanConnection?.edges;
  if (!isDev || !edges?.length) return staticPricingPlans;
  return edges
    .map((e: any) => e!.node!)
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
}
