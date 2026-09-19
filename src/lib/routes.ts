/**
 * Registry of every public, indexable page. The sitemap and llms.txt are
 * generated from it — add a route here when you add a page.
 */
export type SiteRoute = {
  path: string;
  title: string;
  description: string;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
  /** Shown in the site navigation. */
  nav?: boolean;
  /** Listed in llms.txt under "Key pages". */
  llms?: boolean;
};

/** No pages exist yet. */
export const routes: readonly SiteRoute[] = [];

export function getRoute(path: string, registry: readonly SiteRoute[] = routes): SiteRoute {
  const route = registry.find((candidate) => candidate.path === path);
  if (!route) throw new Error(`No route registered for "${path}". Add it to src/lib/routes.ts.`);
  return route;
}

export const navRoutes = routes.filter((route) => route.nav);
