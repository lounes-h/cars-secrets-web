import { describe, expect, it } from "vitest";
import { absoluteUrl, resolveSiteUrl, site } from "@/lib/site";

describe("resolveSiteUrl", () => {
  it("uses NEXT_PUBLIC_SITE_URL and strips the trailing slash and path", () => {
    expect(resolveSiteUrl("https://example.com/")).toBe("https://example.com");
    expect(resolveSiteUrl("https://example.com/some/path")).toBe("https://example.com");
  });

  it("falls back to localhost when unset or blank", () => {
    expect(resolveSiteUrl(undefined)).toBe("http://localhost:3000");
    expect(resolveSiteUrl("   ")).toBe("http://localhost:3000");
  });

  it("rejects a value that is not an absolute URL", () => {
    expect(() => resolveSiteUrl("example.com")).toThrow(TypeError);
  });
});

describe("site", () => {
  it("carries the address; the brand name lives in the messages", () => {
    expect(site).toEqual({ url: "https://cars-secrets.test" });
  });
});

describe("absoluteUrl", () => {
  it("joins paths onto the configured origin", () => {
    expect(site.url).toBe("https://cars-secrets.test");
    expect(absoluteUrl("/faq")).toBe("https://cars-secrets.test/faq");
    expect(absoluteUrl("faq")).toBe("https://cars-secrets.test/faq");
    expect(absoluteUrl("/")).toBe("https://cars-secrets.test/");
  });
});
