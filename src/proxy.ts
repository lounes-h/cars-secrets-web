import { type NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, localePath, splitLocale } from "@/lib/i18n";

const YEAR_SECONDS = 365 * 24 * 3600;

/**
 * Every page lives under `app/[lang]`. English has no prefix, so its paths are rewritten to
 * /en/…; Spanish keeps its /es/…. The cookie remembers the language last browsed in, which is
 * what server actions read, since they cannot see the page's URL:
 *
 * - /es/… is served in Spanish, and Spanish is remembered;
 * - /en/… is how the language dialog goes back to English: English is remembered, and the
 *   prefix dropped;
 * - /… is served in English, unless another language is remembered: then a page (a GET) goes to
 *   its prefix, while a form posted from an English page still reaches its action.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { locale, path } = splitLocale(pathname);
  const remembered = request.cookies.get(LOCALE_COOKIE)?.value;

  if (path === pathname) {
    if (isLocale(remembered) && remembered !== DEFAULT_LOCALE && request.method === "GET") {
      return NextResponse.redirect(new URL(localePath(path, remembered) + search, request.url));
    }
    return NextResponse.rewrite(new URL(`/${DEFAULT_LOCALE}${path === "/" ? "" : path}${search}`, request.url));
  }

  const response =
    locale === DEFAULT_LOCALE ? NextResponse.redirect(new URL(path + search, request.url)) : NextResponse.next();
  if (remembered !== locale) {
    response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: YEAR_SECONDS, sameSite: "lax" });
  }
  return response;
}

export const config = {
  // Pages only: not Next's own files, the /auth route handlers, or files with an extension
  // (robots.txt, sitemap.xml, llms.txt, the logo).
  matcher: ["/((?!_next/|auth/|.*\\.).*)"],
};
