import type { MetadataRoute } from "next";
import { routes as registry, type SiteRoute } from "@/lib/routes";
import { absoluteUrl } from "@/lib/site";

export function buildSitemap(routes: readonly SiteRoute[] = registry): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: absoluteUrl(route.path),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
