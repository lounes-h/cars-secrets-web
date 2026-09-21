import type { Metadata } from "next";
import { absoluteUrl, site } from "@/lib/site";
import { getRoute, routes as registry, type SiteRoute } from "@/lib/routes";

type BuildMetadataInput = {
  title: string;
  description: string;
  path: string;
  /** Keeps the page out of search indexes (e.g. drafts, utility pages). */
  noindex?: boolean;
  openGraphType?: "website" | "article";
};

/**
 * Every page builds its metadata here so that canonical URLs, Open Graph and
 * robots directives stay consistent across the site.
 */
export function buildMetadata({
  title,
  description,
  path,
  noindex = false,
  openGraphType = "website",
}: BuildMetadataInput): Metadata {
  const url = absoluteUrl(path);

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: openGraphType,
      url,
      title,
      description,
      locale: site.locale,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: noindex
      ? { index: false, follow: true }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
        },
  };
}

/** Metadata for a page listed in the route registry. */
export function metadataForRoute(
  path: string,
  overrides: Partial<BuildMetadataInput> = {},
  routes: readonly SiteRoute[] = registry,
): Metadata {
  const route = getRoute(path, routes);
  return buildMetadata({
    title: route.title,
    description: route.description,
    path: route.path,
    noindex: route.noindex,
    ...overrides,
  });
}
