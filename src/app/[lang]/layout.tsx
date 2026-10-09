import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import { I18nProvider } from "@/components/I18nProvider";
import { SiteBanner } from "@/components/SiteBanner";
import { LOCALE_LIST, LOCALES } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { site } from "@/lib/site";
import "../globals.css";

// Self-hosted by next/font at build time; globals.css puts it first in --font-sans.
const workSans = Work_Sans({ subsets: ["latin"], variable: "--font-work-sans" });

/**
 * One static tree per language. Any other first segment is a 404 from `getI18n` (the proxy sends
 * none); `dynamicParams = false` would answer paths no page matches with Next's bare 404 instead
 * of `not-found.tsx` under the banner.
 */
export const generateStaticParams = () => LOCALE_LIST.map((lang) => ({ lang }));

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getI18n();
  return {
    metadataBase: new URL(site.url),
    applicationName: m.site.name,
    title: { default: `${m.pages["/"].title} | ${m.site.name}`, template: `%s | ${m.site.name}` },
    description: m.site.description,
    formatDetection: { telephone: false },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const i18n = await getI18n();
  return (
    <html lang={LOCALES[i18n.locale].tag} className={workSans.variable}>
      <body className="flex min-h-dvh flex-col antialiased">
        <I18nProvider value={i18n}>
          <SiteBanner i18n={i18n} />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
