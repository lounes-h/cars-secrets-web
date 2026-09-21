/**
 * Single source of truth for site-wide identity. Anything that ends up in
 * metadata, structured data, the sitemap or llms.txt reads from here.
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
  name: "CarBidWise",
  /** Other spellings people search for; listed in structured data. */
  alternateNames: ["Car Bid Wise", "CarBid Wise"],
  url: resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  locale: "en_US",
  language: "en",
  /** The slogan: shown on the share image and as the brand's schema.org slogan. */
  tagline: "Know what it’s worth before you bid",
  description:
    "CarBidWise brings active Copart, IAA and Manheim listings into one search and shows, for every lot, the estimated resale value, total acquisition cost, projected profit and a suggested maximum bid.",
  /** Brand colours, for places CSS variables can't reach (manifest, generated images). */
  colors: { teal: "#0e555b", red: "#d7282b", ink: "#17222b", muted: "#53616c", white: "#ffffff", dark: "#18222a" },
} as const;

/** Joins a site-relative path onto the site origin. */
export function absoluteUrl(path: string, base: string = site.url): string {
  return new URL(path, base).href;
}
