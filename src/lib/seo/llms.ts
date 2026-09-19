import { routes as registry, type SiteRoute } from "@/lib/routes";
import { absoluteUrl, site } from "@/lib/site";

/**
 * Builds /llms.txt (https://llmstxt.org): a plain-text summary of the site
 * and its key pages, so that AI assistants can find and cite the right page.
 */
export function buildLlmsTxt(routes: readonly SiteRoute[] = registry): string {
  const keyPages = routes
    .filter((route) => route.llms)
    .map((route) => `- [${route.title}](${absoluteUrl(route.path)}): ${route.description}`);

  return [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    `${site.name} is built for used-car dealers who buy at auction. It does not place bids: each listing links to the original auction site, where the dealer bids directly.`,
    "",
    ...(keyPages.length > 0 ? ["## Key pages", "", ...keyPages, ""] : []),
  ].join("\n");
}
