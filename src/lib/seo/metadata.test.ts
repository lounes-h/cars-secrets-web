import { describe, expect, it } from "vitest";
import { fixtureRoutes } from "@/lib/seo/fixtures";
import { buildMetadata, DEFAULT_OG_IMAGE, metadataForRoute } from "@/lib/seo/metadata";

describe("buildMetadata", () => {
  const metadata = buildMetadata({ title: "Features", description: "What it does.", path: "/features" });

  it("appends the site name and sets an absolute canonical URL", () => {
    expect(metadata.title).toEqual({ absolute: "Features | CarBidWise" });
    expect(metadata.alternates?.canonical).toBe("https://cars-secrets.test/features");
  });

  it("fills Open Graph and Twitter with the same title, URL and share image", () => {
    expect(metadata.openGraph).toMatchObject({
      url: "https://cars-secrets.test/features",
      title: "Features | CarBidWise",
      siteName: "CarBidWise",
      images: [
        {
          url: "https://cars-secrets.test/opengraph-image",
          width: DEFAULT_OG_IMAGE.width,
          height: DEFAULT_OG_IMAGE.height,
        },
      ],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Features | CarBidWise",
      images: ["https://cars-secrets.test/opengraph-image"],
    });
  });

  it("is indexable by default", () => {
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
  });

  it("supports noindex and absolute titles", () => {
    const draft = buildMetadata({ title: "Draft", description: "d", path: "/draft", noindex: true, absoluteTitle: true });
    expect(draft.robots).toEqual({ index: false, follow: true });
    expect(draft.title).toEqual({ absolute: "Draft" });
  });
});

describe("metadataForRoute", () => {
  it("uses the registry entry for the path", () => {
    const metadata = metadataForRoute("/guides/max-bid", {}, fixtureRoutes);
    expect(metadata.title).toEqual({ absolute: "How to set a max bid | CarBidWise" });
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
