import { describe, expect, it } from "vitest";
import {
  article,
  breadcrumbList,
  faqPage,
  organization,
  serializeJsonLd,
  softwareApplication,
  webSite,
} from "@/lib/seo/jsonld";

describe("JSON-LD builders", () => {
  it("links WebSite and WebApplication to the Organization by @id", () => {
    const org = organization();
    expect(org).toMatchObject({
      "@type": "Organization",
      "@id": "https://cars-secrets.test/#organization",
      name: "Cars Secrets",
      logo: "https://cars-secrets.test/logo.png",
    });
    expect(webSite()).toMatchObject({ "@type": "WebSite", publisher: { "@id": org["@id"] } });
    expect(softwareApplication()).toMatchObject({ "@type": "WebApplication", publisher: { "@id": org["@id"] } });
  });

  it("builds an FAQPage with one Question per item", () => {
    const data = faqPage([{ question: "Q?", answer: "A." }]);
    expect(data.mainEntity).toEqual([
      { "@type": "Question", name: "Q?", acceptedAnswer: { "@type": "Answer", text: "A." } },
    ]);
  });

  it("refuses an empty FAQPage", () => {
    expect(() => faqPage([])).toThrow();
  });

  it("numbers breadcrumb items from 1 with absolute URLs", () => {
    const data = breadcrumbList([
      { name: "Home", path: "/" },
      { name: "Auctions", path: "/auctions" },
    ]);
    expect(data.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: "https://cars-secrets.test/" },
      { "@type": "ListItem", position: 2, name: "Auctions", item: "https://cars-secrets.test/auctions" },
    ]);
  });

  it("defaults an article's dateModified to its publish date", () => {
    const data = article({ headline: "H", description: "D", path: "/how-it-works", datePublished: "2026-09-18" });
    expect(data).toMatchObject({ dateModified: "2026-09-18", url: "https://cars-secrets.test/how-it-works" });
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so content cannot close the script tag", () => {
    const output = serializeJsonLd({ "@type": "Thing", name: "</script><script>alert(1)</script>" });
    expect(output).not.toContain("<");
    expect(JSON.parse(output).name).toBe("</script><script>alert(1)</script>");
  });
});
