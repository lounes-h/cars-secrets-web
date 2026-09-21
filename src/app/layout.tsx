import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SiteBanner } from "@/components/SiteBanner";
import { organization, webSite } from "@/lib/seo/jsonld";
import { site } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  applicationName: site.name,
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={site.language}>
      <body className="flex min-h-dvh flex-col antialiased">
        <JsonLd data={[organization(), webSite()]} />
        <SiteBanner />
        {children}
      </body>
    </html>
  );
}
