import { describe, expect, it } from "vitest";
import { absoluteUrl, resolveSiteUrl, site } from "@/lib/site";

describe("resolveSiteUrl", () => {
  it("prefers NEXT_PUBLIC_SITE_URL and strips the trailing slash", () => {
    expect(
      resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://carssecrets.com/", RENDER_EXTERNAL_URL: "https://x.onrender.com" }),
    ).toBe("https://carssecrets.com");
  });

  it("falls back to the Render URL, then to localhost", () => {
    expect(resolveSiteUrl({ RENDER_EXTERNAL_URL: "https://cars.onrender.com" })).toBe("https://cars.onrender.com");
    expect(resolveSiteUrl({})).toBe("http://localhost:3000");
  });

  it("ignores blank values", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "  ", RENDER_EXTERNAL_URL: "https://cars.onrender.com" })).toBe(
      "https://cars.onrender.com",
    );
  });

  it("rejects a value that is not an absolute URL", () => {
    expect(() => resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "carssecrets.com" })).toThrow(/Invalid site URL/);
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
