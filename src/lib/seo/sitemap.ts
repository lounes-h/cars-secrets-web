import type { MetadataRoute } from "next";
import { LOCALE_LIST, localePath } from "@/lib/i18n";
import { routes as registry, type SiteRoute } from "@/lib/routes";
import { languageAlternates } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/site";

/** Every indexable page in every language, each naming the others. */
export function buildSitemap(routes: readonly SiteRoute<string>[] = registry): MetadataRoute.Sitemap {
  return routes
    .filter((route) => !route.noindex)
    .flatMap((route) =>
      LOCALE_LIST.map((locale) => ({
        url: absoluteUrl(localePath(route.path, locale)),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: { languages: languageAlternates(route.path) },
      })),
    );
}
