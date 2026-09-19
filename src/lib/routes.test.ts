import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { getRoute, routes } from "@/lib/routes";
import { fixtureRoutes } from "@/lib/seo/fixtures";

const APP_DIR = join(process.cwd(), "src/app");

/** Static page paths found on disk, e.g. "/faq". Route groups are dropped, dynamic segments skipped. */
function pagePathsOnDisk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name.startsWith("[") ? [] : pagePathsOnDisk(full);
    if (entry.name !== "page.tsx") return [];
    const segments = relative(APP_DIR, dir)
      .split(sep)
      .filter((segment) => segment && !segment.startsWith("("));
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

  it("keeps titles and descriptions within search snippet lengths", () => {
    for (const route of routes) {
      expect(route.title.length, route.path).toBeLessThanOrEqual(60);
      expect(route.description.length, route.path).toBeGreaterThanOrEqual(40);
      expect(route.description.length, route.path).toBeLessThanOrEqual(200);
    }
  });
});

describe("getRoute", () => {
  it("finds a route in the given registry", () => {
    expect(getRoute("/terms", fixtureRoutes).title).toBe("Terms");
  });

  it("fails loudly for an unregistered path", () => {
    expect(() => getRoute("/missing", fixtureRoutes)).toThrow(/No route registered for "\/missing"/);
  });
});
