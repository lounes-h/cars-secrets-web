import type { Metadata } from "next";
import { type Locale, LOCALE_LIST, LOCALES, localePath } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { getRoute, type RoutePath } from "@/lib/routes";
import { absoluteUrl } from "@/lib/site";
import { messagesFor } from "@/messages";

type BuildMetadataInput = {
  title: string;
  description: string;
  /** The page's path without a language prefix: each language's URL is built from it. */
  path: string;
  locale: Locale;
  /** Keeps the page out of search indexes (e.g. drafts, utility pages). */
  noindex?: boolean;
  openGraphType?: "website" | "article";
};

/** The page in every language, for hreflang; the English one is also the default. */
export function languageAlternates(path: string): Record<string, string> {
  const languages = Object.fromEntries(LOCALE_LIST.map((locale) => [LOCALES[locale].tag, absoluteUrl(localePath(path, locale))]));
  return { ...languages, "x-default": absoluteUrl(path) };
}

/**
 * Every page builds its metadata here so that canonical URLs, language alternates, Open Graph
 * and robots directives stay consistent across the site.
 */
export function buildMetadata({
  title,
  description,
  path,
  locale,
  noindex = false,
  openGraphType = "website",
}: BuildMetadataInput): Metadata {
  const url = absoluteUrl(localePath(path, locale));
  const siteName = messagesFor(locale).site.name;
  const brandedTitle = `${title} | ${siteName}`;

  return {
    title: { absolute: brandedTitle },
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type: openGraphType,
      url,
      title: brandedTitle,
      siteName,
      description,
      locale: LOCALES[locale].openGraph,
    },
    twitter: {
      card: "summary",
      title: brandedTitle,
      description,
    },
    robots: noindex
      ? { index: false, follow: true }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
        },
  };
}

/** Metadata for a page listed in the route registry, in the page's language. */
export async function metadataForRoute(path: RoutePath): Promise<Metadata> {
  const { locale, m } = await getI18n();
  return buildMetadata({ ...m.pages[path], path, locale, noindex: getRoute(path).noindex });
}
