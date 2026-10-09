/**
 * Single source of truth for the site's address. Anything that ends up in
 * metadata, the sitemap or llms.txt reads its URLs from here; the words
 * (brand name, description, titles) are in src/messages.
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
} as const;

/** Joins a site-relative path onto the site origin. */
export function absoluteUrl(path: string, base: string = site.url): string {
  return new URL(path, base).href;
}
