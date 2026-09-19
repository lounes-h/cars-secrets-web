/**
 * Single source of truth for site-wide identity. Anything that ends up in
 * metadata, structured data, the sitemap or llms.txt reads from here.
 */

const LOCAL_URL = "http://localhost:3000";

type SiteUrlEnv = {
  NEXT_PUBLIC_SITE_URL?: string;
  RENDER_EXTERNAL_URL?: string;
};

/**
 * Resolves the public origin of the site, without a trailing slash.
 * Prefers the explicit NEXT_PUBLIC_SITE_URL, then the URL Render assigns to
 * the service, then localhost for development.
 */
export function resolveSiteUrl(env: SiteUrlEnv): string {
  const candidates = [env.NEXT_PUBLIC_SITE_URL, env.RENDER_EXTERNAL_URL];
  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (!value) continue;
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new Error(`Invalid site URL: "${value}". Use an absolute URL such as https://example.com`);
    }
    return url.origin;
  }
  return LOCAL_URL;
}

export const site = {
  name: "Cars Secrets",
  url: resolveSiteUrl({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL,
  }),
  locale: "en_US",
  language: "en",
  tagline: "Auction intelligence for car dealers",
  description:
    "Cars Secrets brings active Copart, IAA and Manheim listings into one search and shows, for every vehicle, the estimated resale value, total acquisition cost, projected profit and a suggested maximum bid.",
} as const;

/** Joins a site-relative path onto the site origin. */
export function absoluteUrl(path: string, base: string = site.url): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === "/" ? `${base}/` : `${base}${normalized}`;
}
