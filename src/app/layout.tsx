import type { Metadata, Viewport } from "next";
import { Work_Sans } from "next/font/google";
import { JsonLd } from "@/components/JsonLd";
import { SiteBanner } from "@/components/SiteBanner";
import { organization, webSite } from "@/lib/seo/jsonld";
import { site } from "@/lib/site";
import "./globals.css";

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  applicationName: site.name,
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    // Match the banner, which is the first thing under the browser toolbar.
    { media: "(prefers-color-scheme: light)", color: site.colors.white },
    { media: "(prefers-color-scheme: dark)", color: site.colors.dark },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={site.language} className={workSans.variable}>
      <body className="flex min-h-dvh flex-col antialiased">
        <JsonLd data={[organization(), webSite()]} />
        <SiteBanner />
        {children}
      </body>
    </html>
  );
}
