import { describe, expect, it } from "vitest";
import { routes } from "@/lib/routes";
import { fixtureRoutes } from "@/lib/seo/fixtures";
import { buildLlmsTxt } from "@/lib/seo/llms";
import { buildRobots } from "@/lib/seo/robots";
import { buildSitemap } from "@/lib/seo/sitemap";

describe("sitemap", () => {
  it("lists every route once, with absolute URLs and its priority", () => {
    const entries = buildSitemap(fixtureRoutes);
    expect(entries.map((entry) => entry.url)).toEqual([
      "https://cars-secrets.test/",
      "https://cars-secrets.test/guides/max-bid",
      "https://cars-secrets.test/terms",
    ]);
    expect(entries[1]).toMatchObject({ changeFrequency: "monthly", priority: 0.8 });
  });

  it("is empty while no pages are registered", () => {
    expect(routes).toHaveLength(0);
    expect(buildSitemap()).toEqual([]);
  });
});

describe("robots", () => {
  it("allows every crawler, AI bots included, and points to the sitemap", () => {
    expect(buildRobots()).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: "https://cars-secrets.test/sitemap.xml",
    });
  });
});

describe("llms.txt", () => {
  it("starts with the site name and summary", () => {
    expect(buildLlmsTxt().startsWith("# Car's Secrets\n\n> ")).toBe(true);
  });

  it("links only the routes flagged for llms.txt", () => {
    const text = buildLlmsTxt(fixtureRoutes);
    expect(text).toContain("## Key pages");
    expect(text).toContain("- [Home](https://cars-secrets.test/): Home page description.");
    expect(text).toContain("(https://cars-secrets.test/guides/max-bid)");
    expect(text).not.toContain("/terms");
  });

  it("omits the key pages section while no pages exist", () => {
    expect(buildLlmsTxt()).not.toContain("## Key pages");
  });
});
