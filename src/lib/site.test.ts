import { describe, expect, it } from "vitest";
import { absoluteUrl, resolveSiteUrl, site } from "@/lib/site";

describe("resolveSiteUrl", () => {
  it("uses NEXT_PUBLIC_SITE_URL and strips the trailing slash and path", () => {
    expect(resolveSiteUrl("https://carssecrets.com/")).toBe("https://carssecrets.com");
    expect(resolveSiteUrl("https://carssecrets.com/some/path")).toBe("https://carssecrets.com");
  });

  it("falls back to localhost when unset or blank", () => {
    expect(resolveSiteUrl(undefined)).toBe("http://localhost:3000");
    expect(resolveSiteUrl("   ")).toBe("http://localhost:3000");
  });

  it("rejects a value that is not an absolute URL", () => {
    expect(() => resolveSiteUrl("carssecrets.com")).toThrow(TypeError);
  });
});

describe("site", () => {
  it("is branded Car's Secrets, with the other spellings as alternate names", () => {
    expect(site.name).toBe("Car's Secrets");
    expect(site.alternateNames).toContain("Cars Secrets");
    expect(site.description.startsWith("Car's Secrets ")).toBe(true);
  });

  it("carries the slogan", () => {
    expect(site.tagline).toBe("Know what it’s worth before you bid");
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
