/**
 * The languages the site speaks, and how a page's path carries one. English is the default and
 * has no prefix ("/active-lots"); every other language is a prefix ("/es/active-lots"). Free of
 * server code, so the browser shares it. See docs/architecture.md, Languages.
 */

import { createElement, Fragment, type ReactNode } from "react";
import type { Messages } from "@/messages/en";

/** Keyed by the URL prefix. `tag` is the BCP 47 tag for `<html lang>`, hreflang and Intl. */
export const LOCALES = {
  en: { tag: "en-US", label: "English (United States)", short: "English", openGraph: "en_US" },
  es: { tag: "es-US", label: "Español (Estados Unidos)", short: "Español", openGraph: "es_US" },
} as const;

export type Locale = keyof typeof LOCALES;

/** A language and its words: what every translated component reads. */
export type I18n = { locale: Locale; m: Messages };

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_LIST = Object.keys(LOCALES) as Locale[];
/** The language the visitor last browsed in, which the proxy keeps in step with the URL. */
export const LOCALE_COOKIE = "cs_locale";

export const isLocale = (value: unknown): value is Locale => typeof value === "string" && Object.hasOwn(LOCALES, value);

/** "/active-lots" in Spanish is "/es/active-lots", and "/" is "/es"; English keeps the path. */
export function localePath(path: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** The language a path is in and the path without its prefix: "/es/login" is Spanish "/login". */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const [, first, ...rest] = pathname.split("/");
  if (!isLocale(first)) return { locale: DEFAULT_LOCALE, path: pathname };
  return { locale: first, path: `/${rest.join("/")}` };
}

/** "{count} lots" with `{ count: "3" }` is "3 lots". A name without a value stays as written. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in values ? String(values[name]) : whole));
}

/** Like `fill`, with elements for values: "Sent to {email}" with `{ email: <strong>…</strong> }`. */
export function rich(template: string, values: Record<string, ReactNode>): ReactNode {
  const parts = template.split(/\{(\w+)\}/).map((part, index) => (index % 2 ? values[part] : part));
  return createElement(Fragment, null, ...parts);
}

/** A count's words in the language's plural form: `{ one: "{count} lot", other: "{count} lots" }`. */
export type Plural = { one: string; other: string };

/** The form a count takes, its `{count}` left to fill (with `rich` when the number is set apart). */
export function pluralForm(locale: Locale, forms: Plural, count: number): string {
  return new Intl.PluralRules(LOCALES[locale].tag).select(count) === "one" ? forms.one : forms.other;
}

export function plural(locale: Locale, forms: Plural, count: number): string {
  return fill(pluralForm(locale, forms, count), { count: formatCount(locale, count) });
}

/** Whole numbers as the language groups them: "11,821". */
export const formatCount = (locale: Locale, value: number) => new Intl.NumberFormat(LOCALES[locale].tag).format(value);

/** A dynamic key's words (an API code, a URL value), or undefined; never one of Object's own. */
export function lookup<T extends object>(map: T, key: string): T[keyof T] | undefined {
  return Object.hasOwn(map, key) ? (map as Record<string, T[keyof T]>)[key] : undefined;
}
