import type { Metadata } from "next";
import { absoluteUrl, site } from "@/lib/site";
import { getRoute, routes as registry, type SiteRoute } from "@/lib/routes";

/** The site-wide share image, served by src/app/opengraph-image.tsx. */
export const DEFAULT_OG_IMAGE = {
  path: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${site.name}: ${site.tagline}`,
} as const;

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
  // Setting openGraph on a page replaces the parent's, including the file-based
  // image, so the image is attached explicitly every time.
  const image = {
    url: absoluteUrl(DEFAULT_OG_IMAGE.path),
    width: DEFAULT_OG_IMAGE.width,
    height: DEFAULT_OG_IMAGE.height,
    alt: DEFAULT_OG_IMAGE.alt,
  };

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
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image.url],
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
    ...overrides,
  });
}
