import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { LOCALE_LIST } from "@/lib/i18n";
import { getRoute, routes } from "@/lib/routes";
import { fixtureRoutes } from "@/lib/seo/fixtures";
import { messagesFor } from "@/messages";

const APP_DIR = join(process.cwd(), "src/app");

/**
 * Static page paths found on disk, e.g. "/faq". Route groups and the [lang] segment every page
 * sits under are dropped, other dynamic segments skipped.
 */
function pagePathsOnDisk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name.startsWith("[") && entry.name !== "[lang]" ? [] : pagePathsOnDisk(full);
    if (entry.name !== "page.tsx") return [];
    const segments = relative(APP_DIR, dir)
      .split(sep)
      .filter((segment) => segment && segment !== "[lang]" && !segment.startsWith("("));
    return [`/${segments.join("/")}`];
  });
}

describe("route registry", () => {
  it("has unique paths", () => {
    const paths = routes.map((route) => route.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("registers every static page on disk, so none is missing from the sitemap", () => {
    for (const path of pagePathsOnDisk(APP_DIR)) {
      expect(() => getRoute(path), path).not.toThrow();
    }
  });

  it("finds pages under the [lang] segment", () => {
    expect(pagePathsOnDisk(APP_DIR)).toContain("/active-lots");
  });

  it.each(LOCALE_LIST)("keeps titles and descriptions within search snippet lengths in %s", (locale) => {
    const { pages } = messagesFor(locale);
    for (const route of routes) {
      const { title, description } = pages[route.path];
      expect(title.length, route.path).toBeLessThanOrEqual(60);
      expect(description.length, route.path).toBeGreaterThanOrEqual(40);
      expect(description.length, route.path).toBeLessThanOrEqual(200);
    }
  });

  it("has words for every page it registers, and registers every page that has words", () => {
    expect(routes.map((route) => route.path).sort()).toEqual(Object.keys(messagesFor("en").pages).sort());
  });
});

describe("getRoute", () => {
  it("finds a route in the given registry", () => {
    expect(getRoute("/terms", fixtureRoutes).priority).toBe(0.2);
  });

  it("fails loudly for an unregistered path", () => {
    expect(() => getRoute("/missing", fixtureRoutes)).toThrow(/No route registered for "\/missing"/);
  });
});
