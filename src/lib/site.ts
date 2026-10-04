/**
 * Single source of truth for site-wide identity. Anything that ends up in
 * metadata, the sitemap or llms.txt reads from here. The brand name
 * (CarBidInsight) is only in the banner's logo so far, not here.
 */

const LOCAL_URL = "http://localhost:3000";

/**
 * Resolves the public origin of the site, without a trailing slash, from
 * NEXT_PUBLIC_SITE_URL, falling back to localhost for development.
 * NEXT_PUBLIC_ variables are inlined into client bundles too, so server and
 * browser always agree on the value.
 */
export function resolveSiteUrl(value: string | undefined): string {
  return value?.trim() ? new URL(value.trim()).origin : LOCAL_URL;
}

export const site = {
  url: resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  locale: "en_US",
  language: "en",
  description:
    "Active Copart, IAA and Manheim listings in one search, with the estimated resale value, total acquisition cost, projected profit and a suggested maximum bid for every lot.",
} as const;

/** The site's host, used where a name would otherwise go. */
export const siteHost = new URL(site.url).host;

/** Joins a site-relative path onto the site origin. */
export function absoluteUrl(path: string, base: string = site.url): string {
  return new URL(path, base).href;
}
