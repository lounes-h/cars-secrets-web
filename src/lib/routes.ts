import type { Messages } from "@/messages/en";

/**
 * Registry of every public, indexable page. The sitemap and llms.txt are
 * generated from it — add a route here when you add a page, and its title and
 * description to each language's `pages` (src/messages).
 */
export type RoutePath = keyof Messages["pages"];

export type SiteRoute<P extends string = RoutePath> = {
  path: P;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
  /** Listed in llms.txt under "Key pages". */
  llms?: boolean;
  /** Registered (so the page is known) but kept out of the sitemap and marked noindex. */
  noindex?: boolean;
};

export const routes: readonly SiteRoute[] = [
  {
    path: "/",
    changeFrequency: "daily",
    priority: 1,
    llms: true,
  },
  {
    path: "/active-lots",
    changeFrequency: "daily",
    priority: 0.9,
  },
  {
    path: "/vin-lookup",
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    path: "/best-buys",
    changeFrequency: "daily",
    priority: 0.8,
  },
  {
    path: "/how-it-works",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/pricing",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/saved",
    changeFrequency: "daily",
    priority: 0.1,
    noindex: true,
  },
  {
    path: "/alerts",
    changeFrequency: "daily",
    priority: 0.1,
    noindex: true,
  },
  {
    path: "/settings",
    changeFrequency: "yearly",
    priority: 0.1,
    noindex: true,
  },
  {
    path: "/register",
    changeFrequency: "yearly",
    priority: 0.5,
  },
  {
    path: "/login",
    changeFrequency: "yearly",
    priority: 0.5,
  },
  {
    path: "/forgot-password",
    changeFrequency: "yearly",
    priority: 0.2,
  },
  {
    path: "/reset-password",
    changeFrequency: "yearly",
    priority: 0.1,
    noindex: true,
  },
  {
    path: "/verify-email",
    changeFrequency: "yearly",
    priority: 0.1,
    noindex: true,
  },
  {
    path: "/account",
    changeFrequency: "yearly",
    priority: 0.1,
    noindex: true,
  },
];

export function getRoute(path: string, registry: readonly SiteRoute<string>[] = routes): SiteRoute<string> {
  const route = registry.find((candidate) => candidate.path === path);
  if (!route) throw new Error(`No route registered for "${path}". Add it to src/lib/routes.ts.`);
  return route;
}
