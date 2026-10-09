import { routes as registry, type SiteRoute } from "@/lib/routes";
import { absoluteUrl } from "@/lib/site";
import { en } from "@/messages/en";

type Pages = Record<string, { title: string; description: string }>;

/**
 * Builds /llms.txt (https://llmstxt.org): a plain-text summary of the site
 * and its key pages, so that AI assistants can find and cite the right page.
 * In English, the site's default language.
 */
export function buildLlmsTxt(routes: readonly SiteRoute<string>[] = registry, pages: Pages = en.pages): string {
  const keyPages = routes
    .filter((route) => route.llms)
    .map((route) => `- [${pages[route.path].title}](${absoluteUrl(route.path)}): ${pages[route.path].description}`);

  return [
    `# ${en.site.name}`,
    "",
    `> ${en.site.description}`,
    "",
    "This site is built for used-car dealers who buy at auction. It does not place bids: each listing links to the original auction site, where the dealer bids directly.",
    "",
    ...(keyPages.length > 0 ? ["## Key pages", "", ...keyPages, ""] : []),
  ].join("\n");
}
