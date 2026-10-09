import { lang } from "next/root-params";
import { describe, expect, it, vi } from "vitest";
import { buildMetadata, languageAlternates, metadataForRoute } from "@/lib/seo/metadata";
import { es } from "@/messages/es";

describe("buildMetadata", () => {
  const metadata = buildMetadata({ title: "Features", description: "What it does.", path: "/features", locale: "en" });

  it("brands the title and sets an absolute canonical URL", () => {
    expect(metadata.title).toEqual({ absolute: "Features | Car Bid Insight" });
    expect(metadata.alternates?.canonical).toBe("https://cars-secrets.test/features");
  });

  it("names the page in every language, English as the default", () => {
    expect(metadata.alternates?.languages).toEqual({
      "en-US": "https://cars-secrets.test/features",
      "es-US": "https://cars-secrets.test/es/features",
      "x-default": "https://cars-secrets.test/features",
    });
  });

  it("brands Open Graph and Twitter consistently, with no share image", () => {
    expect(metadata.openGraph).toMatchObject({
      url: "https://cars-secrets.test/features",
      title: "Features | Car Bid Insight",
      siteName: "Car Bid Insight",
      locale: "en_US",
    });
    expect(metadata.openGraph).not.toHaveProperty("images");
    expect(metadata.twitter).toMatchObject({ card: "summary", title: "Features | Car Bid Insight" });
    expect(metadata.twitter).not.toHaveProperty("images");
  });

  it("puts a Spanish page at its /es URL, in its own Open Graph locale", () => {
    const spanish = buildMetadata({ title: "Funciones", description: "Qué hace.", path: "/features", locale: "es" });
    expect(spanish.title).toEqual({ absolute: "Funciones | Car Bid Insight" });
    expect(spanish.alternates?.canonical).toBe("https://cars-secrets.test/es/features");
    expect(spanish.openGraph).toMatchObject({
      url: "https://cars-secrets.test/es/features",
      locale: "es_US",
      siteName: "Car Bid Insight",
      title: "Funciones | Car Bid Insight",
    });
    expect(spanish.twitter).toMatchObject({ title: "Funciones | Car Bid Insight" });
  });

  it("is indexable by default", () => {
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
  });

  it("supports noindex", () => {
    const draft = buildMetadata({ title: "Draft", description: "d", path: "/draft", locale: "en", noindex: true });
    expect(draft.robots).toEqual({ index: false, follow: true });
    expect(draft.title).toEqual({ absolute: "Draft | Car Bid Insight" });
  });
});

describe("languageAlternates", () => {
  it("gives the home page as / and /es", () => {
    expect(languageAlternates("/")).toEqual({
      "en-US": "https://cars-secrets.test/",
      "es-US": "https://cars-secrets.test/es",
      "x-default": "https://cars-secrets.test/",
    });
  });
});

describe("metadataForRoute", () => {
  it("uses the registered page's words in the page's language", async () => {
    const metadata = await metadataForRoute("/active-lots");
    expect(metadata.title).toEqual({ absolute: "Active lots | Car Bid Insight" });
    expect(metadata.alternates?.canonical).toBe("https://cars-secrets.test/active-lots");

    vi.mocked(lang).mockResolvedValueOnce("es");
    const spanish = await metadataForRoute("/active-lots");
    expect(spanish.title).toEqual({ absolute: `${es.pages["/active-lots"].title} | Car Bid Insight` });
    expect(spanish.description).toBe(es.pages["/active-lots"].description);
    expect(spanish.alternates?.canonical).toBe("https://cars-secrets.test/es/active-lots");
  });

  it("marks noindex routes noindex", async () => {
    expect((await metadataForRoute("/account")).robots).toEqual({ index: false, follow: true });
  });
});
