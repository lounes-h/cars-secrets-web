import type { Metadata } from "next";
import { absoluteUrl, site } from "@/lib/site";
import { getRoute, routes as registry, type SiteRoute } from "@/lib/routes";

type BuildMetadataInput = {
  title: string;
  description: string;
  path: string;
  /** Keeps the page out of search indexes (e.g. drafts, utility pages). */
  noindex?: boolean;
  /** Use the title as-is instead of appending the site name. */
  absoluteTitle?: boolean;
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
  absoluteTitle = false,
  openGraphType = "website",
}: BuildMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = absoluteTitle ? title : `${title} | ${site.name}`;

  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: openGraphType,
      url,
      title: fullTitle,
      description,
      siteName: site.name,
      locale: site.locale,
    },
    twitter: {
      card: "summary",
      title: fullTitle,
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
