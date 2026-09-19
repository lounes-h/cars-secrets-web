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
  const trimmed = value?.trim();
  if (!trimmed) return LOCAL_URL;
  try {
    return new URL(trimmed).origin;
  } catch {
    throw new Error(`Invalid NEXT_PUBLIC_SITE_URL: "${trimmed}". Use an absolute URL such as https://example.com`);
  }
}

export const site = {
  name: "Car's Secrets",
  /** Other spellings people search for; listed in structured data. */
  alternateNames: ["Cars Secrets", "Car’s Secrets"],
  url: resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  locale: "en_US",
  language: "en",
  tagline: "Auction intelligence for car dealers",
  description:
    "Car's Secrets brings active Copart, IAA and Manheim listings into one search and shows, for every vehicle, the estimated resale value, total acquisition cost, projected profit and a suggested maximum bid.",
  /** Brand colours, for places CSS variables can't reach (manifest, generated images). */
  colors: { red: "#d7282b", ink: "#17222b", muted: "#53616c", white: "#ffffff", dark: "#18222a" },
} as const;

/** Joins a site-relative path onto the site origin. */
export function absoluteUrl(path: string, base: string = site.url): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === "/" ? `${base}/` : `${base}${normalized}`;
}
