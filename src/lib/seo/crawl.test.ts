import { describe, expect, it } from "vitest";
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

  it("leaves noindex pages out", () => {
    const urls = buildSitemap().map((entry) => entry.url);
    expect(urls).toContain("https://cars-secrets.test/login");
    expect(urls).not.toContain("https://cars-secrets.test/account");
    expect(buildSitemap(fixtureRoutes).map((entry) => entry.url)).not.toContain("https://cars-secrets.test/reset");
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
    expect(buildLlmsTxt().startsWith("# CarBidWise\n\n> ")).toBe(true);
  });

  it("links only the routes flagged for llms.txt", () => {
    const text = buildLlmsTxt(fixtureRoutes);
    expect(text).toContain("## Key pages");
    expect(text).toContain("- [Home](https://cars-secrets.test/): Home page description.");
    expect(text).toContain("(https://cars-secrets.test/guides/max-bid)");
    expect(text).not.toContain("/terms");
  });

  it("lists the home page as the site's key page", () => {
    expect(buildLlmsTxt()).toContain(
      "- [Everything You Need to Know Before Buying a Car at Auction](https://cars-secrets.test/)",
    );
  });
});
