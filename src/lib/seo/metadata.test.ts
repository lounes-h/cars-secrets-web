import { describe, expect, it } from "vitest";
import { fixtureRoutes } from "@/lib/seo/fixtures";
import { buildMetadata, metadataForRoute } from "@/lib/seo/metadata";

describe("buildMetadata", () => {
  const metadata = buildMetadata({ title: "Features", description: "What it does.", path: "/features" });

  it("appends the site name and sets an absolute canonical URL", () => {
    expect(metadata.title).toEqual({ absolute: "Features" });
    expect(metadata.alternates?.canonical).toBe("https://cars-secrets.test/features");
  });

  it("fills Open Graph and Twitter with the same title and URL, and no share image or site name", () => {
    expect(metadata.openGraph).toMatchObject({
      url: "https://cars-secrets.test/features",
      title: "Features",
    });
    expect(metadata.openGraph).not.toHaveProperty("siteName");
    expect(metadata.openGraph).not.toHaveProperty("images");
    expect(metadata.twitter).toMatchObject({ card: "summary", title: "Features" });
    expect(metadata.twitter).not.toHaveProperty("images");
  });

  it("is indexable by default", () => {
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
  });

  it("supports noindex", () => {
    const draft = buildMetadata({ title: "Draft", description: "d", path: "/draft", noindex: true });
    expect(draft.robots).toEqual({ index: false, follow: true });
    expect(draft.title).toEqual({ absolute: "Draft" });
  });
});

describe("metadataForRoute", () => {
  it("uses the registry entry for the path", () => {
    const metadata = metadataForRoute("/guides/max-bid", {}, fixtureRoutes);
    expect(metadata.title).toEqual({ absolute: "How to set a max bid" });
    expect(metadata.description).toBe("Guide description.");
    expect(metadata.alternates?.canonical).toBe("https://cars-secrets.test/guides/max-bid");
  });

  it("fails loudly for a page missing from the registry", () => {
    expect(() => metadataForRoute("/not-registered", {}, fixtureRoutes)).toThrow(/No route registered/);
  });

  it("marks noindex routes noindex", () => {
    expect(metadataForRoute("/reset", {}, fixtureRoutes).robots).toEqual({ index: false, follow: true });
  });
});
