import { absoluteUrl, site } from "@/lib/site";

/**
 * schema.org structured data builders. Each returns a plain JSON-LD object;
 * render it with the <JsonLd> component.
 */

export type JsonLdObject = { "@context"?: "https://schema.org"; "@type": string; [key: string]: unknown };

const ORGANIZATION_ID = `${site.url}/#organization`;
const WEBSITE_ID = `${site.url}/#website`;

export function organization(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: site.name,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/logo.png"),
    description: site.description,
  };
}

export function webSite(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: site.name,
    url: absoluteUrl("/"),
    description: site.description,
    inLanguage: site.language,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export function softwareApplication(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: site.name,
    url: absoluteUrl("/"),
    description: site.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    audience: { "@type": "BusinessAudience", audienceType: "Used-car dealers" },
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export type FaqItem = { question: string; answer: string };

export function faqPage(items: readonly FaqItem[]): JsonLdObject {
  if (items.length === 0) throw new Error("faqPage needs at least one question");
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export type Crumb = { name: string; path: string };

export function breadcrumbList(crumbs: readonly Crumb[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function article(input: {
  headline: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    url: absoluteUrl(input.path),
    mainEntityOfPage: absoluteUrl(input.path),
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
    inLanguage: site.language,
  };
}

/**
 * Serializes JSON-LD for an inline <script>. Escapes "<" so that content can
 * never close the script element early (e.g. a "</script>" inside a string).
 */
export function serializeJsonLd(data: JsonLdObject | JsonLdObject[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
