/** The language of the request being served, for Server Components and server actions. */

import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { DEFAULT_LOCALE, type I18n, isLocale, LOCALE_COOKIE } from "@/lib/i18n";
import { messagesFor } from "@/messages";

/** The page's language, from its `[lang]` segment, and its words. Server Components only. */
export async function getI18n(): Promise<I18n> {
  const locale = await lang();
  if (!isLocale(locale)) notFound();
  return { locale, m: messagesFor(locale) };
}

/** A server action cannot read the page's segment, so it takes the language the proxy remembered. */
export async function actionI18n(): Promise<I18n> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(value) ? value : DEFAULT_LOCALE;
  return { locale, m: messagesFor(locale) };
}
